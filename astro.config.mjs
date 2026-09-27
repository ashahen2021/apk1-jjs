// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Canonical URLs, sitemap and Open Graph tags use this. Order of precedence:
// 1. SITE_URL (set it in Vercel once a custom domain is attached)
// 2. Vercel's production domain, provided automatically on Vercel builds
// 3. localhost for local development
const vercelDomain = process.env.VERCEL_PROJECT_PRODUCTION_URL;
const site = process.env.SITE_URL ?? (vercelDomain ? `https://${vercelDomain}` : 'http://localhost:4321');

export default defineConfig({
  site,
  trailingSlash: 'ignore',
  integrations: [sitemap()],
  build: { format: 'directory' },
});
