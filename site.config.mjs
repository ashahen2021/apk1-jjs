// Site-wide settings that are edited by hand. Imported by the Astro site
// (src/lib/site.ts) and by the contact-form function (api/contact.js), so each
// value lives in exactly one place.

/**
 * Production address of the site, used for canonical URLs, the sitemap and
 * social cards. Required when building for Hostinger or any host other than
 * Vercel (e.g. 'https://neokemetai.com', no trailing slash). The SITE_URL
 * environment variable overrides it.
 */
export const SITE_URL = 'https://darkred-dunlin-796710.hostingersite.com'; // temporary Hostinger domain; replace with the final domain

/**
 * Where contact-form messages are delivered. Change it here when the
 * production-domain address is ready. On Vercel, the CONTACT_EMAIL environment
 * variable overrides it without a code change. It is never printed in the HTML.
 */
export const CONTACT_EMAIL = 'neokemetai@gmail.com';

/**
 * Contact-form endpoint. On Vercel the Node function in /api/contact.js is
 * used; on Hostinger (and other PHP hosts) the PHP handler generated at
 * /api/contact.php. Chosen automatically from the build environment.
 */
export const CONTACT_ENDPOINT = process.env.VERCEL ? '/api/contact' : '/api/contact.php';

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
