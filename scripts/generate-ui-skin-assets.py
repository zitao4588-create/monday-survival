#!/usr/bin/env python3
from __future__ import annotations

from pathlib import Path
import random
import shutil

from PIL import Image, ImageChops, ImageDraw, ImageFilter, ImageOps


ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "src" / "assets"
OUT = ASSETS / "skin-v2"

CANVAS = (852, 1844)

INK = (31, 33, 27)
MUTED = (95, 91, 80)
PAPER = (234, 223, 206)
PAPER_DEEP = (220, 202, 179)
PAPER_LIGHT = (243, 234, 219)
PAPER_BORDER = (132, 112, 84)
OLIVE = (88, 102, 75)
OLIVE_DARK = (63, 74, 55)
GOLD = (217, 163, 33)
GOLD_DARK = (184, 133, 22)
RUST = (201, 93, 67)
RUST_DARK = (168, 69, 50)
CREAM = (255, 244, 223)
SHADOW = (34, 22, 12)
COFFEE = (157, 108, 53)


def lerp(a: int, b: int, t: float) -> int:
    return round(a + (b - a) * t)


def rgba(rgb: tuple[int, int, int], alpha: int) -> tuple[int, int, int, int]:
    return rgb[0], rgb[1], rgb[2], alpha


def tile_image(path: Path, size: tuple[int, int]) -> Image.Image:
    source = Image.open(path).convert("RGBA")
    tiled = Image.new("RGBA", size, (0, 0, 0, 0))
    for y in range(0, size[1], source.height):
        for x in range(0, size[0], source.width):
            tiled.alpha_composite(source, (x, y))
    return tiled.crop((0, 0, size[0], size[1]))


