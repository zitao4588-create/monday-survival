#!/usr/bin/env python3
from __future__ import annotations

from pathlib import Path
import random

from PIL import Image, ImageDraw, ImageFilter, ImageOps


ROOT = Path(__file__).resolve().parents[1]
REFERENCE = ROOT / "reference"
ASSETS = ROOT / "src" / "assets"
OUT = ASSETS / "shell-v1"
TARGET = (852, 1844)

PAPER = (232, 221, 202)
PAPER_LIGHT = (242, 235, 222)
PAPER_DEEP = (211, 195, 168)
OLIVE = (88, 102, 75)
GOLD = (217, 163, 33)
RUST = (201, 93, 67)


def load_reference(name: str) -> Image.Image:
    source = Image.open(REFERENCE / name).convert("RGB")
    return ImageOps.fit(source, TARGET, method=Image.Resampling.LANCZOS, centering=(0.5, 0.5)).convert("RGBA")


def scale_box(box: tuple[int, int, int, int]) -> tuple[int, int, int, int]:
    return tuple(value * 2 for value in box)


def tile_noise(size: tuple[int, int], alpha: int, seed: int) -> Image.Image:
    noise_src = Image.open(ASSETS / "textures" / "paper-noise.png").convert("L")
    tiled = Image.new("L", size, 0)
    for y in range(0, size[1], noise_src.height):
      for x in range(0, size[0], noise_src.width):
        tiled.paste(noise_src, (x, y))
    tiled = tiled.crop((0, 0, size[0], size[1]))
    rng = random.Random(seed)
    return tiled.point(lambda p: max(0, min(alpha, int(p * 0.035) + rng.randrange(0, 2))))


def paper_patch(
    image: Image.Image,
    box: tuple[int, int, int, int],
    base: tuple[int, int, int] = PAPER,
    radius: int = 0,
    opacity: int = 246,
    seed: int = 1,
) -> None:
    x1, y1, x2, y2 = scale_box(box)
    width = x2 - x1
    height = y2 - y1
    patch = Image.new("RGBA", (width, height), (*base, opacity))
    noise = Image.new("RGBA", (width, height), (90, 68, 42, 0))
    noise.putalpha(tile_noise((width, height), 20, seed))
    patch.alpha_composite(noise)

    mask = Image.new("L", (width, height), 0)
    draw = ImageDraw.Draw(mask)
    if radius:
        draw.rounded_rectangle((0, 0, width, height), radius=radius * 2, fill=255)
    else:
        draw.rectangle((0, 0, width, height), fill=255)
    image.paste(patch, (x1, y1), mask)


def color_patch(
    image: Image.Image,
    box: tuple[int, int, int, int],
    base: tuple[int, int, int],
    radius: int = 0,
    opacity: int = 252,
) -> None:
    x1, y1, x2, y2 = scale_box(box)
    width = x2 - x1
    height = y2 - y1
    patch = Image.new("RGBA", (width, height), (*base, opacity))
    mask = Image.new("L", (width, height), 0)
    draw = ImageDraw.Draw(mask)
    if radius:
        draw.rounded_rectangle((0, 0, width, height), radius=radius * 2, fill=255)
    else:
        draw.rectangle((0, 0, width, height), fill=255)
    image.paste(patch, (x1, y1), mask)


def blur_patch(image: Image.Image, box: tuple[int, int, int, int], radius: int = 10) -> None:
    x1, y1, x2, y2 = scale_box(box)
    crop = image.crop((x1, y1, x2, y2)).filter(ImageFilter.GaussianBlur(radius * 2))
    image.alpha_composite(crop, (x1, y1))


