# Content strengthening plan (thin pages)

Goal: lift thin pages that Search Console lists as "Discovered – currently not indexed" to substantial, original, sourced text, each with copyright-free images. Work in batches; commit and push after each batch, then tick it off here. A resumed session continues from the first unticked line.

## How to do one batch

1. For each page, read the matching Wikipedia article through Firecrawl (`formats: ["query"]`, ask for facts with dates), and check against the site's own pharaoh/monument pages so nothing contradicts them.
2. Write original prose (3 headed sections, about 350–450 words), only with facts stated in the sources read. Dates in prose must agree with `start`/`end` in `src/data/dynasties.yaml` (Shaw chronology); avoid exact dates where references disagree.
3. Put the text in `scripts/content/dynasties-batchN.json` (same shape as batch 1) and run `python3 scripts/content/dynasty-history.py scripts/content/dynasties-batchN.json`.
4. `npm run build` must pass with 0 errors. Commit, push, tick the batch below.

## Dynasties (`src/data/dynasties.yaml` → `history`, `sources`)

- [x] Batch 1: 4, 12, 18, 19, 25, 26
- [x] Batch 2: 1, 2, 3, 5, 6
- [ ] Batch 3: 11, 13, 17, 20, 21
- [ ] Batch 4: 22, 23, 24, 27, 28
- [ ] Batch 5: 29, 30, 7, 8, 9, 10, 14, 15, 16 (short, poorly documented periods: say so, keep to what is known)

## Artifacts (`src/content/artifacts/*.md` body)

- [ ] Batch 6: narmer-palette, ivory-statuette-of-khufu, seated-statue-of-hatshepsut, bust-of-nefertiti
- [ ] Batch 7: gold-mask-of-tutankhamun, younger-memnon, pyramidion-of-amenemhat-iii

## Images (needs network access)

Free images only: Wikimedia Commons files marked public domain or CC BY/CC BY-SA (record author and licence), or museum open-access CC0 images (Metropolitan Museum, Cleveland Museum of Art, Art Institute of Chicago). Download to `src/assets/media/dynasties/<id>/` or the artifact's folder and add a `media.hero` / `media.gallery` entry with `alt`, `kind: photo`, `credit`, `license` and `sourceUrl`.

- [ ] Blocked until these hosts are allowed in the environment's network settings: `upload.wikimedia.org`, `commons.wikimedia.org`, `collectionapi.metmuseum.org`, `images.metmuseum.org` (optionally `openaccess-api.clevelandart.org`, `api.artic.edu`, `www.artic.edu`).
- [ ] Images for dynasty batch 1 pages
- [ ] Images for the remaining dynasty and artifact pages

After every deploy to Hostinger (`npm run build:hostinger`, upload `dist/`), request indexing in Search Console for the pages changed in that batch.
