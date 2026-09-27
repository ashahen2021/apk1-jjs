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
  data/               periods.yaml, dynasties.yaml (all 30 dynasties)
  content/            One Markdown file per entry
    pharaohs/ monuments/ tombs/ artifacts/ videos/
  lib/
    site.ts           Site name, YouTube channel, playlists, nav, glyphs
    content.ts        Sorted getters + reverse relations (e.g. everything linked to a pharaoh)
    cards.ts          Maps each entry type to <Card> props
    format.ts         BCE dates, ordinals, durations
  components/         Header, Footer, Seo, Breadcrumbs, Card, Timeline, DynastyList,
                      VideoEmbed, HeroScene, FactList, Related, ListingPage, PageHero
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

## SEO

- Per-page title, description, canonical URL, Open Graph and Twitter cards (`components/Seo.astro`)
- JSON-LD: `WebSite`, `BreadcrumbList`, `CollectionPage`/`ItemList`, `Person` (pharaohs), `LandmarksOrHistoricalBuildings` (monuments, tombs), `VisualArtwork` (artifacts), `VideoObject` (published videos)
- `sitemap-index.xml` and `robots.txt` generated at build
- Crawlable HTML everywhere: the timeline bars are real links and the full dynasty list is always rendered

## Design

Dark "night in the tomb" identity using the NeoKemet pigment palette — limestone `#D8CBA8`, lapis `#1F4E8C`, gold `#C8952B`, faience `#2E8B84`, carnelian `#A83A2C`, basalt `#14120E` — with Cinzel, Inter and Noto Sans Egyptian Hieroglyphs (self-hosted). All motion respects `prefers-reduced-motion`.
