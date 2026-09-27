# NeoKemetAI

A cinematic, interactive educational platform about ancient Egypt — all 30 dynasties, the pharaohs, monuments, tombs and artifacts, connected to films from the [NeoKemet YouTube channel](https://www.youtube.com/@NeoKemetAI).

Built with [Astro](https://astro.build) as a fully static site: every page is pre-rendered HTML (fast and crawlable), with small scripts only where interaction is needed (timeline, video player, filters, mobile menu).

## Getting started

```sh
npm install
npm run dev        # http://localhost:4321
npm run build      # type-checks content + code, then builds to dist/
npm run preview    # serve the production build
```

## Deploying to Vercel

The project is a static Astro site and is configured for Vercel in `vercel.json` (no adapter or server needed).

1. In Vercel, choose **Add New → Project** and import this GitHub repository.
2. Keep the detected settings: framework **Astro**, install `npm ci`, build `npm run build`, output `dist`. Node 22 is used (`engines` in `package.json`).
3. Deploy. Every push to the production branch redeploys, and every other branch gets its own preview URL.

Canonical URLs, the sitemap and Open Graph tags use the Vercel production domain automatically (`VERCEL_PROJECT_PRODUCTION_URL`). When you attach a custom domain, add an environment variable `SITE_URL=https://your-domain` in **Project → Settings → Environment Variables** and redeploy.

Or from the command line: `npx vercel` (preview) and `npx vercel --prod` (production).

`dist/` is plain static output, so any static host (Netlify, Cloudflare Pages, GitHub Pages) also works; set `SITE_URL` there.

## Architecture

```
src/
  content.config.ts   Schemas for every collection (Zod) — the single source of truth
  data/               periods.yaml, dynasties.yaml (all 30 dynasties), plans/*.yaml (tomb plans)
  content/            One Markdown file per entry
    pharaohs/ monuments/ tombs/ artifacts/ videos/
  lib/
    site.ts           Site name, YouTube channel, playlists, nav, glyphs
    content.ts        Sorted getters + reverse relations (e.g. everything linked to a pharaoh)
    cards.ts          Maps each entry type to <Card> props
    format.ts         BCE dates, ordinals, durations
  components/         Header, Footer, Seo, Breadcrumbs, Card, Timeline, DynastyList,
                      VideoEmbed, HeroScene, FactList, Related, ListingPage, PageHero
    media/            Gallery, CompareSlider, ModelViewer, Panorama, SpinViewer, EgyptMap,
                      TombExplorer, TombPlan, EvidenceKey, …
  assets/media/       Source images (optimised at build)
  layouts/            BaseLayout (head/SEO/fonts), EntityLayout (all detail pages)
  pages/              Routes (see below)
  styles/             tokens.css (design tokens), global.css
```

### Routes

| Route | Content |
|---|---|
| `/` | Cinematic hero, eras, featured pharaohs, videos, monuments |
| `/timeline/` | Interactive to-scale timeline + era-by-era list |
| `/dynasties/`, `/dynasties/[1–30]/` | All dynasties, one page each |
| `/pharaohs/`, `/pharaohs/[slug]/` | Profiles, filterable by era |
| `/monuments/`, `/tombs/`, `/artifacts/` + `[slug]` | Sites and objects |
| `/videos/`, `/videos/[slug]/` | NeoKemet films grouped by playlist |
| `/about/` | Chronology, sources, AI disclosure |

### Content relationships

Entries reference each other by id, and the schemas validate every reference at build time — a typo in a slug fails the build.

- pharaoh → dynasty → period
- monument → pharaohs; tomb → pharaoh, dynasty; artifact → dynasty, pharaoh, tomb
- video → pharaohs, monuments, tombs, artifacts, dynasties

Reverse links (a pharaoh's monuments, tombs, artifacts and videos) are computed in `src/lib/content.ts`, so you only ever write a relationship once.

## Adding content

**A pharaoh** — create `src/content/pharaohs/<slug>.md`:

```md
---
name: Seti I
throneName: Menmaatra
dynasty: "19"
reignStart: -1294
reignEnd: -1279
highlights:
  - Built the temple at Abydos with its king list.
description: One sentence (≤170 chars) used as the meta description.
---

Body text in Markdown.
```

**A video** — create `src/content/videos/<slug>.md`. Leave `youtubeId` out while the film is in production (the page shows a "coming soon" poster); add `youtubeId`, `published` and `duration` when it goes live to enable the video player and `VideoObject` rich results.

Monuments, tombs and artifacts follow the same pattern — see `src/content.config.ts` for every field. Years are signed integers: `-1279` means 1279 BCE.

## Media system

Every dynasty, pharaoh, monument, tomb and artifact accepts an optional `media` block (schema in `src/content.config.ts`). Pages render only the blocks an entry has, in a fixed order, so nothing shows placeholders.

| Field | Renders as | Component |
|---|---|---|
| `media.hero` | Full-bleed page header, card image, social sharing image, schema.org `image` | `PageHero`, `Card` |
| `media.gallery[]` | Grid with a swipeable, keyboard-friendly lightbox | `media/Gallery` |
| `media.compare[]` | Before/after slider (native range input: keyboard + touch) | `media/CompareSlider` |
| `media.model` | 3D viewer via `<model-viewer>`, with AR on supported phones — loaded only on click | `media/ModelViewer` |
| `media.panorama` | Drag-to-look 360° panorama with compass (left edge = north) | `media/Panorama` |
| `media.spin` | 360° turntable from a folder of frames | `media/SpinViewer` |
| `media.plan` | Chamber plan, depth profile and 3D hotspots (see Tombs below) | `media/TombExplorer` |
| `media.video` | Featured film, optionally starting at a chapter | `media/VideoFeature` |
| `coordinates` (monuments, tombs) | Locator map on the page | `media/EgyptMap` |

Every image carries `alt` and may carry `caption`, `credit`, `license`, `sourceUrl` and `kind` (`photo`, `diagram`, `reconstruction`, `model`, `illustration`). Non-photographic kinds are labelled on the page so readers can tell evidence from interpretation.

```yaml
media:
  hero:
    src: ../../assets/media/monuments/abu-simbel/facade.jpg   # relative to the .md file
    alt: The four colossi of Ramesses II on the facade of the Great Temple.
    kind: photo
    credit: Photo: Jane Doe
    license: CC BY-SA 4.0
    sourceUrl: https://commons.wikimedia.org/wiki/File:...
  compare:
    - before: { label: 1960, src: ..., alt: ... }
      after:  { label: Today, src: ..., alt: ... }
  model:
    src: /models/abu-simbel.glb           # file in public/models
    poster: ../../assets/media/monuments/abu-simbel/model-poster.png
    alt: 3D model of the Great Temple.
  spin:
    folder: abu-simbel-colossus           # frames in src/assets/media/spins/<folder>/, sorted by name
    alt: A colossus turning.
```

Videos accept an optional local `thumbnail`; otherwise YouTube's thumbnail is used. Players load from `youtube-nocookie.com` only after a click.

**Performance.** Images live in `src/assets/media` and are converted to AVIF/WebP at responsive widths during the build; only the hero is loaded eagerly (`fetchpriority="high"`). The 3D viewer (~1 MB with three.js) is a separate chunk fetched on demand; turntable frames load when the viewer nears the screen; panoramas and gallery images are lazy.

**The map.** Coastline and Nile come from [Natural Earth](https://www.naturalearthdata.com) (public domain), clipped and simplified by `npm run media:map` into `src/data/geo/egypt.json`. Ancient cities are listed in `src/data/places.ts`; monuments and tombs appear automatically from their `coordinates`.

**Reconstructions.** The current showcase images, the Step Pyramid model and the pyramidion turntable are procedural three.js reconstructions built from published dimensions (`scripts/render/`). Re-render them with `CHROMIUM_PATH=/path/to/chrome npm run media:render`; replace or add to them with photographs or scans whenever licensed material is available.

## Tombs: plans, 3D models and evidence labels

Showcase tomb pages (currently KV62, KV17, KV43 and QV66) combine a featured image, an **explorer** with a 3D model, plan and depth profile, a chamber list with hotspots, a before/after slider where meaningful, a gallery, a featured film that can start at a chapter, and a locator map. Everything in the explorer is generated from one plan file, so the 2D plan, the depth profile, the 3D model and its hotspots can never disagree.

### 1. Describe the tomb — `src/data/plans/<id>.yaml`

Coordinates are metres: `x` to the right, `y` down the page, depths negative. Each space is a rectangle:

```yaml
title: Plan of KV62, the tomb of Tutankhamun
source: Every chamber and gate is sized to the Theban Mapping Project survey …   # shown under every plan and model
area: 109.83             # optional overall figures — only when verified, with totalsNote saying how
totalsNote: Sum of the chamber and gate areas published by the Theban Mapping Project …
levels: The survey gives relative levels only …    # how floor depths were established
camera: { theta: 125, phi: 52 }   # default 3D view, shared by the poster render and the viewer
spaces:
  - id: kv62-j
    code: J                       # label on the plan and 3D hotspot
    name: Burial chamber
    kind: chamber                 # stairs | corridor | chamber | hall | well | annex | crypt | tunnel | gate
    x: [-18.73, -12.33]
    y: [-10.34, -6.2]
    floor: [-7.75, -7.75]         # start and end depth; add `descends: x-` for slopes and stairs
    height: 3.68
    measured: { length: 4.14, width: 6.4, height: 3.68, area: 26.22, source: tmp, note: … }   # the published figures; `source` is a key in `sources`
    level: documented             # evidence for the floor depth: documented | approximate (default) | uncertain
    decorated: [n, e, s, w]       # walls with decoration (drawn as colour zones, never as fake scenes)
    pillars: [[x, y], …]
    pit: { x: […], y: […], depth: 7 }                      # well shafts
    sarcophagus: { x, y, w, d, h, material: quartzite, state: in-situ, label: … }   # state: in-situ | removed | lost
    status: documented            # documented (size as published) | approximate | uncertain
    caveat: What is reconstructed (placement, depth, …).
    summary: …
    scenes:                       # wall hotspots
      - { id: north, wall: n, title: The Opening of the Mouth, text: … }
```

Spaces that touch share an edge and get a doorway automatically. Model the survey's **gates** as `kind: gate` spaces at their published thickness and width: they set the doorway widths and axial lengths, and are drawn but not listed, labelled or given hotspots. A descent cut into a room's floor takes `within: <room id>` (the room's floor gets a hole). Parts of one room at different floor levels share `room: <key>` so no wall is drawn between them. A well shaft or pit can take its own `title` and `text`. `uncertain` spaces and sarcophagi that are `removed` or `lost` are drawn as translucent ghosts, dashed in the plan.

Plan-level fields that drive the explorer:

```yaml
route: [kv62-a, kv62-b, kv62-i, kv62-j]     # entrance → burial chamber; drawn as the gold path in 3D, plan and profile
sources:                                     # "Sources for this reconstruction" on the tomb page
  - id: tmp                                  # referenced by `measured.source`
    label: Theban Mapping Project, "KV 62 (Tutankhamen)"
    url: https://thebanmappingproject.com/tombs/kv-62-tutankhamen
    used: What exactly this source was used for (dimensions, sequence, levels …).
tour:                                        # optional; defaults to the route
  - { space: qv66-2, scene: senet, text: … } # a stop can face a wall scene
```

Per-space fields:

```yaml
    condition: damaged            # damaged | unfinished
    conditionWalls: [s]           # optional: mark only these walls
    conditionNote: …
    finds: [ … ]                  # what excavators recorded (no position implied)
    features:                     # hotspots, only where the position is recorded
      - { id: breach, kind: damage, title: …, text: …, at: [x, y], z: 1.4, status: documented }   # kind: feature | find | damage | opening
```

Sarcophagi and well shafts become hotspots automatically.

**Integrity rules for plans.** Size spaces from a published survey and record it in `measured`; never from memory. The page prints a table of every published measurement against the model, flagging differences. Never add a room, pillar or feature that is not in a published plan; if a tomb has spaces you cannot place, mention them in `caveat` and leave them out of the geometry. Decoration is a flat tint on the walls that carry it — do not draw registers, friezes or scenes. Mark every space `documented`, `approximate` (shown to readers as "reconstructed geometry") or `uncertain`, and cite the plan's sources.

### 2. Render the model and images

Add the tomb to `TOMBS` in `scripts/render/render.mjs` (media folder, interior camera positions, optional before/after `details`), then:

```sh
CHROMIUM_PATH=/path/to/chrome node scripts/render/render.mjs tomb:kv62
```

This writes `public/models/<id>.glb` (a 1:50 cut-away, typically 30–120 KB) and `hero.jpg`, `model-poster.png` and interior views to `src/assets/media/tombs/<folder>/`.

### 3. Connect it in the tomb's Markdown

```yaml
media:
  hero: { src: ../../assets/media/tombs/kv62-tutankhamun/hero.jpg, alt: …, kind: model, credit: … }
  plan: kv62
  model: { src: /models/kv62.glb, poster: ../../assets/media/tombs/kv62-tutankhamun/model-poster.png, alt: …, kind: model }
  compare: [ … ]           # optional
  gallery: [ … ]
  video: { ref: boring-history-every-pharaoh-dynasty, start: "1:32:20", note: … }   # start = a chapter time
valley: kings              # kings | queens — groups the tombs page
featured: true             # showcase tombs are listed first
order: 1
```

### Evidence labels

Every image declares a `kind` — `photo` (documented evidence), `diagram`, `reconstruction` or `model` (interpretive 3D model) — and it is printed with the image. Every tomb space declares a `status`. The key is rendered by `media/EvidenceKey` on tomb pages. When evidence is incomplete, mark the space `approximate` or `uncertain` and say why in `caveat`; do not model what has not been found.

### Performance and accessibility

The explorer ships as HTML and SVG: plan, profile and every chamber description are in the page, work without JavaScript and are crawlable. `<model-viewer>` and the GLB load only after "Explore the tomb in 3D" is pressed (the button states the download size); without WebGL the explorer switches to the plan. It opens on the whole tomb and flies to a space only when one is chosen; scene and feature hotspots appear for the selected space.

Controls: tabs (3D, plan, depth profile), toggles for the path, evidence colours, hotspots and labels, a Full view button and a guided tour. Keyboard: `N`/`P` next/previous space or tour stop, `F` full view, `1`–`3` views, `R` `E` `H` `L` toggles, `T` tour, `Esc` end tour. Tabs follow the ARIA tabs pattern, plan spaces, scene markers and 3D hotspots are focusable buttons, and the chamber list becomes a swipeable strip on phones.

## SEO

- Per-page title, description, canonical URL, Open Graph and Twitter cards (`components/Seo.astro`)
- JSON-LD: `WebSite`, `BreadcrumbList`, `CollectionPage`/`ItemList`, `Person` (pharaohs), `LandmarksOrHistoricalBuildings` (monuments, tombs), `VisualArtwork` (artifacts), `VideoObject` (published videos)
- `sitemap-index.xml` and `robots.txt` generated at build
- Crawlable HTML everywhere: the timeline bars are real links and the full dynasty list is always rendered

## Design

Dark "night in the tomb" identity using the NeoKemet pigment palette — limestone `#D8CBA8`, lapis `#1F4E8C`, gold `#C8952B`, faience `#2E8B84`, carnelian `#A83A2C`, basalt `#14120E` — with Cinzel, Inter and Noto Sans Egyptian Hieroglyphs (self-hosted). All motion respects `prefers-reduced-motion`.
