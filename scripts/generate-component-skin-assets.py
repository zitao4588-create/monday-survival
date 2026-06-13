#!/usr/bin/env python3
from __future__ import annotations

from pathlib import Path
import math
import random
import shutil

from PIL import Image, ImageChops, ImageDraw, ImageEnhance, ImageFilter, ImageOps


ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "src" / "assets"
SKIN_V2 = SRC / "skin-v2"
OUT = SRC / "component-skins"
REFERENCE = ROOT / "reference"
TARGET = (852, 1844)

PAPER = (232, 221, 202, 255)
PAPER_LIGHT = (243, 234, 219, 255)
PAPER_DEEP = (220, 202, 174, 255)
INK = (31, 33, 27, 255)
OLIVE = (88, 102, 75, 255)
GOLD = (217, 163, 33, 255)
RUST = (201, 93, 67, 255)
CREAM = (255, 244, 223, 255)
SHADOW = (34, 22, 12, 78)


def ensure_out() -> None:
    OUT.mkdir(parents=True, exist_ok=True)


def open_rgba(path: Path) -> Image.Image:
    return Image.open(path).convert("RGBA")


def save_png(image: Image.Image, name: str) -> None:
    image.save(OUT / name, optimize=True)


def save_webp(image: Image.Image, name: str) -> None:
    image.convert("RGB").save(OUT / name, quality=94, method=6)


def copy_asset(source: Path, name: str) -> None:
    shutil.copyfile(source, OUT / name)


def fit_cover(image: Image.Image, size: tuple[int, int]) -> Image.Image:
    return ImageOps.fit(image, size, method=Image.Resampling.LANCZOS, centering=(0.5, 0.5))


def noise_layer(size: tuple[int, int], alpha: int = 18, seed: int = 1) -> Image.Image:
    source = Image.open(SRC / "textures" / "paper-noise.png").convert("L")
    tiled = Image.new("L", size, 0)
    for y in range(0, size[1], source.height):
        for x in range(0, size[0], source.width):
            tiled.paste(source, (x, y))
    rng = random.Random(seed)
    tiled = tiled.crop((0, 0, size[0], size[1]))
    return tiled.point(lambda p: max(0, min(alpha, int(p * 0.045) + rng.randrange(0, 3))))


def paper_fill(size: tuple[int, int], base: tuple[int, int, int, int] = PAPER_LIGHT, seed: int = 1) -> Image.Image:
    fill = Image.new("RGBA", size, base)
    noise = Image.new("RGBA", size, (80, 58, 36, 0))
    noise.putalpha(noise_layer(size, 20, seed))
    fill.alpha_composite(noise)
    return fill


def paste_paper_patch(image: Image.Image, box: tuple[int, int, int, int], seed: int = 1) -> None:
    x1, y1, x2, y2 = box
    patch = paper_fill((x2 - x1, y2 - y1), PAPER_LIGHT, seed)
    image.alpha_composite(patch, (x1, y1))


def clear_rect(image: Image.Image, box: tuple[int, int, int, int]) -> None:
    draw = ImageDraw.Draw(image)
    draw.rectangle(box, fill=(0, 0, 0, 0))


def draw_cut_paper(size: tuple[int, int], cut: int, fill: tuple[int, int, int, int], seed: int = 1) -> Image.Image:
    width, height = size
    paper = Image.new("RGBA", size, (0, 0, 0, 0))
    shape = [
        (cut, 0),
        (width - cut, 0),
        (width, cut),
        (width, height - cut),
        (width - cut, height),
        (cut, height),
        (0, height - cut),
        (0, cut),
    ]

    shadow = Image.new("RGBA", size, (0, 0, 0, 0))
    shadow_draw = ImageDraw.Draw(shadow)
    shadow_draw.polygon(shape, fill=SHADOW)
    shadow = shadow.filter(ImageFilter.GaussianBlur(10))
    paper.alpha_composite(shadow, (0, 4))

    texture = paper_fill(size, fill, seed)
    mask = Image.new("L", size, 0)
    mask_draw = ImageDraw.Draw(mask)
    mask_draw.polygon(shape, fill=255)
    paper.paste(texture, (0, 0), mask)

    draw = ImageDraw.Draw(paper)
    inset = 14
    inner = [
        (cut + inset, inset),
        (width - cut - inset, inset),
        (width - inset, cut + inset),
        (width - inset, height - cut - inset),
        (width - cut - inset, height - inset),
        (cut + inset, height - inset),
        (inset, height - cut - inset),
        (inset, cut + inset),
    ]
    draw.line(inner + [inner[0]], fill=(42, 38, 30, 96), width=2)
    return paper


