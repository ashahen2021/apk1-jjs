// Site-wide settings that are edited by hand. Imported by the Astro site
// (src/lib/site.ts) and by the contact-form function (api/contact.js), so each
// value lives in exactly one place.

/**
 * Production address of the site, used for canonical URLs, the sitemap and
 * social cards. Required when building for Hostinger or any host other than
 * Vercel (e.g. 'https://neokemetai.com', no trailing slash). The SITE_URL
 * environment variable overrides it.
 */
export const SITE_URL = 'https://neokemetai.online';

/**
 * Where contact-form messages are delivered. Change it here when the
 * production-domain address is ready. On Vercel, the CONTACT_EMAIL environment
 * variable overrides it without a code change. It is never printed in the HTML.
 */
export const CONTACT_EMAIL = 'info@neokemetai.online';

/**
 * Contact-form endpoint. On Vercel the Node function in /api/contact.js is
 * used; on Hostinger (and other PHP hosts) the PHP handler generated at
 * /api/contact.php. Chosen automatically from the build environment.
 */
export const CONTACT_ENDPOINT = process.env.VERCEL ? '/api/contact' : '/api/contact.php';

/**
 * Google Analytics 4 measurement ID (looks like 'G-XXXXXXXXXX'). Leave empty to
 * disable analytics. When set, Google Analytics loads only after a visitor
 * accepts analytics cookies in the consent banner, and the privacy policy
 * describes it automatically.
 */
export const GA_MEASUREMENT_ID = '';

/**
 * Google Search Console HTML-tag verification code: only the content value of
 * <meta name="google-site-verification" content="...">. Not needed if the site
 * is verified through a DNS TXT record (recommended).
 */
export const GOOGLE_SITE_VERIFICATION = '';

/** Social profiles shown in the footer. Order here is display order. */
export const SOCIAL = [
  { id: 'facebook', label: 'Facebook', url: 'https://www.facebook.com/neokemetai' },
  { id: 'tiktok', label: 'TikTok', url: 'https://www.tiktok.com/@kemetvision6' },
  { id: 'instagram', label: 'Instagram', url: 'https://www.instagram.com/neokemetai/' },
  { id: 'pinterest', label: 'Pinterest', url: 'https://uk.pinterest.com/neokemet/' },
  { id: 'youtube', label: 'YouTube', url: 'https://www.youtube.com/@NeoKemetAI' },
];

/** Shown on /privacy/ and /disclaimer/. Update when either text changes. */
export const POLICY_LAST_UPDATED = '2026-09-28';
