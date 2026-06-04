#!/usr/bin/env python3
"""
Process portrait frames: remove green-screen BG, remove corner watermark,
export transparent WebP at native resolution with efficient high-quality compression.
"""

from __future__ import annotations

import argparse
import shutil
from pathlib import Path

import numpy as np
from PIL import Image

# 1280×720 source — corner watermark region
CORNER_BOX = (1151, 621, 1280, 689)


def sample_key_color(pixels: np.ndarray) -> np.ndarray:
    h, w = pixels.shape[:2]
    strips = [
        pixels[0:6, :, :3],
        pixels[h - 6 : h, :, :3],
        pixels[:, 0:6, :3],
        pixels[:, w - 6 : w, :3],
    ]
    all_samples = np.concatenate([s.reshape(-1, 3) for s in strips])
    r, g, b = all_samples[:, 0], all_samples[:, 1], all_samples[:, 2]
    green_mask = (g > r + 8) & (g > b + 8)
    green_samples = all_samples[green_mask]
    if len(green_samples) < 80:
        green_samples = all_samples
    return green_samples.mean(axis=0)


def remove_watermark_pixels(
    r: np.ndarray, g: np.ndarray, b: np.ndarray, x0: int, y0: int, x1: int, y1: int
) -> None:
    cr, cg, cb = r[y0:y1, x0:x1], g[y0:y1, x0:x1], b[y0:y1, x0:x1]
    lum = 0.299 * cr + 0.587 * cg + 0.114 * cb
    green_excess = cg - np.maximum(cr, cb)
    bg_lum = np.median(lum[green_excess > 10]) if np.any(green_excess > 10) else lum.mean()
    logo = lum > bg_lum + 10
    r[y0:y1, x0:x1][logo] = 0
    g[y0:y1, x0:x1][logo] = 0
    b[y0:y1, x0:x1][logo] = 0


def process_frame(pixels: np.ndarray) -> np.ndarray:
    h, w = pixels.shape[:2]
    key = sample_key_color(pixels)
    r = pixels[:, :, 0].astype(np.float32)
    g = pixels[:, :, 1].astype(np.float32)
    b = pixels[:, :, 2].astype(np.float32)
    a_in = pixels[:, :, 3].astype(np.float32) / 255.0

    green_excess = g - np.maximum(r, b)
    kr, kg, kb = key
    dist = np.sqrt(1.5 * (r - kr) ** 2 + (g - kg) ** 2 + 1.5 * (b - kb) ** 2)

    bg = np.maximum((green_excess - 10) / 16, 0)
    bg = np.maximum(bg, (65 - dist) / 22)
    bg = np.clip(bg, 0, 1)

    alpha = np.clip((1 - bg) * a_in, 0, 1)

    fringe = (alpha > 0.03) & (alpha < 0.97) & (green_excess > 5)
    alpha[fringe] *= np.clip(1 - (green_excess[fringe] - 5) / 22, 0, 1)

    spill = np.clip(g - np.maximum(r, b), 0, None)
    r_out = r + spill * (1 - alpha) * 0.12
    g_out = g - spill * (1 - alpha) * 0.88
    b_out = b + spill * (1 - alpha) * 0.12

    out = np.zeros((h, w, 4), dtype=np.float32)
    out[:, :, 0] = np.clip(r_out, 0, 255)
    out[:, :, 1] = np.clip(g_out, 0, 255)
    out[:, :, 2] = np.clip(b_out, 0, 255)
    out[:, :, 3] = alpha * 255

    x0, y0, x1, y1 = CORNER_BOX
    remove_watermark_pixels(out[:, :, 0], out[:, :, 1], out[:, :, 2], x0, y0, x1, y1)
    out[y0:y1, x0:x1, 3] = 0

    return out.astype(np.uint8)


def save_webp(img: Image.Image, dst: Path, quality: int) -> int:
    dst.parent.mkdir(parents=True, exist_ok=True)
    img.save(
        dst,
        format="WEBP",
        quality=quality,
        method=6,
        alpha_quality=100,
    )
    return dst.stat().st_size


def process_file(src: Path, dst: Path, quality: int) -> int:
    img = Image.open(src).convert("RGBA")
    arr = process_frame(np.array(img, dtype=np.float32))
    result = Image.fromarray(arr, "RGBA")
    return save_webp(result, dst, quality)


def dir_size(path: Path) -> int:
    return sum(f.stat().st_size for f in path.glob("*.webp") if f.is_file())


def main() -> None:
    root = Path(__file__).resolve().parent.parent
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "-i",
        "--input",
        type=Path,
        default=root / "public" / "new_frames",
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
        default=93,
        help="WebP quality 0-100 (default 93 — high quality, smaller than raw RGB)",
    )
    parser.add_argument(
        "--replace",
        action="store_true",
        default=True,
        help="Clear output folder before processing (default: on)",
    )
    args = parser.parse_args()

    files = sorted(args.input.glob("frame_*.webp"))
    if not files:
        raise SystemExit(f"No frame_*.webp in {args.input}")

    if args.replace and args.output.exists():
        for old in args.output.glob("*.webp"):
            old.unlink()

    input_bytes = dir_size(args.input)
    print(f"Processing {len(files)} frames @ {args.quality} quality, native 1280×720")
    print(f"  input:  {args.input} ({input_bytes / 1024 / 1024:.1f} MB)")
    print(f"  output: {args.output}")

    for i, src in enumerate(files):
        process_file(src, args.output / src.name, args.quality)
        if (i + 1) % 20 == 0 or i + 1 == len(files):
            print(f"  {i + 1}/{len(files)}")

    output_bytes = dir_size(args.output)
    saved = input_bytes - output_bytes
    pct = (output_bytes / input_bytes * 100) if input_bytes else 0
    print(
        f"Done. {output_bytes / 1024 / 1024:.1f} MB ({pct:.0f}% of input, "
        f"saved {saved / 1024 / 1024:.1f} MB)"
    )


if __name__ == "__main__":
    main()
