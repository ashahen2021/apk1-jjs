"""Contact sheet: python sheet.py spec.json
spec = {"out": path, "title": str, "rows": [{"label": str, "cells": [{"img": path, "cap": str}, ...]}]}"""
import json, sys, textwrap
from PIL import Image, ImageDraw, ImageFont

spec = json.load(open(sys.argv[1], encoding="utf-8"))
W, H, PAD, CAP, HEAD, ROWLAB = 360, 640, 16, 74, 70, 44

def font(size, bold=False):
    for name in (["arialbd.ttf"] if bold else []) + ["arial.ttf", "DejaVuSans.ttf"]:
        try:
            return ImageFont.truetype(name, size)
        except OSError:
            pass
    return ImageFont.load_default()

cols = max(len(r["cells"]) for r in spec["rows"])
sheet_w = PAD + cols * (W + PAD)
sheet_h = HEAD + len(spec["rows"]) * (ROWLAB + H + CAP + PAD) + PAD
sheet = Image.new("RGB", (sheet_w, sheet_h), "#1c1a17")
d = ImageDraw.Draw(sheet)
d.text((PAD, 20), spec["title"], fill="#f2e8d0", font=font(28, True))
y = HEAD
for row in spec["rows"]:
    d.text((PAD, y + 8), row["label"], fill="#e0b860", font=font(22, True))
    y += ROWLAB
    for i, cell in enumerate(row["cells"]):
        x = PAD + i * (W + PAD)
        im = Image.open(cell["img"]).convert("RGB").resize((W, H), Image.LANCZOS)
        sheet.paste(im, (x, y))
        for k, line in enumerate(textwrap.wrap(cell["cap"], 46)[:4]):
            d.text((x, y + H + 6 + k * 17), line, fill="#d8d0c0", font=font(14))
    y += H + CAP + PAD
sheet.save(spec["out"])
print(spec["out"], sheet.size)
