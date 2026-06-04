#!/usr/bin/env python3
"""
Process portrait frames from public/frames (green-screen RGB WebP):
chroma-key, watermark removal, lossless transparent WebP export.

  python3 scripts/process_frames.py
  python3 scripts/process_frames.py -i public/frames -o public/assets/frames
"""

from __future__ import annotations

import argparse
from pathlib import Path

import numpy as np
from PIL import Image

# 1280×720 — corner watermark
CORNER_BOX = (1151, 621, 1280, 689)
ALPHA_CUTOFF = 18


def sample_key_color(r: np.ndarray, g: np.ndarray, b: np.ndarray) -> np.ndarray:
    h, w = r.shape
    strips = [
        r[0:12, :], g[0:12, :], b[0:12, :],
        r[h - 12 : h, :], g[h - 12 : h, :], b[h - 12 : h, :],
        r[:, 0:12], g[:, 0:12], b[:, 0:12],
        r[:, w - 12 : w], g[:, w - 12 : w], b[:, w - 12 : w],
    ]
    rs = np.concatenate([strips[0].ravel(), strips[3].ravel(), strips[6].ravel(), strips[9].ravel()])
    gs = np.concatenate([strips[1].ravel(), strips[4].ravel(), strips[7].ravel(), strips[10].ravel()])
    bs = np.concatenate([strips[2].ravel(), strips[5].ravel(), strips[8].ravel(), strips[11].ravel()])
    ge = gs - np.maximum(rs, bs)
    mask = ge > 8
    if np.count_nonzero(mask) < 100:
        mask = np.ones_like(rs, dtype=bool)
    return np.array([rs[mask].mean(), gs[mask].mean(), bs[mask].mean()], dtype=np.float32)


def color_dist(
    r: np.ndarray, g: np.ndarray, b: np.ndarray, key: np.ndarray
) -> np.ndarray:
    kr, kg, kb = key
    return np.sqrt(1.2 * (r - kr) ** 2 + (g - kg) ** 2 + 1.2 * (b - kb) ** 2)


def chroma_key(
    r: np.ndarray,
    g: np.ndarray,
    b: np.ndarray,
    key: np.ndarray,
) -> np.ndarray:
    """Green-screen matte; avoids dark/cloth false positives."""
    ge = g - np.maximum(r, b)
    dist = color_dist(r, g, b, key)

    # Primary: green dominance
    matte = np.clip((ge - 14) / 22, 0, 1)
    # Secondary: near key color (only where still greenish)
    near_key = (ge > 6) * np.clip((52 - dist) / 24, 0, 1)
    matte = np.maximum(matte, near_key)
    return np.clip(1 - matte, 0, 1)


def despill_fringe(
    r: np.ndarray,
    g: np.ndarray,
    b: np.ndarray,
    alpha: np.ndarray,
) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    """Green spill removal on semi-transparent edges only — keeps cloth color intact."""
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


def flood_green_background(
    r: np.ndarray,
    g: np.ndarray,
    b: np.ndarray,
    alpha: np.ndarray,
    key: np.ndarray,
) -> np.ndarray:
    h, w = r.shape
    ge = g - np.maximum(r, b)
    dist = color_dist(r, g, b, key)

    def is_bg(y: int, x: int) -> bool:
        if alpha[y, x] < ALPHA_CUTOFF / 255.0:
            return True
        if ge[y, x] > 10 and dist[y, x] < 50:
            return True
        if ge[y, x] > 6 and dist[y, x] < 28:
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


def remove_watermark(
    r: np.ndarray, g: np.ndarray, b: np.ndarray, x0: int, y0: int, x1: int, y1: int
) -> None:
    cr, cg, cb = r[y0:y1, x0:x1], g[y0:y1, x0:x1], b[y0:y1, x0:x1]
    lum = 0.299 * cr + 0.587 * cg + 0.114 * cb
    ge = cg - np.maximum(cr, cb)
    bg_lum = np.median(lum[ge > 10]) if np.any(ge > 10) else lum.mean()
    logo = lum > bg_lum + 10
    r[y0:y1, x0:x1][logo] = 0
    g[y0:y1, x0:x1][logo] = 0
    b[y0:y1, x0:x1][logo] = 0


