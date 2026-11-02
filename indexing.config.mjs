// Pages kept out of search results (noindex, and left out of the sitemap) until their content
// is expanded. Visitors can still open them from links. Imported by the Astro site
// (src/components/Seo.astro) and by astro.config.mjs for the sitemap.

/** Dynasty pages with too little unique text to be worth indexing yet. Remove an id once expanded. */
export const NOINDEX_DYNASTIES = ['2', '7', '8', '9', '10', '13', '14', '16', '17', '21', '22', '23', '24', '27', '28', '29'];

/**
 * Individual film pages mostly repeat the YouTube description, so they stay out of the index;
 * the /videos/ listing remains indexed.
 */
export const NOINDEX_VIDEO_PAGES = true;

/** True when the page at this pathname should carry noindex. */
export function isNoindexPath(pathname) {
  const path = pathname.endsWith('/') ? pathname : `${pathname}/`;
  const dynasty = path.match(/^\/dynasties\/([^/]+)\/$/);
  if (dynasty) return NOINDEX_DYNASTIES.includes(dynasty[1]);
  return NOINDEX_VIDEO_PAGES && /^\/videos\/[^/]+\/$/.test(path);
}
