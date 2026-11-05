---
name: appinventor4arab-writer
description: Update, rewrite or write Arabic articles for appinventor4arab.com (a Blogger site with AdSense about phones, Android apps and games) as Blogger-ready HTML. Use whenever the user sends an article's code from this site, asks to refresh a page to win back rankings, asks for the next article to update, asks for free images, an image gallery or a hero image for an article, or mentions appinventor4arab, Blogger posts for phones (Samsung, Poco, Redmi, Huawei) or Android apps. Read appinventor4arab/PROJECT-STATUS.md in the repo first when it exists.
---

# appinventor4arab.com article workflow

## 0. Start here
1. Read `appinventor4arab/PROJECT-STATUS.md` (repo root) for what is done, what is pending and what comes next. Update it at the end of every article.
2. Finished articles live in `appinventor4arab/articles/`. Reuse their structure and style.
3. Reply to the user in Arabic. In Arabic replies, put every English word on its own line (user preference, no exceptions).

## 1. Diagnose before writing
- Find the queries the page gets (Search Console data from the user, or GuinRank / SERP tools). Match the article to the dominant search intent: a "best X" guide and an "all X phones in order" list are different intents; cover both in one page when both queries land on it.
- Check the current SERP for the main query and note what the top results cover that the old page does not.
- If two site pages compete for the same query, recommend merging and a permanent custom redirect (Blogger Settings > Errors and redirects > Custom redirects, Permanent: yes).
- Low priority: pages ranked beyond ~30 with strong competitors (e.g. the age calculator).

## 2. Content rules
- Verify every spec, release date, price and app availability (GSMArena, official sites, Play Store / AppGallery) before writing it. Never invent a model or a spec. If unsure, leave it out.
- Remove stale and wrong content; replace dead or pirated download links. No links to pirated games or APKs (AdSense risk).
- Top of article: `آخر تحديث: <month> <year>` line, then a direct answer to the query in the first paragraph.
- Use a short table of contents, H2/H3 headings in Arabic, comparison table, pros/cons, "لمن يناسب", and an FAQ section at the end.
- Write model names in Arabic in body text as the user's existing articles do (e.g. «بوكو إف 8 برو»).

## 3. Blogger HTML constraints
- Output is a body fragment only (no html/head/body). The user pastes it in HTML view and must not switch back to Compose view afterwards (it rewrites the code). Say this when delivering.
- Every paragraph/heading: `dir="rtl" style="text-align: right;"`.
- Scope all CSS under a unique id (`#sgal`, `#pgal`...) so it does not leak into the theme.
- Images: `max-width:100%; height:auto;`, explicit width/height, `loading="lazy"` except the first image.
- Tables: wrap in a div with `overflow-x:auto` so they never widen the page on mobile.
- 91% of visitors are on mobile: everything must work at 390px width.

## 4. Images
- Free images: Wikimedia Commons only (CC0, CC BY, CC BY-SA). Find titles with web search `site:commons.wikimedia.org <model>`, then fetch metadata for many titles in ONE API call (titles joined with `|`, `prop=imageinfo&iiprop=url|extmetadata`). The API returns 429 on rapid calls: batch and retry slowly.
- Check each image really shows the named model (e.g. a "Poco X7" file that actually shows the X7 Pro is rejected). If no correct image exists, use no image rather than a wrong one.
- Credit under every image: author, licence with link, and «ويكيميديا كومنز».
- Hosting: the user uploads images to Blogger and sends back the URLs. Use placeholders `PASTE-URL-01`... until then, and list which file goes to which placeholder. Blogger size segments: `/s1200/` for links, `/w640-h427/` (or the matching ratio) for display, `/s160-c/` for thumbnails.
- Name image files with descriptive English slugs (e.g. `00-best-redmi-phones-2026.webp`).

## 5. Gallery (optional, user decides)
- Template: `templates/gallery.html`. Order newest to oldest. Change the root id and the aria-label per article.
- Known fixes already in the template: arrows and counter use `direction:ltr` (RTL mirrors them otherwise); thumbnail clicks scroll the thumbnail bar with `tb.scrollTo`, never `scrollIntoView` (that scrolls the whole page sideways).

## 6. Hero image
- Template: `templates/hero.html` (1200x800, Cairo font from Google Fonts, Arabic title with the main keyword, 2-3 keyword chips, year badge, one free phone photo).
- Render: `node scripts/shot.js <hero.html> <out.png>` (prints true when Cairo loaded), convert to WebP (~50 KB).
- Check a 16:9 centre crop (social share previews) keeps all text visible.
- If the hero uses a Commons photo, add its credit line under the hero in the article.

## 7. Test before delivery
- `node scripts/check-mobile.js <article.html> ...` renders at 390px and reports broken images, iframe sizes and elements wider than the screen. Fix until `0 broken` (placeholders excepted) and `wide: 0`.
- For galleries also click through arrows and thumbnails and confirm the page does not scroll sideways.
- Playwright and Chromium are preinstalled in cloud sessions; do not reinstall.

## 8. Deliver
- Save the final file to `appinventor4arab/articles/<slug>-<year>.html`, send it to the user, and give: suggested title, meta description (Blogger "Search description"), permalink advice (keep the old URL), labels, images to upload, redirects to set.
- Remind: request indexing in Search Console after publishing; compare after 28 days.
- Update `appinventor4arab/PROJECT-STATUS.md`, commit and push when the user asked for repo work.
