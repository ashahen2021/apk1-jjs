// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { SITE_URL } from './site.config.mjs';

// Canonical URLs, sitemap and Open Graph tags use this. Order of precedence:
// 1. SITE_URL environment variable
// 2. on Vercel, Vercel's production domain; elsewhere (Hostinger) SITE_URL in site.config.mjs
// 3. localhost
const vercelDomain = process.env.VERCEL_PROJECT_PRODUCTION_URL;
const site = process.env.SITE_URL || (vercelDomain ? `https://${vercelDomain}` : SITE_URL) || 'http://localhost:4321';

export default defineConfig({
  site,
  trailingSlash: 'ignore',
  integrations: [sitemap()],
  build: { format: 'directory' },
  // The Great Pyramid page moved when the Giza cluster was added; keep the old URL working.
  redirects: { '/monuments/great-pyramid-of-giza': '/monuments/great-pyramid/' },
  vite: {
    // <model-viewer> (with three.js) is ~1 MB but is only fetched when a visitor opens a 3D model.
    build: { chunkSizeWarningLimit: 1100 },
  },
});
