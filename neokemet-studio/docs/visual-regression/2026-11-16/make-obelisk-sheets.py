"""Contact sheets and a repetition check for the Obelisk template.

Usage (from the studio root, after rendering the stills):
    python docs/visual-regression/2026-11-16/make-obelisk-sheets.py docs/visual-regression/2026-11-16
"""
import itertools
import sys

from PIL import Image, ImageChops, ImageDraw, ImageFont, ImageStat

D = sys.argv[1]
STAGES = ["granite quarry", "trench carving", "smoothing", "sledge hauling", "barge loading", "river transport", "erection", "temple obelisk"]


def font(size, bold=False):
    for name in (["arialbd.ttf"] if bold else []) + ["arial.ttf", "DejaVuSans.ttf"]:
        try:
            return ImageFont.truetype(name, size)
        except OSError:
            pass
    return ImageFont.load_default()


def sheet(out, title, rows, cell):
    cw, ch = cell
    pad, lab, head, cap = 16, 34, 64, 26
    cols = max(len(r[1]) for r in rows)
    W = pad + cols * (cw + pad)
    H = head + sum(lab + ch + cap + pad for _ in rows) + pad
    im = Image.new("RGB", (W, H), "#FFFFFF")
    d = ImageDraw.Draw(im)
    d.text((pad, 18), title, fill="#1d1d1d", font=font(26, True))
    y = head
    for label, cells in rows:
        d.text((pad, y + 6), label, fill="#333333", font=font(19, True))
        y += lab
        for i, (path, caption) in enumerate(cells):
            x = pad + i * (cw + pad)
            pic = Image.open(f"{D}/{path}").convert("RGB").resize((cw, ch), Image.LANCZOS)
            im.paste(pic, (x, y))
            d.rectangle([x, y, x + cw - 1, y + ch - 1], outline="#BBBBBB")
            d.text((x + 2, y + ch + 5), caption, fill="#555555", font=font(14))
        y += ch + cap + pad
    im.save(f"{D}/{out}")
    print(f"{D}/{out}", im.size)


def stage_cells(fmt, lo, hi):
    return [(f"obelisk-template/{fmt}/ob-s0{i}.png", f"s0{i} {STAGES[i - 1]}") for i in range(lo, hi + 1)]


orig = [(f"original-great-pyramid/s0{i}.png", c) for i, c in [(1, "s01 title"), (2, "s02 characters"), (5, "s05 landscape"), (7, "s07 landscape")]]
sheet("06-obelisk-9x16-vs-original.png", "Obelisk template - eight stages vs. the original Great Pyramid (9:16, same renderer)", [
    ("ORIGINAL - The Great Pyramid (hand-directed storyboard, untouched)", orig),
    ("OBELISK - stages 1-4, imported from the production script, nothing hand-edited", stage_cells("9x16", 1, 4)),
    ("OBELISK - stages 5-8", stage_cells("9x16", 5, 8)),
], (270, 480))
sheet("07-obelisk-16x9-vs-original.png", "Obelisk template - eight stages vs. the original Great Pyramid (16:9)", [
    ("ORIGINAL - The Great Pyramid (16:9)", [(f"original-great-pyramid/16x9/s-s0{i}.png", f"s0{i}") for i in (2, 5, 7, 8)]),
    ("OBELISK - stages 1-4", stage_cells("16x9", 1, 4)),
    ("OBELISK - stages 5-8", stage_cells("16x9", 5, 8)),
], (480, 270))

# Repetition check: mean absolute pixel difference between every pair of stages
# over the picture area (the caption and subtitle strips are left out). Two
# renders of the same drawing score about 0; unrelated pictures 20 and more.
print("\nRepetition check (mean absolute difference, 0-255; lowest pairs first):")
for fmt, box in (("9x16", (0.0, 0.28, 1.0, 0.6)), ("16x9", (0.0, 0.2, 1.0, 0.78))):
    pics = []
    for i in range(1, 9):
        im = Image.open(f"{D}/obelisk-template/{fmt}/ob-s0{i}.png").convert("RGB")
        w, h = im.size
        pics.append(im.crop((int(box[0] * w), int(box[1] * h), int(box[2] * w), int(box[3] * h))).resize((320, 320)))
    scores = sorted((sum(ImageStat.Stat(ImageChops.difference(pics[a], pics[b])).mean) / 3, a, b) for a, b in itertools.combinations(range(8), 2))
    print(f"  {fmt}: lowest {scores[0][0]:.1f} ({STAGES[scores[0][1]]} / {STAGES[scores[0][2]]}), "
          f"next {scores[1][0]:.1f} ({STAGES[scores[1][1]]} / {STAGES[scores[1][2]]}), median {scores[len(scores) // 2][0]:.1f}")