def make_round_shell() -> None:
    image = load_reference("current-round.png")

    # Header dynamic copy and round badge.
    paper_patch(image, (70, 50, 238, 88), PAPER, radius=2, seed=10)
    paper_patch(image, (270, 55, 350, 91), PAPER_LIGHT, radius=2, seed=11)

    # Stat cards: labels, values, and progress blocks.
    for index, x in enumerate((22, 148, 276)):
        paper_patch(image, (x, 128, x + 112, 188), PAPER_LIGHT, radius=3, seed=20 + index)

    # Event content.
    paper_patch(image, (60, 218, 300, 318), PAPER_LIGHT, radius=2, seed=30)
    paper_patch(image, (300, 218, 386, 320), PAPER_LIGHT, radius=2, seed=31)
    paper_patch(image, (72, 330, 274, 388), PAPER_LIGHT, radius=2, seed=32)

    # Choice tickets.
    choices = [
        ((34, 464, 69, 533), OLIVE),
        ((34, 586, 69, 656), GOLD),
        ((34, 707, 69, 776), RUST),
    ]
    for index, (strip_box, color) in enumerate(choices):
        color_patch(image, strip_box, color, radius=0)
        y = strip_box[1] - 12
        paper_patch(image, (78, y, 352, y + 92), PAPER_LIGHT, radius=3, seed=40 + index)
        paper_patch(image, (352, y + 10, 392, y + 78), PAPER_LIGHT, radius=2, seed=50 + index)

    # Bottom tip copy.
    paper_patch(image, (46, 842, 380, 878), PAPER_LIGHT, radius=4, seed=60)

    image.convert("RGB").save(OUT / "round-shell@2x.webp", quality=94, method=6)


def make_feedback_shell() -> None:
    image = load_reference("choice-feedback.png")

    paper_patch(image, (70, 50, 238, 88), PAPER, radius=2, seed=100)
    paper_patch(image, (270, 55, 350, 91), PAPER_LIGHT, radius=2, seed=101)
    for index, x in enumerate((22, 148, 276)):
        paper_patch(image, (x, 128, x + 112, 190), PAPER_LIGHT, radius=3, seed=110 + index)

    paper_patch(image, (70, 284, 292, 330), PAPER_LIGHT, radius=2, seed=120)
    paper_patch(image, (76, 362, 350, 526), PAPER_LIGHT, radius=6, seed=121)
    paper_patch(image, (118, 400, 312, 482), PAPER_LIGHT, radius=4, seed=122)

    paper_patch(image, (62, 596, 150, 626), OLIVE, radius=2, opacity=244, seed=130)
    paper_patch(image, (66, 638, 340, 712), PAPER_LIGHT, radius=3, seed=131)

    paper_patch(image, (118, 788, 308, 842), OLIVE, radius=4, opacity=250, seed=140)

    image.convert("RGB").save(OUT / "feedback-shell@2x.webp", quality=94, method=6)


def make_result_shell() -> None:
    image = load_reference("result-card.png")

    paper_patch(image, (70, 50, 238, 88), PAPER, radius=2, seed=200)
    paper_patch(image, (270, 55, 350, 91), PAPER_LIGHT, radius=2, seed=201)

    paper_patch(image, (110, 166, 316, 262), PAPER_LIGHT, radius=2, seed=210)
    paper_patch(image, (82, 270, 346, 405), PAPER_LIGHT, radius=2, seed=211)

    for index, x in enumerate((56, 156, 256)):
        paper_patch(image, (x, 470, x + 88, 598), PAPER_LIGHT, radius=6, seed=220 + index)

    paper_patch(image, (66, 626, 360, 732), PAPER_LIGHT, radius=5, seed=230)
    paper_patch(image, (72, 768, 354, 826), OLIVE, radius=4, opacity=250, seed=240)
    paper_patch(image, (72, 844, 354, 890), PAPER_LIGHT, radius=4, seed=241)

    image.convert("RGB").save(OUT / "result-shell@2x.webp", quality=94, method=6)


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    make_round_shell()
    make_feedback_shell()
    make_result_shell()
    for path in sorted(OUT.glob("*@2x.webp")):
        with Image.open(path) as image:
            print(f"{path.relative_to(ROOT)} {image.width}x{image.height} {image.mode}")


if __name__ == "__main__":
    main()
