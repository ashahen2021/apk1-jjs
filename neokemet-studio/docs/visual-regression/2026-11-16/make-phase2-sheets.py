"""Contact sheets for the phase-2 review. Usage: final_sheets.py <docs dir>"""
import sys
from PIL import Image, ImageDraw, ImageFont

D = sys.argv[1]


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


V = (270, 480)
Hh = (480, 270)
orig = [(f"original-great-pyramid/s0{i}.png", c) for i, c in [(1, "s01 title"), (2, "s02 characters"), (5, "s05 landscape"), (7, "s07 landscape")]]
sheet("03-phase2-construction-vs-original.png", "Phase 2 - construction scenes vs. the original Great Pyramid (9:16, same renderer, same resolution)", [
    ("ORIGINAL - The Great Pyramid (hand-directed storyboard, untouched)", orig),
    ("BEFORE - ramp short as first imported (regressed)", [(f"regressed/ramp-short-s0{i}.png", f"s0{i}") for i in (1, 2, 3, 4)]),
    ("AFTER PHASE 2 - same four directions, re-imported, nothing hand-edited", [(f"phase2-construction/9x16/ramp-s0{i}.png", c) for i, c in [(1, "s01 ramp wide"), (2, "s02 hauling"), (3, "s03 ramp growth"), (4, "s04 comparison")]]),
    ("MORE VIEWS of the same components (quarry, river barge, six-man crew mirrored, early stage mirrored)", [(f"phase2-construction/9x16/extra-s0{i}.png", c) for i, c in [(1, "quarry"), (2, "river transport"), (3, "hauling, crew six, facing left"), (4, "ramp wide, early, facing left")]]),
], V)
sheet("04-shipbuilding-9x16-vs-original.png", "Generalisation test - Ancient Egyptian Shipbuilding vs. the original Great Pyramid (9:16)", [
    ("ORIGINAL - The Great Pyramid", orig),
    ("NEW SUBJECT - scenes 1-4, imported from the production script, nothing hand-edited", [(f"shipbuilding-test/9x16/ship-s0{i}.png", c) for i, c in [(1, "s01 shipyard"), (2, "s02 timber"), (3, "s03 shaping"), (4, "s04 frame")]]),
    ("NEW SUBJECT - scenes 5-8", [(f"shipbuilding-test/9x16/ship-s0{i}.png", c) for i, c in [(5, "s05 assembly"), (6, "s06 rigging"), (7, "s07 launch"), (8, "s08 sailing")]]),
], V)
sheet("05-shipbuilding-16x9-vs-original.png", "Generalisation test - Ancient Egyptian Shipbuilding vs. the original Great Pyramid (16:9)", [
    ("ORIGINAL - The Great Pyramid (16:9)", [(f"original-great-pyramid/16x9/s-s0{i}.png", f"s0{i}") for i in (2, 5, 7, 8)]),
    ("NEW SUBJECT - scenes 1-4", [(f"shipbuilding-test/16x9/ship-s0{i}.png", c) for i, c in [(1, "s01 shipyard"), (2, "s02 timber"), (3, "s03 shaping"), (4, "s04 frame")]]),
    ("NEW SUBJECT - scenes 5-8", [(f"shipbuilding-test/16x9/ship-s0{i}.png", c) for i, c in [(5, "s05 assembly"), (6, "s06 rigging"), (7, "s07 launch"), (8, "s08 sailing")]]),
    ("CONSTRUCTION in 16:9", [(f"phase2-construction/16x9/ramp-s0{i}.png", c) for i, c in [(1, "ramp wide"), (2, "hauling"), (3, "ramp growth"), (4, "comparison")]]),
], Hh)
