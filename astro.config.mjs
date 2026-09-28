// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { SITE_URL } from './site.config.mjs';

// Canonical URLs, sitemap and Open Graph tags use this. Order of precedence:
// 1. SITE_URL environment variable, then SITE_URL in site.config.mjs
// 2. Vercel's production domain, provided automatically on Vercel builds
// 3. localhost for local development
const vercelDomain = process.env.VERCEL_PROJECT_PRODUCTION_URL;
const site = process.env.SITE_URL || SITE_URL || (vercelDomain ? `https://${vercelDomain}` : 'http://localhost:4321');

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