def make_desk_bg() -> None:
    wood = Image.open(SRC / "textures" / "wood.webp").convert("RGB")
    bg = fit_cover(wood, TARGET).convert("RGBA")
    overlay = Image.new("RGBA", TARGET, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    draw.rectangle((0, 0, TARGET[0], TARGET[1]), fill=(29, 16, 9, 34))
    for y in range(0, TARGET[1], 320):
        draw.rectangle((0, y + 158, TARGET[0], y + 164), fill=(24, 13, 7, 52))
        draw.rectangle((0, y + 166, TARGET[0], y + 171), fill=(255, 236, 190, 16))
    vignette = Image.new("L", TARGET, 0)
    vignette_draw = ImageDraw.Draw(vignette)
    vignette_draw.ellipse((-260, -260, TARGET[0] + 260, TARGET[1] + 260), fill=150)
    vignette = ImageOps.invert(vignette.filter(ImageFilter.GaussianBlur(120)))
    shade = Image.new("RGBA", TARGET, (0, 0, 0, 0))
    shade.putalpha(vignette.point(lambda p: int(p * 0.55)))
    bg.alpha_composite(overlay)
    bg.alpha_composite(shade)
    save_webp(bg, "desk-bg@2x.webp")


def draw_tape(canvas: Image.Image, box: tuple[int, int, int, int], angle: float = 0) -> None:
    x1, y1, x2, y2 = box
    tape = Image.new("RGBA", (x2 - x1, y2 - y1), (0, 0, 0, 0))
    draw = ImageDraw.Draw(tape)
    draw.rectangle((0, 0, tape.width, tape.height), fill=(103, 119, 92, 170))
    draw.rectangle((0, 0, tape.width, tape.height), outline=(247, 238, 222, 44), width=2)
    for x in range(12, tape.width, 32):
        draw.line((x, 0, x - 12, tape.height), fill=(255, 244, 223, 58), width=4)
    if angle:
        tape = tape.rotate(angle, expand=True, resample=Image.Resampling.BICUBIC)
    canvas.alpha_composite(tape, (x1, y1))


def draw_coffee_cup(canvas: Image.Image) -> None:
    cup = Image.new("RGBA", (210, 210), (0, 0, 0, 0))
    draw = ImageDraw.Draw(cup)
    draw.ellipse((-54, -48, 176, 180), fill=(245, 234, 210, 255))
    draw.ellipse((-30, -22, 148, 154), fill=(87, 65, 45, 255))
    draw.ellipse((-8, 2, 120, 128), fill=(42, 24, 15, 255))
    draw.arc((-40, -34, 158, 164), start=314, end=54, fill=(255, 252, 238, 210), width=8)
    cup = cup.filter(ImageFilter.GaussianBlur(0.2))
    canvas.alpha_composite(cup, (-50, -36))


def draw_binder_clip(canvas: Image.Image, origin: tuple[int, int], scale: float = 1.0, angle: float = 0) -> None:
    w, h = int(128 * scale), int(104 * scale)
    clip = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(clip)
    draw.rounded_rectangle((28 * scale, 48 * scale, 98 * scale, 90 * scale), radius=int(6 * scale), fill=(36, 32, 25, 230))
    draw.rectangle((31 * scale, 48 * scale, 95 * scale, 58 * scale), fill=(108, 86, 50, 230))
    draw.arc((13 * scale, 4 * scale, 70 * scale, 66 * scale), 182, 356, fill=(210, 199, 174, 230), width=max(2, int(4 * scale)))
    draw.arc((58 * scale, 4 * scale, 115 * scale, 66 * scale), 184, 358, fill=(210, 199, 174, 230), width=max(2, int(4 * scale)))
    clip = clip.rotate(angle, expand=True, resample=Image.Resampling.BICUBIC)
    canvas.alpha_composite(clip, origin)


def draw_pen(canvas: Image.Image) -> None:
    pen = open_rgba(SRC / "props" / "pen.webp")
    pen = pen.resize((116, 420), Image.Resampling.LANCZOS).rotate(-27, expand=True, resample=Image.Resampling.BICUBIC)
    canvas.alpha_composite(pen, (710, 1392))


def make_desk_props() -> None:
    back = Image.new("RGBA", TARGET, (0, 0, 0, 0))
    draw = ImageDraw.Draw(back)
    draw_coffee_cup(back)

    folder = Image.new("RGBA", (350, 220), (0, 0, 0, 0))
    folder_draw = ImageDraw.Draw(folder)
    folder_draw.polygon([(12, 42), (150, 42), (182, 0), (334, 0), (334, 202), (12, 202)], fill=(126, 103, 72, 182))
    folder_draw.line([(12, 42), (150, 42), (182, 0), (334, 0), (334, 202), (12, 202), (12, 42)], fill=(64, 46, 30, 86), width=2)
    folder = folder.rotate(8, expand=True, resample=Image.Resampling.BICUBIC)
    back.alpha_composite(folder, (560, -22))

    paper = draw_cut_paper((230, 190), 18, PAPER_DEEP, seed=14).rotate(-12, expand=True, resample=Image.Resampling.BICUBIC)
    back.alpha_composite(paper, (-72, 1540))
    draw_binder_clip(back, (740, 12), 0.8, 12)
    save_png(back, "desk-props-back@2x.png")

    front = Image.new("RGBA", TARGET, (0, 0, 0, 0))
    draw_tape(front, (98, 1708, 260, 1750), -16)
    draw_tape(front, (120, 1640, 232, 1680), -6)
    draw_binder_clip(front, (18, 1640), 0.72, -18)
    draw_pen(front)
    save_png(front, "desk-props-front@2x.png")


def draw_cloud_icon(image: Image.Image, box: tuple[int, int, int, int]) -> None:
    draw = ImageDraw.Draw(image)
    x1, y1, x2, y2 = box
    sx = (x2 - x1) / 48
    sy = (y2 - y1) / 48
    points = [
        (14, 32), (36, 32),
    ]
    # Draw a compact printed cloud, matching the reference tab role.
    draw.arc((x1 + 4 * sx, y1 + 19 * sy, x1 + 22 * sx, y1 + 37 * sy), 96, 290, fill=CREAM, width=max(3, int(3.2 * sx)))
    draw.arc((x1 + 13 * sx, y1 + 10 * sy, x1 + 35 * sx, y1 + 34 * sy), 198, 340, fill=CREAM, width=max(3, int(3.2 * sx)))
    draw.arc((x1 + 27 * sx, y1 + 18 * sy, x1 + 44 * sx, y1 + 35 * sy), 210, 62, fill=CREAM, width=max(3, int(3.2 * sx)))
    draw.line([(x1 + p[0] * sx, y1 + p[1] * sy) for p in points], fill=CREAM, width=max(3, int(3.2 * sx)))


def make_header_layers() -> None:
    source = open_rgba(SKIN_V2 / "header-ticket@2x.png")

    paper = source.copy()
    clear_rect(paper, (0, 0, 162, paper.height))
    clear_rect(paper, (250, 0, 535, 72))
    clear_rect(paper, (672, 0, 760, 78))
    save_png(paper, "header-paper@2x.png")

    tab = Image.new("RGBA", (174, 194), (0, 0, 0, 0))
    tab.alpha_composite(source.crop((0, 38, 174, 218)), (0, 0))
    draw_cloud_icon(tab, (52, 66, 114, 128))
    save_png(tab, "header-left-tab@2x.png")

    tape = Image.new("RGBA", (310, 92), (0, 0, 0, 0))
    tape.alpha_composite(source.crop((235, 0, 545, 92)), (0, 0))
    save_png(tape, "header-tape@2x.png")


def make_stat_layers() -> None:
    card = draw_cut_paper((284, 190), 22, PAPER_LIGHT, seed=40)
    save_png(card, "stat-card-paper@2x.png")

    cell = Image.new("RGBA", (30, 34), (0, 0, 0, 0))
    draw = ImageDraw.Draw(cell)
    draw.rounded_rectangle((2, 2, 28, 32), radius=4, fill=(215, 203, 183, 235), outline=(86, 72, 50, 82), width=2)
    draw.line((5, 4, 25, 4), fill=(255, 255, 255, 105), width=2)
    save_png(cell, "stat-progress-cell@2x.png")


def make_round_layers() -> None:
    copy_asset(SKIN_V2 / "main-paper-round@2x.png", "round-main-paper@2x.png")
    copy_asset(SKIN_V2 / "choice-ticket-green@2x.png", "choice-ticket-green@2x.png")
    copy_asset(SKIN_V2 / "choice-ticket-yellow@2x.png", "choice-ticket-yellow@2x.png")
    copy_asset(SKIN_V2 / "choice-ticket-red@2x.png", "choice-ticket-red@2x.png")

    note = draw_cut_paper((684, 84), 10, PAPER_LIGHT, seed=50)
    save_png(note, "tip-note@2x.png")


def make_feedback_layers() -> None:
    feedback = open_rgba(SKIN_V2 / "feedback-paper@2x.png")
    receipt = Image.new("RGBA", (724, 176), (0, 0, 0, 0))
    receipt.alpha_composite(feedback.crop((0, 0, 724, 176)), (0, 0))
    save_png(receipt, "selected-receipt@2x.png")

    card = Image.new("RGBA", (620, 330), (0, 0, 0, 0))
    card.alpha_composite(feedback.crop((52, 190, 672, 520)), (0, 0))
    save_png(card, "feedback-card@2x.png")

    copy_asset(SKIN_V2 / "next-event-card@2x.png", "next-event-card@2x.png")


def extract_ink(crop: Image.Image, green_bias: bool = True, ellipse: bool = False) -> Image.Image:
    source = crop.convert("RGBA")
    pixels = source.load()
    mask = Image.new("L", source.size, 0)
    mask_pixels = mask.load()
    cx = source.width / 2
    cy = source.height / 2
    rx = source.width * 0.48
    ry = source.height * 0.48

    for y in range(source.height):
        for x in range(source.width):
            r, g, b, _ = pixels[x, y]
            value = max(r, g, b)
            saturation = max(r, g, b) - min(r, g, b)
            is_ink = value < 154 and saturation > 9
            if green_bias:
                is_ink = is_ink and g >= b and g >= r - 24
            if ellipse:
                distance = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2
                is_ink = is_ink and distance <= 1.06
            if is_ink:
                alpha = min(230, max(70, int((178 - value) * 2.25 + saturation * 1.2)))
                mask_pixels[x, y] = alpha

    mask = mask.filter(ImageFilter.GaussianBlur(0.45))
    out = Image.new("RGBA", source.size, (72, 88, 62, 0))
    out.putalpha(mask)
    color = Image.new("RGBA", source.size, (78, 92, 64, 255))
    out = Image.composite(color, out, mask)
    out.putalpha(mask)
    return out


def make_result_layers() -> None:
    paper = open_rgba(SKIN_V2 / "result-paper@2x.png")
    paste_paper_patch(paper, (606, 606, 744, 728), seed=70)
    save_png(paper, "result-paper@2x.png")

    result_ref = Image.open(REFERENCE / "result-card.png").convert("RGB")
    illustration_crop = result_ref.crop((120, 318, 730, 602))
    illustration = extract_ink(illustration_crop, green_bias=True, ellipse=False)
    save_png(illustration, "result-illustration@2x.png")

    stat = draw_cut_paper((224, 204), 18, PAPER_LIGHT, seed=80)
    save_png(stat, "result-stat-card@2x.png")

    persona = draw_cut_paper((620, 118), 14, PAPER_LIGHT, seed=81)
    draw = ImageDraw.Draw(persona)
    draw.ellipse((30, 28, 78, 76), fill=OLIVE)
    draw.ellipse((43, 38, 65, 60), outline=CREAM, width=5)
    save_png(persona, "result-persona-strip@2x.png")

    stamp = Image.new("RGBA", (240, 240), (0, 0, 0, 0))
    stamp_draw = ImageDraw.Draw(stamp)
    stamp_color = (78, 92, 64, 150)
    stamp_draw.ellipse((18, 18, 222, 222), outline=stamp_color, width=7)
    stamp_draw.ellipse((38, 38, 202, 202), outline=(78, 92, 64, 104), width=3)
    star = []
    cx, cy = 120, 122
    for index in range(10):
        angle = math.radians(-90 + index * 36)
        radius = 48 if index % 2 == 0 else 21
        star.append((cx + math.cos(angle) * radius, cy + math.sin(angle) * radius))
    stamp_draw.polygon(star, fill=(78, 92, 64, 132))
    for angle in range(-60, 241, 20):
        rad = math.radians(angle)
        x = cx + math.cos(rad) * 84
        y = cy + math.sin(rad) * 84
        stamp_draw.rectangle((x - 1, y - 1, x + 2, y + 2), fill=(78, 92, 64, 90))
    noise = noise_layer(stamp.size, 70, seed=92)
    alpha = stamp.getchannel("A")
    alpha = ImageChops.multiply(alpha, ImageOps.invert(noise.point(lambda p: min(255, p * 2))))
    stamp.putalpha(alpha.filter(ImageFilter.GaussianBlur(0.15)))
    stamp = stamp.rotate(-12, expand=True, resample=Image.Resampling.BICUBIC)
    save_png(stamp, "stamp@2x.png")


def make_button_layers() -> None:
    copy_asset(SKIN_V2 / "primary-button@2x.png", "primary-button@2x.png")
    copy_asset(SKIN_V2 / "secondary-button@2x.png", "secondary-button@2x.png")


def main() -> None:
    ensure_out()
    make_desk_bg()
    make_desk_props()
    make_header_layers()
    make_stat_layers()
    make_round_layers()
    make_feedback_layers()
    make_result_layers()
    make_button_layers()

    for path in sorted(OUT.glob("*@2x.*")):
        with Image.open(path) as image:
            print(f"{path.relative_to(ROOT)} {image.width}x{image.height} {image.mode}")


if __name__ == "__main__":
    main()
