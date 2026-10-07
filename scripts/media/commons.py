#!/usr/bin/env python3
"""Find and download freely licensed images from Wikimedia Commons.

  search:   python3 scripts/media/commons.py search "Narmer Palette" [limit]
  fetch:    python3 scripts/media/commons.py fetch "File:Name.jpg" out/path.jpg [width]

`fetch` prints a YAML snippet with credit, license and sourceUrl. Only files
whose licence is public domain, CC0, CC BY or CC BY-SA are accepted.
"""
import json, re, sys, time, urllib.error, urllib.parse, urllib.request, html

API = "https://commons.wikimedia.org/w/api.php"
UA = {"User-Agent": "NeoKemetAI-media-script/1.0 (https://neokemetai.online)"}
FREE = re.compile(r"^(public domain|pd|cc0|cc by(-sa)? [0-9.]+)", re.I)


def open_url(url, timeout=60):
    """GET with retries: Wikimedia rate-limits shared IPs (HTTP 429)."""
    for attempt in range(8):
        try:
            return urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=timeout).read()
        except urllib.error.HTTPError as e:
            if e.code != 429 or attempt == 7:
                raise
            time.sleep(int(e.headers.get("retry-after") or 5) + 2 * attempt)


def get(params):
    params = {**params, "format": "json", "formatversion": "2"}
    return json.loads(open_url(API + "?" + urllib.parse.urlencode(params), 30))


def clean(s):
    return html.unescape(re.sub(r"<[^>]+>", "", s or "")).strip()


def info(titles, width=1600):
    d = get({"action": "query", "titles": "|".join(titles), "prop": "imageinfo",
             "iiprop": "url|size|extmetadata|mime", "iiurlwidth": width})
    return d["query"]["pages"]


def meta(p):
    ii = p["imageinfo"][0]
    m = ii.get("extmetadata", {})
    lic = clean(m.get("LicenseShortName", {}).get("value"))
    return ii, lic, clean(m.get("Artist", {}).get("value")), clean(m.get("ImageDescription", {}).get("value"))


def search(q, limit=8):
    d = get({"action": "query", "list": "search", "srsearch": q + " filetype:bitmap",
             "srnamespace": 6, "srlimit": limit})
    titles = [s["title"] for s in d["query"]["search"]]
    if not titles:
        return
    for p in info(titles):
        if "imageinfo" not in p:
            continue
        ii, lic, artist, desc = meta(p)
        ok = "OK " if FREE.match(lic) else "-- "
        print(f"{ok}{p['title']} | {ii['width']}x{ii['height']} | {lic} | {artist[:50]} | {desc[:110]}")


def fetch(title, out, width=1600):
    p = info([title], width)[0]
    ii, lic, artist, _ = meta(p)
    if not FREE.match(lic):
        sys.exit(f"refused: licence {lic!r}")
    url = ii.get("thumburl") or ii["url"]
    data = open_url(url)
    with open(out, "wb") as f:
        f.write(data)
    artist = re.sub(r"\s+", " ", artist) or "Unknown author"
    print(json.dumps({"credit": f"Photo: {artist} / Wikimedia Commons", "license": lic,
                      "sourceUrl": ii["descriptionurl"]}))


if __name__ == "__main__":
    cmd = sys.argv[1]
    if cmd == "search":
        search(sys.argv[2], int(sys.argv[3]) if len(sys.argv) > 3 else 8)
    elif cmd == "fetch":
        fetch(sys.argv[2], sys.argv[3], int(sys.argv[4]) if len(sys.argv) > 4 else 1600)