def paper_texture(size: tuple[int, int], seed: int) -> Image.Image:
    width, height = size
    texture = Image.new("RGBA", size, (0, 0, 0, 0))
    pixels = texture.load()
    for y in range(height):
        t = y / max(height - 1, 1)
        base = (
            lerp(PAPER_LIGHT[0], PAPER[0], t),
            lerp(PAPER_LIGHT[1], PAPER[1], t),
            lerp(PAPER_LIGHT[2], PAPER[2], t),
            255,
        )
        for x in range(width):
            pixels[x, y] = base

    noise = tile_image(ASSETS / "textures" / "paper-noise.png", size).convert("L")
    grain_alpha = noise.point(lambda p: min(24, max(4, int(p * 0.085))))
    grain = Image.new("RGBA", size, rgba((77, 55, 33), 0))
    grain.putalpha(grain_alpha)
    texture.alpha_composite(grain)

    draw = ImageDraw.Draw(texture, "RGBA")
    rng = random.Random(seed)
    for _ in range(max(10, width * height // 22000)):
        x = rng.randrange(0, width)
        y = rng.randrange(0, height)
        alpha = rng.randrange(3, 7)
        draw.point((x, y), fill=(86, 58, 34, alpha))

    return texture


def mask_from_polygon(size: tuple[int, int], polygon: list[tuple[int, int]], fill: int = 255) -> Image.Image:
    mask = Image.new("L", size, 0)
    ImageDraw.Draw(mask).polygon(polygon, fill=fill)
    return mask


def clip_layer(layer: Image.Image, mask: Image.Image) -> Image.Image:
    clipped = layer.copy()
    clipped.putalpha(ImageChops.multiply(clipped.getchannel("A"), mask))
    return clipped


def add_shadow(
    image: Image.Image,
    polygon: list[tuple[int, int]],
    offset: tuple[int, int] = (0, 22),
    blur: int = 24,
    opacity: int = 92,
) -> None:
    shifted = [(x + offset[0], y + offset[1]) for x, y in polygon]
    mask = mask_from_polygon(image.size, shifted, opacity).filter(ImageFilter.GaussianBlur(blur))
    shadow = Image.new("RGBA", image.size, rgba(SHADOW, 0))
    shadow.putalpha(mask)
    image.alpha_composite(shadow)


def ticket_polygon(x: int, y: int, width: int, height: int, cut: int) -> list[tuple[int, int]]:
    return [
        (x + cut, y),
        (x + width, y),
        (x + width, y + height - cut),
        (x + width - cut, y + height),
        (x, y + height),
        (x, y + cut),
    ]


def paper_polygon(x: int, y: int, width: int, height: int, cut: int) -> list[tuple[int, int]]:
    return [
        (x, y),
        (x + width - cut, y),
        (x + width, y + cut),
        (x + width, y + height - cut),
        (x + width - cut, y + height),
        (x, y + height),
    ]


def draw_paper(
    image: Image.Image,
    polygon: list[tuple[int, int]],
    bounds: tuple[int, int, int, int],
    seed: int,
    border_alpha: int = 88,
    shadow: bool = True,
) -> Image.Image:
    if shadow:
        add_shadow(image, polygon)

    x, y, width, height = bounds
    mask = mask_from_polygon(image.size, polygon)
    layer = Image.new("RGBA", image.size, (0, 0, 0, 0))
    layer.paste(paper_texture((width, height), seed), (x, y))
    image.alpha_composite(clip_layer(layer, mask))

    draw = ImageDraw.Draw(image, "RGBA")
    draw.line(polygon + [polygon[0]], fill=rgba(PAPER_BORDER, border_alpha), width=2)
    return mask


def draw_inner_border(
    image: Image.Image,
    polygon: list[tuple[int, int]],
    fill: tuple[int, int, int, int] = (30, 40, 32, 74),
    width: int = 2,
) -> None:
    ImageDraw.Draw(image, "RGBA").line(polygon + [polygon[0]], fill=fill, width=width)


def draw_tape(image: Image.Image, x: int, y: int, width: int, height: int, angle: float = 0) -> None:
    tape = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    draw = ImageDraw.Draw(tape, "RGBA")
    draw.polygon(
        [(0, 7), (width - 2, 1), (width, height - 7), (2, height - 1)],
        fill=(120, 133, 108, 218),
    )
    draw.polygon([(0, 7), (width - 2, 1), (width - 2, 13), (0, 18)], fill=(255, 255, 255, 28))
    draw.rectangle((1, 7, width - 2, height - 6), outline=(42, 51, 40, 72), width=2)
    for stripe_x in (round(width * 0.16), round(width * 0.68)):
        draw.polygon(
            [(stripe_x, 3), (stripe_x + 26, height - 3), (stripe_x + 45, height - 3), (stripe_x + 19, 3)],
            fill=(95, 107, 85, 104),
        )

    rotated = tape.rotate(angle, resample=Image.Resampling.BICUBIC, expand=True)
    image.alpha_composite(rotated, (x - (rotated.width - width) // 2, y - (rotated.height - height) // 2))


def draw_coffee_stain(image: Image.Image, x: int, y: int, scale: float = 1.0, opacity: float = 1.0) -> None:
    size = round(156 * scale)
    stain = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(stain, "RGBA")

    def sc(value: int) -> int:
        return round(value * scale)

    alpha = lambda value: round(value * opacity)
    draw.ellipse((sc(28), sc(28), sc(128), sc(128)), outline=rgba(COFFEE, alpha(42)), width=max(2, sc(13)))
    draw.arc((sc(25), sc(18), sc(132), sc(116)), 205, 330, fill=rgba(COFFEE, alpha(38)), width=max(2, sc(8)))
    draw.arc((sc(26), sc(68), sc(132), sc(142)), 20, 158, fill=rgba(COFFEE, alpha(30)), width=max(2, sc(7)))
    draw.arc((sc(12), sc(84), sc(68), sc(134)), 14, 210, fill=rgba(COFFEE, alpha(32)), width=max(2, sc(5)))
    draw.ellipse((sc(40), sc(122), sc(48), sc(130)), fill=rgba(COFFEE, alpha(34)))
    draw.ellipse((sc(113), sc(34), sc(123), sc(44)), fill=rgba(COFFEE, alpha(28)))
    image.alpha_composite(stain, (x, y))


def draw_paperclip(image: Image.Image, x: int, y: int, scale: float = 1.0, angle: float = 12) -> None:
    width, height = round(42 * scale), round(112 * scale)
    clip = Image.new("RGBA", (width + 24, height + 24), (0, 0, 0, 0))
    draw = ImageDraw.Draw(clip, "RGBA")
    line_width = max(3, round(3.2 * scale))
    pad = round(12 * scale)
    box_outer = (pad + round(5 * scale), pad + round(1 * scale), pad + round(40 * scale), pad + round(107 * scale))
    box_inner = (pad + round(9 * scale), pad + round(19 * scale), pad + round(27 * scale), pad + round(97 * scale))
    draw.rounded_rectangle(box_outer, radius=round(18 * scale), outline=(78, 75, 64, 228), width=line_width)
    draw.rounded_rectangle(box_inner, radius=round(10 * scale), outline=(78, 75, 64, 228), width=line_width)
    draw.line(
        (
            pad + round(27 * scale),
            pad + round(28 * scale),
            pad + round(27 * scale),
            pad + round(80 * scale),
        ),
        fill=(78, 75, 64, 228),
        width=line_width,
    )
    clip = clip.filter(ImageFilter.GaussianBlur(0.18))
    rotated = clip.rotate(angle, resample=Image.Resampling.BICUBIC, expand=True)
    image.alpha_composite(rotated, (x, y))


def draw_binder_clip(image: Image.Image, x: int, y: int, scale: float = 1.0, angle: float = 0) -> None:
    width, height = round(96 * scale), round(82 * scale)
    clip = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    draw = ImageDraw.Draw(clip, "RGBA")
    body = [
        (round(19 * scale), round(28 * scale)),
        (round(77 * scale), round(28 * scale)),
        (round(67 * scale), round(66 * scale)),
        (round(29 * scale), round(66 * scale)),
    ]
    draw.polygon(body, fill=(45, 45, 40, 235))
    draw.line(body + [body[0]], fill=(16, 16, 14, 168), width=max(2, round(2 * scale)))
    draw.arc((round(8 * scale), round(0), round(45 * scale), round(50 * scale)), 35, 165, fill=(72, 72, 66, 220), width=max(3, round(4 * scale)))
    draw.arc((round(51 * scale), round(0), round(88 * scale), round(50 * scale)), 15, 145, fill=(72, 72, 66, 220), width=max(3, round(4 * scale)))
    draw.rectangle((round(18 * scale), round(22 * scale), round(78 * scale), round(33 * scale)), fill=(72, 72, 66, 240))
    draw.rectangle((round(25 * scale), round(35 * scale), round(71 * scale), round(41 * scale)), fill=(255, 255, 255, 22))
    clip = clip.filter(ImageFilter.GaussianBlur(0.2))
    rotated = clip.rotate(angle, resample=Image.Resampling.BICUBIC, expand=True)
    image.alpha_composite(rotated, (x - (rotated.width - width) // 2, y - (rotated.height - height) // 2))


def add_soft_shadow(image: Image.Image, rect: tuple[int, int, int, int], radius: int, opacity: int, angle: float = 0) -> None:
    x, y, width, height = rect
    shadow = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    mask = Image.new("L", (width, height), 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, width, height), radius=radius, fill=opacity)
    mask = mask.filter(ImageFilter.GaussianBlur(28))
    shadow.putalpha(mask)
    shadow = Image.new("RGBA", (width, height), rgba(SHADOW, 0))
    shadow.putalpha(mask)
    if angle:
        shadow = shadow.rotate(angle, resample=Image.Resampling.BICUBIC, expand=True)
    image.alpha_composite(shadow, (x, y))


def generate_desk_bg() -> None:
    wood = Image.open(ASSETS / "textures" / "wood.webp").convert("RGB")
    wood = wood.rotate(90, expand=True)
    wood = ImageOps.fit(wood, CANVAS, method=Image.Resampling.LANCZOS, centering=(0.5, 0.48))
    wood = ImageOps.autocontrast(wood, cutoff=2)
    wood_gray = ImageOps.grayscale(wood)
    wood = ImageOps.colorize(
        wood_gray,
        black=(49, 29, 17),
        white=(142, 91, 54),
        mid=(86, 52, 31),
        blackpoint=14,
        whitepoint=245,
    ).convert("RGBA").filter(ImageFilter.GaussianBlur(0.35))

    overlay = Image.new("RGBA", CANVAS, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay, "RGBA")
    draw.rectangle((0, 0, CANVAS[0], CANVAS[1]), fill=(47, 25, 13, 26))
    draw.polygon(((-80, 0), (320, 0), (80, CANVAS[1]), (-180, CANVAS[1])), fill=(255, 229, 190, 14))
    draw.ellipse((-210, -190, 360, 360), fill=(255, 226, 182, 14))
    draw.ellipse((610, -120, 1040, 310), fill=(0, 0, 0, 30))
    draw.ellipse((-250, 1280, 1080, 2140), fill=(0, 0, 0, 42))
    wood.alpha_composite(overlay)

    # Ambient shadows for future paper layers. These are not UI content.
    add_soft_shadow(wood, (58, 94, 728, 176), 14, 50, -1.5)
    add_soft_shadow(wood, (46, 366, 760, 1130), 18, 72, 0.8)

    # Persistent desk atmosphere only. Movable props are layered by React.
    draw = ImageDraw.Draw(wood, "RGBA")
    draw.ellipse((-104, -98, 216, 222), fill=(214, 196, 164, 226))
    draw.ellipse((-72, -66, 186, 192), fill=(73, 45, 26, 240))
    draw.ellipse((-30, -28, 146, 148), fill=(43, 25, 14, 244))
    draw.arc((-92, -86, 210, 216), 12, 332, fill=(96, 72, 48, 136), width=10)
    draw_coffee_stain(wood, 616, 112, 1.1, 0.24)
    draw_coffee_stain(wood, 28, 1470, 0.92, 0.2)

    vignette = Image.new("L", CANVAS, 0)
    vdraw = ImageDraw.Draw(vignette)
    vdraw.rectangle((0, 0, CANVAS[0], CANVAS[1]), fill=90)
    vdraw.ellipse((-240, -220, CANVAS[0] + 240, CANVAS[1] + 120), fill=0)
    vignette = vignette.filter(ImageFilter.GaussianBlur(120))
    dark = Image.new("RGBA", CANVAS, rgba((0, 0, 0), 0))
    dark.putalpha(vignette)
    wood.alpha_composite(dark)

    wood.convert("RGB").save(OUT / "desk-bg@2x.webp", quality=92, method=6)
def generate_header_ticket() -> None:
    size = (780, 220)
    image = Image.new("RGBA", size, (0, 0, 0, 0))
    poly = paper_polygon(28, 48, 724, 138, 22)
    mask = draw_paper(image, poly, (28, 48, 724, 138), seed=102)

    tab = Image.new("RGBA", size, (0, 0, 0, 0))
    tdraw = ImageDraw.Draw(tab, "RGBA")
    tdraw.rectangle((28, 48, 154, 186), fill=rgba(OLIVE, 255))
    tdraw.rectangle((142, 48, 154, 186), fill=(30, 39, 31, 58))
    tdraw.rectangle((28, 48, 154, 72), fill=(255, 255, 255, 28))
    image.alpha_composite(clip_layer(tab, mask))

    draw_inner_border(image, paper_polygon(45, 65, 690, 104, 18), (30, 40, 32, 42), 2)
    draw_tape(image, 292, 20, 208, 46, -1.5)
    draw_binder_clip(image, 674, 14, 0.72, 8)
    image.save(OUT / "header-ticket@2x.png")


def generate_stat_card() -> None:
    size = (284, 190)
    image = Image.new("RGBA", size, (0, 0, 0, 0))
    poly = paper_polygon(14, 12, 256, 154, 20)
    draw_paper(image, poly, (14, 12, 256, 154), seed=118, border_alpha=78)
    draw_inner_border(image, paper_polygon(28, 26, 228, 126, 16), (30, 40, 32, 34), 2)
    draw = ImageDraw.Draw(image, "RGBA")
    draw.rectangle((38, 128, 246, 132), fill=(77, 65, 48, 28))
    image.save(OUT / "stat-card@2x.png")


def generate_main_paper_round() -> None:
    size = (820, 1180)
    image = Image.new("RGBA", size, (0, 0, 0, 0))
    poly = paper_polygon(24, 40, 772, 1088, 30)
    draw_paper(image, poly, (24, 40, 772, 1088), seed=151, border_alpha=92)
    draw = ImageDraw.Draw(image, "RGBA")
    for cy in range(150, 1048, 80):
        draw.ellipse((52, cy - 12, 76, cy + 12), fill=(74, 66, 52, 86))
        draw.ellipse((58, cy - 6, 70, cy + 6), fill=(215, 202, 180, 128))
    draw_tape(image, 300, 12, 250, 52, -1)
    draw_paperclip(image, 720, 86, 1.0, 14)
    draw_coffee_stain(image, 640, 250, 1.08, 0.76)
    draw_inner_border(image, paper_polygon(58, 76, 704, 1012, 24), (30, 40, 32, 30), 2)

    paper_mask = mask_from_polygon(size, poly)
    line_layer = Image.new("RGBA", size, (0, 0, 0, 0))
    ldraw = ImageDraw.Draw(line_layer, "RGBA")
    for y in range(190, 1030, 68):
        ldraw.line((112, y, 728, y), fill=(77, 65, 48, 9), width=1)
    image.alpha_composite(clip_layer(line_layer, paper_mask))
    image.save(OUT / "main-paper-round@2x.png")


def generate_choice_ticket(name: str, color: tuple[int, int, int], dark: tuple[int, int, int], seed: int) -> None:
    size = (770, 240)
    image = Image.new("RGBA", size, (0, 0, 0, 0))
    poly = ticket_polygon(18, 18, 732, 202, 40)
    mask = draw_paper(image, poly, (18, 18, 732, 202), seed=seed, border_alpha=82)

    color_layer = Image.new("RGBA", size, (0, 0, 0, 0))
    cdraw = ImageDraw.Draw(color_layer, "RGBA")
    cdraw.rectangle((18, 18, 134, 220), fill=rgba(color, 255))
    cdraw.rectangle((121, 18, 134, 220), fill=rgba(INK, 48))
    cdraw.rectangle((18, 18, 134, 50), fill=(255, 255, 255, 34))
    image.alpha_composite(clip_layer(color_layer, mask))

    draw = ImageDraw.Draw(image, "RGBA")
    draw.line((636, 40, 636, 200), fill=(68, 56, 38, 62), width=2)
    draw.line((137, 31, 137, 209), fill=rgba(dark, 46), width=2)
    draw_inner_border(image, ticket_polygon(36, 34, 696, 168, 32), (30, 40, 32, 58), 2)
    image.save(OUT / f"choice-ticket-{name}@2x.png")


def torn_bottom_polygon(x: int, y: int, width: int, height: int, tooth: int = 18) -> list[tuple[int, int]]:
    points: list[tuple[int, int]] = [(x, y), (x + width, y), (x + width, y + height - tooth)]
    direction = -1
    for px in range(x + width, x, -tooth):
        points.append((max(x, px - tooth // 2), y + height + (tooth // 2 if direction > 0 else 0)))
        points.append((max(x, px - tooth), y + height - tooth))
        direction *= -1
    points.append((x, y + height - tooth))
    return points


def generate_feedback_paper() -> None:
    size = (724, 600)
    image = Image.new("RGBA", size, (0, 0, 0, 0))
    shadow_poly = paper_polygon(26, 54, 670, 500, 18)
    add_shadow(image, shadow_poly, offset=(0, 24), blur=26, opacity=84)
    backing = Image.new("RGBA", size, (0, 0, 0, 0))
    bdraw = ImageDraw.Draw(backing, "RGBA")
    backing_poly = paper_polygon(30, 58, 662, 488, 16)
    bdraw.polygon(backing_poly, fill=rgba(PAPER_DEEP, 190))
    bdraw.line(backing_poly + [backing_poly[0]], fill=rgba(PAPER_BORDER, 64), width=2)
    image.alpha_composite(backing)

    poly = paper_polygon(18, 30, 688, 532, 24)
    mask = draw_paper(image, poly, (18, 34, 688, 532), seed=310, border_alpha=82)

    strip = Image.new("RGBA", size, (0, 0, 0, 0))
    sdraw = ImageDraw.Draw(strip, "RGBA")
    receipt = torn_bottom_polygon(18, 30, 688, 138, 22)
    sdraw.polygon(receipt, fill=rgba(PAPER_DEEP, 236))
    sdraw.line((42, 150, 684, 150), fill=(42, 38, 30, 70), width=2)
    image.alpha_composite(clip_layer(strip, mask))

    draw_tape(image, 88, 5, 204, 46, -4)
    draw = ImageDraw.Draw(image, "RGBA")
    inner_shadow = Image.new("RGBA", size, (0, 0, 0, 0))
    idraw = ImageDraw.Draw(inner_shadow, "RGBA")
    idraw.rounded_rectangle((74, 206, 650, 508), radius=12, fill=rgba(SHADOW, 46))
    inner_shadow = inner_shadow.filter(ImageFilter.GaussianBlur(8))
    image.alpha_composite(inner_shadow)
    draw.rounded_rectangle((70, 202, 654, 500), radius=10, outline=(38, 43, 36, 88), width=3)
    draw.rounded_rectangle((92, 230, 632, 474), radius=8, outline=(255, 255, 255, 58), width=3)
    draw.arc((74, 206, 148, 280), 180, 270, fill=rgba(OLIVE, 82), width=4)
    draw.arc((576, 424, 648, 496), 0, 90, fill=rgba(OLIVE, 78), width=4)
    draw_coffee_stain(image, 572, 356, 0.72, 0.32)
    draw_paperclip(image, 653, 52, 0.64, 11)
    image.save(OUT / "feedback-paper@2x.png")


def generate_next_event_card() -> None:
    size = (724, 340)
    image = Image.new("RGBA", size, (0, 0, 0, 0))
    poly = ticket_polygon(18, 44, 688, 252, 32)
    mask = draw_paper(image, poly, (18, 44, 688, 252), seed=330, border_alpha=82)

    label = Image.new("RGBA", size, (0, 0, 0, 0))
    ldraw = ImageDraw.Draw(label, "RGBA")
    ldraw.rectangle((56, 20, 248, 76), fill=rgba(OLIVE, 255))
    ldraw.rectangle((56, 20, 248, 38), fill=(255, 255, 255, 32))
    ldraw.rectangle((56, 76, 248, 80), fill=rgba(SHADOW, 42))
    image.alpha_composite(label)

    draw_inner_border(image, ticket_polygon(40, 66, 644, 208, 26), (30, 40, 32, 46), 2)
    draw_coffee_stain(image, 582, 150, 0.78, 0.38)
    draw = ImageDraw.Draw(image, "RGBA")
    draw.line((58, 236, 660, 236), fill=(68, 56, 38, 52), width=2)
    image.alpha_composite(clip_layer(Image.new("RGBA", size, (0, 0, 0, 0)), mask))
    image.save(OUT / "next-event-card@2x.png")


def button_polygon(x: int, y: int, width: int, height: int, cut: int) -> list[tuple[int, int]]:
    return [
        (x + cut, y),
        (x + width - cut, y),
        (x + width, y + cut),
        (x + width, y + height - cut),
        (x + width - cut, y + height),
        (x + cut, y + height),
        (x, y + height - cut),
        (x, y + cut),
    ]


def generate_primary_button() -> None:
    size = (620, 136)
    image = Image.new("RGBA", size, (0, 0, 0, 0))
    poly = button_polygon(18, 16, 584, 92, 24)
    add_shadow(image, poly, offset=(0, 16), blur=18, opacity=86)
    mask = mask_from_polygon(size, poly)
    layer = Image.new("RGBA", size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer, "RGBA")
    draw.polygon(poly, fill=rgba(OLIVE_DARK, 255))
    draw.polygon([(18, 16), (602, 16), (602, 48), (18, 42)], fill=(255, 255, 255, 28))
    draw.line(poly + [poly[0]], fill=(30, 40, 32, 128), width=2)
    image.alpha_composite(clip_layer(layer, mask))
    draw_inner_border(image, button_polygon(38, 32, 544, 60, 16), (255, 244, 223, 82), 2)
    image.save(OUT / "primary-button@2x.png")


def generate_secondary_button() -> None:
    size = (620, 128)
    image = Image.new("RGBA", size, (0, 0, 0, 0))
    poly = button_polygon(18, 14, 584, 88, 22)
    draw_paper(image, poly, (18, 14, 584, 88), seed=352, border_alpha=78)
    draw_inner_border(image, button_polygon(38, 30, 544, 56, 15), (30, 40, 32, 42), 2)
    image.save(OUT / "secondary-button@2x.png")


def generate_result_paper() -> None:
    size = (780, 1500)
    image = Image.new("RGBA", size, (0, 0, 0, 0))

    back_poly = paper_polygon(38, 74, 704, 1354, 30)
    add_shadow(image, back_poly, offset=(0, 26), blur=28, opacity=94)
    back = Image.new("RGBA", size, (0, 0, 0, 0))
    bdraw = ImageDraw.Draw(back, "RGBA")
    bdraw.polygon(back_poly, fill=rgba(OLIVE_DARK, 255))
    bdraw.line(back_poly + [back_poly[0]], fill=(28, 35, 27, 120), width=2)
    image.alpha_composite(back)

    deep_poly = paper_polygon(18, 108, 744, 1326, 28)
    add_shadow(image, deep_poly, offset=(0, 16), blur=22, opacity=72)
    deep = Image.new("RGBA", size, (0, 0, 0, 0))
    ddraw = ImageDraw.Draw(deep, "RGBA")
    ddraw.polygon(deep_poly, fill=rgba(PAPER_DEEP, 255))
    ddraw.line(deep_poly + [deep_poly[0]], fill=rgba(PAPER_BORDER, 90), width=2)
    ddraw.rectangle((18, 108, 56, 1414), fill=(181, 161, 131, 130))
    image.alpha_composite(deep)

    main_poly = paper_polygon(36, 44, 708, 1370, 30)
    draw_paper(image, main_poly, (36, 42, 708, 1370), seed=370, border_alpha=92)
    draw_inner_border(image, button_polygon(72, 92, 636, 1266, 32), (38, 43, 36, 92), 3)
    draw_inner_border(image, button_polygon(94, 122, 592, 1200, 24), (255, 255, 255, 34), 2)
    draw_tape(image, 286, 12, 216, 48, -1)
    draw_binder_clip(image, 620, 18, 0.82, 8)
    draw_coffee_stain(image, -44, 920, 1.05, 0.58)
    draw_coffee_stain(image, 610, 980, 0.76, 0.24)

    draw = ImageDraw.Draw(image, "RGBA")
    stamp_box = (608, 606, 730, 728)
    draw.ellipse(stamp_box, outline=rgba(RUST_DARK, 128), width=5)
    draw.ellipse((624, 622, 714, 712), outline=rgba(RUST_DARK, 80), width=2)
    draw.line((100, 800, 680, 800), fill=(68, 56, 38, 58), width=2)
    draw.line((118, 1088, 662, 1088), fill=(68, 56, 38, 42), width=2)
    draw.line((126, 1132, 654, 1132), fill=(68, 56, 38, 34), width=2)
    for y in (862, 1250):
        draw.line((118, y, 662, y), fill=(68, 56, 38, 28), width=1)
    image.save(OUT / "result-paper@2x.png")


def write_svg(path: Path, body: str) -> None:
    path.write_text(body.strip() + "\n", encoding="utf-8")


def generate_icons() -> None:
    icons_out = OUT / "icons"
    icons_out.mkdir(parents=True, exist_ok=True)

    source_icons = ASSETS / "icons"
    copies = {
        "water.svg": source_icons / "water.svg",
        "alarm.svg": source_icons / "alarm.svg",
        "coffee.svg": source_icons / "coffee.svg",
        "train.svg": source_icons / "train.svg",
        "energy.svg": source_icons / "lightning.svg",
        "mood.svg": source_icons / "mood.svg",
        "score.svg": source_icons / "star.svg",
        "result-illustration.svg": ASSETS / "illustrations" / "result-nap.svg",
    }
    for name, source in copies.items():
        shutil.copyfile(source, icons_out / name)

    write_svg(
        icons_out / "cloud.svg",
        """
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
  <path d="M14 32h22a8 8 0 0 0 0-16 12 12 0 0 0-23-3 9.5 9.5 0 0 0 1 19Z" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
""",
    )
    write_svg(
        icons_out / "check.svg",
        """
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
  <path d="m12 24 8 8 17-18" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
""",
    )
    write_svg(
        icons_out / "result-stamp.svg",
        """
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
  <g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="64" cy="64" r="52" stroke-width="4"/>
    <circle cx="64" cy="64" r="41" stroke-width="2.5" opacity=".62"/>
    <path d="m64 32 7.2 14.6 16.1 2.4-11.7 11.3 2.8 16-14.4-7.6-14.4 7.6 2.8-16L40.7 49l16.1-2.4L64 32Z" stroke-width="4"/>
    <path d="M36 91c15 12 41 12 56 0" stroke-width="3" opacity=".52"/>
  </g>
</svg>
""",
    )


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    generate_desk_bg()
    generate_header_ticket()
    generate_stat_card()
    generate_main_paper_round()
    generate_choice_ticket("green", OLIVE, OLIVE_DARK, 201)
    generate_choice_ticket("yellow", GOLD, GOLD_DARK, 202)
    generate_choice_ticket("red", RUST, RUST_DARK, 203)
    generate_feedback_paper()
    generate_next_event_card()
    generate_result_paper()
    generate_primary_button()
    generate_secondary_button()
    generate_icons()

    for path in sorted(OUT.glob("*@2x.*")):
        with Image.open(path) as image:
            print(f"{path.relative_to(ROOT)} {image.width}x{image.height} {image.mode}")
    for path in sorted((OUT / "icons").glob("*.svg")):
        print(f"{path.relative_to(ROOT)} svg")


if __name__ == "__main__":
    main()
