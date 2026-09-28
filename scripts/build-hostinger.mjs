// npm run build:hostinger — builds dist/ for Hostinger (or any Apache/PHP host).
// Refuses to build without a production URL, because canonical links, the
// sitemap and social cards would otherwise point at localhost.
import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { SITE_URL } from '../site.config.mjs';

const url = process.env.SITE_URL || SITE_URL;
if (!/^https:\/\/[^/]+$/.test(url || '')) {
  console.error('\nSet SITE_URL first: edit site.config.mjs (e.g. https://neokemetai.com, no trailing slash)\nor run: SITE_URL=https://your-domain npm run build:hostinger\n');
  process.exit(1);
}
const env = { ...process.env, SITE_URL: url };
delete env.VERCEL; // make sure the PHP contact handler is generated
execSync('npm run build', { stdio: 'inherit', env });
for (const f of ['dist/index.html', 'dist/404.html', 'dist/.htaccess', 'dist/api/contact.php', 'dist/sitemap-index.xml']) {
  if (!existsSync(f)) { console.error(`Missing ${f}`); process.exit(1); }
}
console.log(`\nReady for Hostinger: upload the CONTENTS of dist/ (including .htaccess) to public_html. Site URL: ${url}\n`);