def process_frame(pixels: np.ndarray) -> np.ndarray:
    h, w, _ = pixels.shape
    orig_r = pixels[:, :, 0].astype(np.float32)
    orig_g = pixels[:, :, 1].astype(np.float32)
    orig_b = pixels[:, :, 2].astype(np.float32)

    key = sample_key_color(orig_r, orig_g, orig_b)
    alpha = chroma_key(orig_r, orig_g, orig_b, key)

    r, g, b = orig_r.copy(), orig_g.copy(), orig_b.copy()
    r, g, b = despill_fringe(r, g, b, alpha)

    # Solid subject: restore source pixels (no color drift / cloth shifts)
    core = alpha >= 0.9
    r[core] = orig_r[core]
    g[core] = orig_g[core]
    b[core] = orig_b[core]

    border_bg = flood_green_background(r, g, b, alpha, key)
    alpha = np.where(border_bg, 0.0, alpha)

    # Crush green halos on soft edges
    ge = g - np.maximum(r, b)
    dist = color_dist(r, g, b, key)
    halo = (alpha > 0) & (alpha < 0.5) & ((ge > 4) | (dist < 38))
    alpha[halo] *= np.clip(1 - (ge[halo] - 2) / 16, 0, 1) * np.clip(
        (dist[halo] - 5) / 28, 0, 1
    )

    alpha = np.where(alpha < ALPHA_CUTOFF / 255.0, 0.0, alpha)
    opaque = alpha >= 1.0 - (ALPHA_CUTOFF / 255.0)
    r[opaque] = orig_r[opaque]
    g[opaque] = orig_g[opaque]
    b[opaque] = orig_b[opaque]

    zero = alpha == 0
    r = np.where(zero, 0, np.clip(r, 0, 255))
    g = np.where(zero, 0, np.clip(g, 0, 255))
    b = np.where(zero, 0, np.clip(b, 0, 255))

    x0, y0, x1, y1 = CORNER_BOX
    remove_watermark(r, g, b, x0, y0, x1, y1)
    alpha[y0:y1, x0:x1] = 0

    out = np.zeros((h, w, 4), dtype=np.uint8)
    out[:, :, 0] = r.astype(np.uint8)
    out[:, :, 1] = g.astype(np.uint8)
    out[:, :, 2] = b.astype(np.uint8)
    out[:, :, 3] = (alpha * 255).astype(np.uint8)
    return out


def save_webp(img: Image.Image, dst: Path, *, lossless: bool, quality: int) -> int:
    dst.parent.mkdir(parents=True, exist_ok=True)
    # Lossless WebP often keeps junk RGB where alpha=0 (visible on dark sites).
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
    return dst.stat().st_size


def process_file(
    src: Path, dst: Path, *, lossless: bool, quality: int
) -> int:
    img = Image.open(src).convert("RGBA")
    arr = process_frame(np.array(img, dtype=np.float32))
    return save_webp(Image.fromarray(arr, "RGBA"), dst, lossless=lossless, quality=quality)


def dir_size(path: Path) -> int:
    return sum(f.stat().st_size for f in path.glob("*.webp") if f.is_file())


def main() -> None:
    root = Path(__file__).resolve().parent.parent
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "-i",
        "--input",
        type=Path,
        default=root / "public" / "frames",
    )
    parser.add_argument(
        "-o",
        "--output",
        type=Path,
        default=root / "public" / "assets" / "frames",
    )
    parser.add_argument(
        "-q",
        "--quality",
        type=int,
        default=100,
        help="WebP quality 0-100 (default 100, near-lossless color + alpha)",
    )
    parser.add_argument(
        "--lossless",
        action="store_true",
        help="Lossless WebP (larger; may store RGB under transparent pixels)",
    )
    parser.add_argument(
        "--no-replace",
        action="store_true",
        help="Do not clear output folder before processing",
    )
    args = parser.parse_args()

    files = sorted(args.input.glob("frame_*.webp"))
    if not files:
        raise SystemExit(f"No frame_*.webp in {args.input}")

    if not args.no_replace and args.output.exists():
        for old in args.output.glob("*.webp"):
            old.unlink()

    input_bytes = dir_size(args.input)
    mode = "lossless" if args.lossless else f"lossy q={args.quality}"
    print(f"Processing {len(files)} frames from originals ({mode} WebP)")
    print(f"  input:  {args.input} ({input_bytes / 1024 / 1024:.1f} MB)")
    print(f"  output: {args.output}")

    for i, src in enumerate(files):
        process_file(src, args.output / src.name, lossless=args.lossless, quality=args.quality)
        if (i + 1) % 20 == 0 or i + 1 == len(files):
            print(f"  {i + 1}/{len(files)}")

    output_bytes = dir_size(args.output)
    print(f"Done. {output_bytes / 1024 / 1024:.1f} MB output")


if __name__ == "__main__":
    main()
