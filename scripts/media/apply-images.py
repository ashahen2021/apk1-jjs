#!/usr/bin/env python3
"""Download the images listed in scripts/media/images-plan.json from Wikimedia
Commons and add them as media.hero / media.gallery entries to the dynasty and
artifact pages, with credit, licence and source URL.

  python3 scripts/media/apply-images.py
"""
import json, os, re, subprocess, sys

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
PLAN = os.path.join(ROOT, "scripts/media/images-plan.json")
DYN = os.path.join(ROOT, "src/data/dynasties.yaml")
ART = os.path.join(ROOT, "src/content/artifacts")
q = json.dumps


def slugify(title):
    name = title.split(":", 1)[1].rsplit(".", 1)[0]
    return re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")[:60]


CACHE = os.path.join(ROOT, "scripts/media/images-meta.json")


def download(item, cache):
    page = item["page"]
    folder = f"dynasties/{page[1:]}" if re.fullmatch(r"d\d+", page) else f"artifacts/{page}"
    outdir = os.path.join(ROOT, "src/assets/media", folder)
    os.makedirs(outdir, exist_ok=True)
    ext = ".png" if item["file"].lower().endswith(".png") else ".jpg"
    out = os.path.join(outdir, slugify(item["file"]) + ext)
    if item["file"] in cache and os.path.exists(out):
        return folder, os.path.basename(out), cache[item["file"]]
    res = subprocess.run([sys.executable, os.path.join(ROOT, "scripts/media/commons.py"), "fetch",
                          item["file"], out, str(item.get("width", 1600))],
                         capture_output=True, text=True, check=True)
    m = json.loads(res.stdout.strip().splitlines()[-1])
    if item.get("prefix"):
        m["credit"] = re.sub(r"^Photo:", item["prefix"] + ":", m["credit"])
    cache[item["file"]] = m
    json.dump(cache, open(CACHE, "w"), indent=1, ensure_ascii=False)
    return folder, os.path.basename(out), m


def picture(rel, item, m, indent):
    p = " " * indent
    lines = [f"src: {rel}", f"alt: {q(item['alt'])}", f"caption: {q(item['caption'])}",
             f"kind: {item.get('kind', 'photo')}", f"credit: {q(m['credit'])}",
             f"license: {q(m['license'])}", f"sourceUrl: {m['sourceUrl']}"]
    return [p + l for l in lines]


def insert(lines, start, end, base, rel, item, m):
    """Insert into the mapping whose keys are indented by `base` spaces, between lines[start:end]."""
    b = " " * base
    media_i = next((i for i in range(start, end) if lines[i] == f"{b}media:"), None)
    if item.get("gallery"):
        if media_i is None:
            lines.insert(start, f"{b}media:")
            media_i = start
        g = next((i for i in range(media_i, end + 1) if lines[i] == f"{b}  gallery:"), None)
        pic = picture(rel, item, m, base + 6)
        pic[0] = " " * (base + 4) + "- " + pic[0].lstrip()
        if g is None:
            lines[media_i + 1:media_i + 1] = [f"{b}  gallery:"] + pic
        else:
            j = g + 1
            while j < len(lines) and lines[j].startswith(" " * (base + 4)):
                j += 1
            lines[j:j] = pic
    else:
        block = [f"{b}  hero:"] + picture(rel, item, m, base + 4)
        if media_i is None:
            lines[start:start] = [f"{b}media:"] + block
        else:
            lines[media_i + 1:media_i + 1] = block


def main():
    plan = json.load(open(PLAN))
    cache = json.load(open(CACHE)) if os.path.exists(CACHE) else {}
    got = []
    for item in plan:
        got.append(download(item, cache))
        print(item["page"], got[-1][1], got[-1][2]["license"], flush=True)
    if "--download-only" in sys.argv:
        return
    dyn = open(DYN).read().split("\n")
    for item, (folder, name, m) in zip(plan, got):
        page = item["page"]
        if page.startswith("d") and page[1:].isdigit():
            n = page[1:]
            s = dyn.index(f'- id: "{n}"')
            e = next((i for i in range(s + 1, len(dyn)) if dyn[i].startswith("- id:")), len(dyn))
            insert(dyn, s + 1, e, 2, f"../assets/media/{folder}/{name}", item, m)
        else:
            path = os.path.join(ART, page + ".md")
            lines = open(path).read().split("\n")
            e = lines.index("---", 1)
            insert(lines, 1, e, 0, f"../../assets/media/{folder}/{name}", item, m)
            open(path, "w").write("\n".join(lines))
    open(DYN, "w").write("\n".join(dyn))


if __name__ == "__main__":
    main()
