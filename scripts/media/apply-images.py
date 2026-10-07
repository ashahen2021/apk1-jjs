#!/usr/bin/env python3
"""Download the images listed in scripts/media/images-plan.json from Wikimedia
Commons and add them as media.hero / media.gallery entries to the dynasty and
artifact pages, with credit, licence and source URL.

  python3 scripts/media/apply-images.py
"""
import hashlib, json, os, re, sys, time, urllib.error, urllib.parse, urllib.request

UA = {"User-Agent": "NeoKemetAI-media-script/1.0 (https://neokemetai.online)"}

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
CACHE = os.path.join(ROOT, "scripts/media/images-meta.json")
PLAN = os.path.join(ROOT, "scripts/media/images-plan.json")
DYN = os.path.join(ROOT, "src/data/dynasties.yaml")
ART = os.path.join(ROOT, "src/content/artifacts")
q = json.dumps


def slugify(title):
    name = title.split(":", 1)[1].rsplit(".", 1)[0]
    return re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")[:60]


def thumb_url(title, width):
    """Direct thumbnail URL on upload.wikimedia.org (no API call, so no API rate limit)."""
    name = title.split(":", 1)[1].replace(" ", "_")
    h = hashlib.md5(name.encode()).hexdigest()
    qn = urllib.parse.quote(name)
    return f"https://upload.wikimedia.org/wikipedia/commons/thumb/{h[0]}/{h[:2]}/{qn}/{width}px-{qn}"


def download(item, cache):
    """cache maps file title -> [licence, author, original width] (see images-meta.json)."""
    page = item["page"]
    folder = f"dynasties/{page[1:]}" if re.fullmatch(r"d\d+", page) else f"artifacts/{page}"
    outdir = os.path.join(ROOT, "src/assets/media", folder)
    os.makedirs(outdir, exist_ok=True)
    ext = ".png" if item["file"].lower().endswith(".png") else ".jpg"
    out = os.path.join(outdir, slugify(item["file"]) + ext)
    lic, author, w = cache[item["file"]]
    if not os.path.exists(out) or os.path.getsize(out) < 5000:
        width = next(b for b in (1280, 960, 500, 330) if b <= w)
        for attempt in range(8):
            try:
                req = urllib.request.Request(thumb_url(item["file"], width), headers=UA)
                data = urllib.request.urlopen(req, timeout=60).read()
                break
            except urllib.error.HTTPError as e:
                if e.code != 429 or attempt == 7:
                    raise
                time.sleep(5 + 5 * attempt)
        open(out, "wb").write(data)
    prefix = item.get("prefix", "Photo")
    m = {"credit": f"{prefix}: {author} / Wikimedia Commons", "license": lic,
         "sourceUrl": "https://commons.wikimedia.org/wiki/" + urllib.parse.quote(item["file"].replace(" ", "_"))}
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
    cache = json.load(open(CACHE))
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
