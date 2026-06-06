#!/usr/bin/env python3
"""
Process portrait frames: remove background (black or green-screen) and export
high-quality transparent WebP.

  python3 scripts/process_frames.py
  python3 scripts/process_frames.py -i public/new-frames -o public/avif-frames --format avif
"""

from __future__ import annotations

import argparse
from pathlib import Path

import numpy as np
from PIL import Image

ALPHA_CUTOFF = 8
CORNER_PATCH = 36  # px — sample backdrop from true bottom-right corner
CORNER_RADIUS = 115  # px — search radius from bottom-right for sparkle badge


def smoothstep(edge0: float, edge1: float, x: np.ndarray) -> np.ndarray:
    t = np.clip((x - edge0) / max(edge1 - edge0, 1e-6), 0, 1)
    return t * t * (3 - 2 * t)


def luminance(r: np.ndarray, g: np.ndarray, b: np.ndarray) -> np.ndarray:
    return 0.299 * r + 0.587 * g + 0.114 * b


def sample_background(
    r: np.ndarray, g: np.ndarray, b: np.ndarray, *, green_screen: bool
) -> np.ndarray:
    """Median color from corner patches (avoids edge contamination)."""
    h, w = r.shape
    pad = 10
    patches = [
        (slice(0, pad), slice(0, pad)),
        (slice(0, pad), slice(w - pad, w)),
        (slice(h - pad, h), slice(0, pad)),
        (slice(h - pad, h), slice(w - pad, w)),
        (slice(0, pad), slice(w // 2 - pad, w // 2 + pad)),
        (slice(h - pad, h), slice(w // 2 - pad, w // 2 + pad)),
    ]
    rs, gs, bs = [], [], []
    for ys, xs in patches:
        pr, pg, pb = r[ys, xs], g[ys, xs], b[ys, xs]
        if green_screen:
            ge = pg - np.maximum(pr, pb)
            mask = ge > 6
            if np.count_nonzero(mask) < 20:
                mask = np.ones(pr.shape, dtype=bool)
        else:
            lum = luminance(pr, pg, pb)
            mask = lum < 28
            if np.count_nonzero(mask) < 20:
                mask = np.ones(pr.shape, dtype=bool)
        rs.append(pr[mask])
        gs.append(pg[mask])
        bs.append(pb[mask])
    return np.array(
        [np.median(np.concatenate(rs)), np.median(np.concatenate(gs)), np.median(np.concatenate(bs))],
        dtype=np.float32,
    )


def color_dist(
    r: np.ndarray, g: np.ndarray, b: np.ndarray, key: np.ndarray
) -> np.ndarray:
    return np.sqrt((r - key[0]) ** 2 + (g - key[1]) ** 2 + (b - key[2]) ** 2)


def detect_green_screen(r: np.ndarray, g: np.ndarray, b: np.ndarray) -> bool:
    ge = g - np.maximum(r, b)
    border = np.concatenate(
        [ge[0:16, :].ravel(), ge[-16:, :].ravel(), ge[:, 0:16].ravel(), ge[:, -16:].ravel()]
    )
    return float(np.median(border)) > 12


def matte_black(
    r: np.ndarray, g: np.ndarray, b: np.ndarray, key: np.ndarray
) -> np.ndarray:
    """Soft matte for black/dark studio backgrounds — preserves hair fringe."""
    dist = color_dist(r, g, b, key)
    lum = luminance(r, g, b)
    key_lum = float(luminance(key[0], key[1], key[2]))

    # Distance + luminance (subject is brighter than backdrop)
    a_dist = smoothstep(6, 38, dist)
    a_lum = smoothstep(key_lum + 4, key_lum + 22, lum)
    alpha = np.maximum(a_dist, a_lum)

    # Crush only near-pure background
    near_bg = (dist < 10) & (lum < key_lum + 10)
    alpha = np.where(near_bg, np.minimum(alpha, 0.02), alpha)
    return np.clip(alpha, 0, 1)


def matte_green(
    r: np.ndarray, g: np.ndarray, b: np.ndarray, key: np.ndarray
) -> np.ndarray:
    ge = g - np.maximum(r, b)
    dist = color_dist(r, g, b, key)
    matte = np.clip((ge - 14) / 22, 0, 1)
    near_key = (ge > 6) * np.clip((52 - dist) / 24, 0, 1)
    matte = np.maximum(matte, near_key)
    return np.clip(1 - matte, 0, 1)


def flood_background(
    r: np.ndarray,
    g: np.ndarray,
    b: np.ndarray,
    alpha: np.ndarray,
    key: np.ndarray,
    *,
    green_screen: bool,
) -> np.ndarray:
    h, w = r.shape
    dist = color_dist(r, g, b, key)
    lum = luminance(r, g, b)
    key_lum = float(luminance(key[0], key[1], key[2]))

    if green_screen:
        ge = g - np.maximum(r, b)

        def is_bg(y: int, x: int) -> bool:
            if alpha[y, x] < ALPHA_CUTOFF / 255.0:
                return True
            if ge[y, x] > 10 and dist[y, x] < 50:
                return True
            if ge[y, x] > 6 and dist[y, x] < 28:
                return True
            return False
    else:

        def is_bg(y: int, x: int) -> bool:
            if alpha[y, x] < ALPHA_CUTOFF / 255.0:
                return True
            if dist[y, x] < 14 and lum[y, x] < key_lum + 14:
                return True
            if lum[y, x] < key_lum + 6:
                return True
            return False

    visited = np.zeros((h, w), dtype=bool)
    stack: list[tuple[int, int]] = []
    for x in range(w):
        stack.extend([(0, x), (h - 1, x)])
    for y in range(1, h - 1):
        stack.extend([(y, 0), (y, w - 1)])

    while stack:
        y, x = stack.pop()
        if y < 0 or y >= h or x < 0 or x >= w or visited[y, x]:
            continue
        if not is_bg(y, x):
            continue
        visited[y, x] = True
        stack.extend(((y - 1, x), (y + 1, x), (y, x - 1), (y, x + 1)))
    return visited


def dilate_mask(mask: np.ndarray, radius: int = 1) -> np.ndarray:
    if radius < 1:
        return mask
    h, w = mask.shape
    out = mask.copy()
    for _ in range(radius):
        dil = out.copy()
        for dy in (-1, 0, 1):
            for dx in (-1, 0, 1):
                if dy == 0 and dx == 0:
                    continue
                ys = slice(max(0, -dy), h - max(0, dy))
                xs = slice(max(0, -dx), w - max(0, dx))
                yd = slice(max(0, dy), h - max(0, -dy))
                xd = slice(max(0, dx), w - max(0, -dx))
                dil[yd, xd] |= out[ys, xs]
        out = dil
    return out


def morph_close_mask(mask: np.ndarray, radius: int = 1) -> np.ndarray:
    """Fill pinholes inside the subject without scipy."""
    if radius < 1:
        return mask
    h, w = mask.shape
    out = mask.copy()
    for _ in range(radius):
        dil = out.copy()
        for dy in (-1, 0, 1):
            for dx in (-1, 0, 1):
                if dy == 0 and dx == 0:
                    continue
                ys = slice(max(0, -dy), h - max(0, dy))
                xs = slice(max(0, -dx), w - max(0, dx))
                yd = slice(max(0, dy), h - max(0, -dy))
                xd = slice(max(0, dx), w - max(0, -dx))
                dil[yd, xd] |= out[ys, xs]
        out = dil
    for _ in range(radius):
        ero = out.copy()
        for dy in (-1, 0, 1):
            for dx in (-1, 0, 1):
                if dy == 0 and dx == 0:
                    continue
                ys = slice(max(0, -dy), h - max(0, dy))
                xs = slice(max(0, -dx), w - max(0, dx))
                yd = slice(max(0, dy), h - max(0, -dy))
                xd = slice(max(0, dx), w - max(0, -dx))
                ero[yd, xd] &= out[ys, xs]
        out = ero
    return out


def refine_alpha(
    alpha: np.ndarray,
    r: np.ndarray,
    g: np.ndarray,
    b: np.ndarray,
    key: np.ndarray,
    *,
    green_screen: bool,
) -> np.ndarray:
    """Close small holes, keep a soft outer fringe for hair."""
    solid = alpha >= 0.55
    closed = morph_close_mask(solid, radius=1)
    alpha = np.where(closed & (alpha < 0.55), np.maximum(alpha, 0.55), alpha)

    dist = color_dist(r, g, b, key)
    lum = luminance(r, g, b)
    key_lum = float(luminance(key[0], key[1], key[2]))

    if green_screen:
        ge = g - np.maximum(r, b)
        fringe = (alpha > 0.04) & (alpha < 0.65) & ((ge > 3) | (dist < 42))
        alpha[fringe] *= np.clip(1 - (ge[fringe] - 1) / 18, 0, 1) * np.clip(
            (dist[fringe] - 4) / 30, 0, 1
        )
    else:
        # Remove gray backdrop residue on semi-transparent pixels only
        residue = (alpha > 0.03) & (alpha < 0.72) & (dist < 22) & (lum < key_lum + 18)
        alpha[residue] *= smoothstep(4, 20, dist[residue])

    return np.clip(alpha, 0, 1)


def despill_green(
    r: np.ndarray,
    g: np.ndarray,
    b: np.ndarray,
    alpha: np.ndarray,
) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    ge = np.clip(g - np.maximum(r, b), 0, None)
    fringe = (alpha > 0.05) & (alpha < 0.92) & (ge > 2)
    if not np.any(fringe):
        return r, g, b
    w = (1 - alpha[fringe]) * np.clip(ge[fringe] / 24, 0, 1)
    r = r.copy()
    g = g.copy()
    b = b.copy()
    r[fringe] = r[fringe] + w * ge[fringe] * 0.15
    g[fringe] = g[fringe] - w * ge[fringe] * 0.75
    b[fringe] = b[fringe] + w * ge[fringe] * 0.15
    return r, g, b


def remove_corner_watermark(
    r: np.ndarray,
    g: np.ndarray,
    b: np.ndarray,
    alpha: np.ndarray,
    *,
    green_screen: bool,
) -> None:
    """Remove faint sparkle badge in bottom-right (very low contrast on black bg)."""
    h, w = r.shape
    cs = min(CORNER_PATCH, h, w)
    br_r = r[h - cs : h, w - cs : w]
    br_g = g[h - cs : h, w - cs : w]
    br_b = b[h - cs : h, w - cs : w]
    key_local = np.array(
        [np.median(br_r), np.median(br_g), np.median(br_b)],
        dtype=np.float32,
    )
    bg_lum = float(luminance(key_local[0], key_local[1], key_local[2]))

    x0 = max(0, w - CORNER_RADIUS - 24)
    y0 = max(0, h - CORNER_RADIUS - 24)
    yy, xx = np.mgrid[y0:h, x0:w]
    dist_br = np.hypot((w - 1 - xx).astype(np.float32), (h - 1 - yy).astype(np.float32))
    near = dist_br <= CORNER_RADIUS

    cr = r[y0:h, x0:w]
    cg = g[y0:h, x0:w]
    cb = b[y0:h, x0:w]
    ca = alpha[y0:h, x0:w]
    clum = luminance(cr, cg, cb)
    cdist = color_dist(cr, cg, cb, key_local)

    logo = np.zeros_like(near, dtype=bool)
    if green_screen:
        ge = cg - np.maximum(cr, cb)
        bg_lum_roi = np.median(clum[ge > 8]) if np.any(ge > 8) else bg_lum
        logo[near] = (clum[near] > bg_lum_roi + 6) | (
            (ge[near] > 4) & (cdist[near] > 8)
        )
    else:
        # Faint gray/silver sparkle — only a few levels above pure black
        logo[near] = (
            (clum[near] > bg_lum + 1.5)
            | (cdist[near] > 4.0)
            | (ca[near] > 0.04)
        ) & (clum[near] < 90)

        # Hard wipe inner corner (badge + anti-alias halo)
        inner = dist_br <= 78
        logo[inner] |= (clum[inner] > bg_lum + 1.0) | (ca[inner] > 0.02)

    logo = dilate_mask(logo, 2)

    cr[logo] = 0
    cg[logo] = 0
    cb[logo] = 0
    ca[logo] = 0


def process_frame(pixels: np.ndarray) -> np.ndarray:
    h, w, _ = pixels.shape
    orig_r = pixels[:, :, 0].astype(np.float32)
    orig_g = pixels[:, :, 1].astype(np.float32)
    orig_b = pixels[:, :, 2].astype(np.float32)

    green_screen = detect_green_screen(orig_r, orig_g, orig_b)
    key = sample_background(orig_r, orig_g, orig_b, green_screen=green_screen)

    if green_screen:
        alpha = matte_green(orig_r, orig_g, orig_b, key)
    else:
        alpha = matte_black(orig_r, orig_g, orig_b, key)

    r, g, b = orig_r.copy(), orig_g.copy(), orig_b.copy()
    if green_screen:
        r, g, b = despill_green(r, g, b, alpha)

    # Solid subject: always use source pixels (no color drift)
    core = alpha >= 0.88
    r[core] = orig_r[core]
    g[core] = orig_g[core]
    b[core] = orig_b[core]

    border_bg = flood_background(r, g, b, alpha, key, green_screen=green_screen)
    alpha = np.where(border_bg, 0.0, alpha)

    alpha = refine_alpha(alpha, r, g, b, key, green_screen=green_screen)

    # Restore source on opaque pixels
    alpha = np.where(alpha < ALPHA_CUTOFF / 255.0, 0.0, alpha)
    opaque = alpha >= 1.0 - (ALPHA_CUTOFF / 255.0)
    mid = (alpha >= 0.35) & ~opaque
    r[opaque | mid] = orig_r[opaque | mid]
    g[opaque | mid] = orig_g[opaque | mid]
    b[opaque | mid] = orig_b[opaque | mid]

    zero = alpha == 0
    r = np.where(zero, 0, np.clip(r, 0, 255))
    g = np.where(zero, 0, np.clip(g, 0, 255))
    b = np.where(zero, 0, np.clip(b, 0, 255))

    remove_corner_watermark(r, g, b, alpha, green_screen=green_screen)

    out = np.zeros((h, w, 4), dtype=np.uint8)
    out[:, :, 0] = r.astype(np.uint8)
    out[:, :, 1] = g.astype(np.uint8)
    out[:, :, 2] = b.astype(np.uint8)
    out[:, :, 3] = (alpha * 255).astype(np.uint8)
    return out


def save_image(
    img: Image.Image,
    dst: Path,
    *,
    fmt: str,
    lossless: bool,
    quality: int,
    avif_speed: int,
) -> int:
    dst.parent.mkdir(parents=True, exist_ok=True)
    ext = dst.suffix.lower()

    if fmt == "avif" or ext == ".avif":
        img.save(
            dst,
            format="AVIF",
            quality=quality,
            speed=max(0, min(10, avif_speed)),
        )
    elif fmt == "webp" or ext == ".webp":
        if lossless:
            img.save(dst, format="WEBP", lossless=True, method=6)
        else:
            img.save(
                dst,
                format="WEBP",
                quality=quality,
                method=6,
                alpha_quality=100,
                exact=True,
            )
    else:
        raise ValueError(f"Unsupported format: {fmt}")

    return dst.stat().st_size


def output_name(src: Path, fmt: str) -> str:
    if fmt == "avif":
        return src.with_suffix(".avif").name
    return src.with_suffix(".webp").name


def process_file(
    src: Path,
    dst: Path,
    *,
    fmt: str,
    lossless: bool,
    quality: int,
    avif_speed: int,
) -> int:
    img = Image.open(src).convert("RGBA")
    arr = process_frame(np.array(img, dtype=np.float32))
    return save_image(
        Image.fromarray(arr, "RGBA"),
        dst,
        fmt=fmt,
        lossless=lossless,
        quality=quality,
        avif_speed=avif_speed,
    )


def dir_size(path: Path, fmt: str) -> int:
    ext = ".avif" if fmt == "avif" else ".webp"
    return sum(f.stat().st_size for f in path.glob(f"*{ext}") if f.is_file())


def collect_inputs(input_dir: Path) -> list[Path]:
    for pattern in ("frame_*.webp", "frame_*.avif", "frame_*.png"):
        files = sorted(input_dir.glob(pattern))
        if files:
            return files
    return []


def main() -> None:
    root = Path(__file__).resolve().parent.parent
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "-i",
        "--input",
        type=Path,
        default=root / "public" / "new-frames",
    )
    parser.add_argument(
        "-o",
        "--output",
        type=Path,
        default=root / "public" / "avif-frames",
    )
    parser.add_argument(
        "--format",
        choices=("avif", "webp"),
        default="avif",
        help="Output image format (default: avif)",
    )
    parser.add_argument(
        "-q",
        "--quality",
        type=int,
        default=82,
        help="Output quality 0-100 (default 82 for AVIF, good size/quality balance)",
    )
    parser.add_argument(
        "--avif-speed",
        type=int,
        default=6,
        help="AVIF encoder speed 0-10, higher = faster encode (default 6)",
    )
    parser.add_argument(
        "--lossless",
        action="store_true",
        help="Lossless WebP only (ignored for AVIF)",
    )
    parser.add_argument(
        "--no-replace",
        action="store_true",
        help="Do not clear output folder before processing",
    )
    args = parser.parse_args()

    files = collect_inputs(args.input)
    if not files:
        raise SystemExit(f"No frame_*.(webp|avif|png) in {args.input}")

    out_ext = ".avif" if args.format == "avif" else ".webp"
    if not args.no_replace and args.output.exists():
        for old in args.output.glob(f"*{out_ext}"):
            old.unlink()

    input_bytes = dir_size(args.input, args.format) if args.input == args.output else sum(
        f.stat().st_size for f in files
    )
    if args.format == "avif":
        mode = f"avif q={args.quality} speed={args.avif_speed}"
    else:
        mode = "lossless WebP" if args.lossless else f"webp q={args.quality}"
    print(f"Processing {len(files)} frames ({mode})")
    print(f"  input:  {args.input} ({input_bytes / 1024 / 1024:.1f} MB)")
    print(f"  output: {args.output}")

    for i, src in enumerate(files):
        dst = args.output / output_name(src, args.format)
        process_file(
            src,
            dst,
            fmt=args.format,
            lossless=args.lossless,
            quality=args.quality,
            avif_speed=args.avif_speed,
        )
        if (i + 1) % 24 == 0 or i + 1 == len(files):
            print(f"  {i + 1}/{len(files)}")

    output_bytes = dir_size(args.output, args.format)
    print(f"Done. {output_bytes / 1024 / 1024:.1f} MB output ({len(files)} frames)")


if __name__ == "__main__":
    main()
