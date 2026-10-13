# -*- coding: utf-8 -*-
"""bg-tall.jpg 1920×2800 — общий фон объединённой секции главной в стиле comeon.pl:
угольно-зелёный градиент + мягкие зелёные свечения + тонкая диагональная текстура + слабые скруглённые
квадраты (мотив плитки бренда). Равномерное распределение — без крупных пятен, иначе швы между секциями."""
from PIL import Image, ImageDraw, ImageFilter, ImageChops, ImageStat
import random, pathlib, os
os.chdir(pathlib.Path(__file__).parent / "img")
W, H = 1920, 2800
top, bot = (28, 33, 28), (22, 26, 22)
G = (57, 245, 106)

base = Image.new("RGB", (W, H)); px = base.load()
for y in range(H):
    c = tuple(int(top[i] + (bot[i] - top[i]) * y / H) for i in range(3))
    for x in range(W):
        px[x, y] = c

glow = Image.new("RGB", (W, H), (0, 0, 0)); gd = ImageDraw.Draw(glow)
spots = [(1780, 180, 680, .13), (140, 900, 640, .11), (1800, 1500, 640, .10), (120, 2150, 660, .12), (1760, 2650, 620, .11), (160, 200, 520, .07)]
for cx, cy, r, a in spots:
    for i in range(40, 0, -1):
        rr = r * i / 40; k = a * (1 - i / 40) ** 1.7
        gd.ellipse([cx - rr, cy - rr, cx + rr, cy + rr], fill=tuple(int(c * k) for c in G))
glow = glow.filter(ImageFilter.GaussianBlur(130))
img = ImageChops.add(base, glow)

lines = Image.new("L", (W, H), 0); ld = ImageDraw.Draw(lines)
for k in range(-H, W + H, 28):
    ld.line([(k, 0), (k + H, H)], fill=11, width=1)
lines = lines.filter(ImageFilter.GaussianBlur(0.6))
img = ImageChops.add(img, Image.merge("RGB", (lines, lines, lines)))

tiles = Image.new("RGBA", (W, H), (0, 0, 0, 0)); td = ImageDraw.Draw(tiles)
rnd = random.Random(21)
for i in range(70):
    s = rnd.randint(120, 380); x = rnd.choice([rnd.randint(-80, 480), rnd.randint(1360, 1960)]); y = rnd.randint(-120, H)
    al = rnd.randint(14, 34)
    td.rounded_rectangle([x, y, x + s, y + s], radius=s // 5, outline=G + (al,), width=2)
    if rnd.random() < .3:
        td.rounded_rectangle([x, y, x + s, y + s], radius=s // 5, fill=G + (rnd.randint(4, 9),))
tiles = tiles.rotate(12, resample=Image.BICUBIC, expand=False)
img = Image.alpha_composite(img.convert("RGBA"), tiles).convert("RGB")

img.save("bg-tall.jpg", quality=88)
print("bg-tall mean", [round(v) for v in ImageStat.Stat(img).mean])
img.resize((480, 700)).save("_bg_prev.jpg", quality=80)
