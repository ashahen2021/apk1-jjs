// Site-wide settings that are edited by hand. Imported by the Astro site
// (src/lib/site.ts) and by the contact-form function (api/contact.js), so each
// value lives in exactly one place.

/**
 * Where contact-form messages are delivered. Change it here when the
 * production-domain address is ready. On Vercel, the CONTACT_EMAIL environment
 * variable overrides it without a code change. It is never printed in the HTML.
 */
export const CONTACT_EMAIL = 'neokemetai@gmail.com';

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
