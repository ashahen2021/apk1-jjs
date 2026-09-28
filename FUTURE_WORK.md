# Future work

Items deliberately left out of the first production release. None blocks the current site.

## Operations (do first)

- **Connect contact-form delivery**: create a Resend account, verify the production domain, and set `RESEND_API_KEY`, `CONTACT_FROM` and the final `CONTACT_EMAIL` (see README → Contact form). Until then the form shows a "not accepting messages" state.
- **Custom domain**: attach it in Vercel and set `SITE_URL`; submit the sitemap to Google Search Console.
- **Default branch**: merge `claude/neokemetai-platform-build-dyfuu8` into the repository's default branch so production deploys follow it.
- Optional, privacy-respecting analytics (e.g. Vercel Web Analytics). Update `/privacy/` and `POLICY_LAST_UPDATED` before enabling it.

## Content and structure

- **Valley of the Kings hub** page linking KV62, KV17, KV43 and future tombs, with a site plan.
- **Valley of the Queens hub** page, starting from QV66.
- **Additional tombs** (e.g. KV5, KV7, KV9, KV11, KV34, KV35, QV44), using the tomb-plan pipeline in `src/data/plans/`.
- **Additional Giza subpages**: Pyramid of Khafre, Pyramid of Menkaure, Khufu's boats, the workers' town (Heit el-Ghurab), the mastaba cemeteries, the valley temples.
- **Arabic version** of the site (i18n routing, right-to-left layout, translated content).
- Richer media for text-first pages (pharaohs, dynasties, artifacts): licensed photographs with credits.

## 3D and visualisation

- Additional 3D models: Khafre and Menkaure pyramids in detail, the Sphinx beyond a massing model, temples, and more tomb interiors.
- Replace the schematic plateau layout with positions traced from a published survey plan.
- Add course-level detail to the Great Pyramid model only where surveyed data exists.

## Sources

- **Replace secondary-only citations with primary sources.** Several Giza statements rest on Wikipedia articles (marked "Reference works consulted" on the pages): the Great Pyramid's height today, volume and block count; the Queen's Chamber shaft explorations; the Big Void figures (Morishima et al. 2017, not read directly); the Sphinx dimensions, nose, beard and attributions; the Khafre and Menkaure temple details; 4th Dynasty dates. Read the primary publications (Lehner & Hawass 2017, Lehner 1991, Morishima 2017, Reisner 1931, Hölscher 1912, Stadelmann, Dobrev) and cite them directly.
- Read and cite the full texts of papers used only through their abstracts (Sheisha et al. 2022, Spence 2000).
- Survey positions for the Great Pyramid's shafts, relieving chambers and well shaft, currently approximate.
- Repeat the same source-verification pass for pages outside the Giza and showcase-tomb clusters.

## Technical

- Automated checks in CI: `astro check`, build, internal-link crawl and a basic accessibility scan on every pull request.
- Rate limiting for `/api/contact` (e.g. Vercel Firewall rule) if spam gets past the honeypot and timing checks.
- Remove the unused variables flagged as hints by `astro check` in `scripts/render/pyramid.js` and `TombExplorer.astro`.
