/**
 * Renders the procedural reconstructions in headless Chromium and writes them
 * into src/assets/media (images, optimised by Astro at build) and public/models.
 *
 *   node scripts/render/render.mjs [job ...]
 *
 * Needs a Chromium binary: set CHROMIUM_PATH, or it falls back to Playwright's
 * default install. Renders take a few minutes with software WebGL.
 */
import http from 'node:http';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const root = path.resolve(fileURLToPath(import.meta.url), '../../..');
const media = (...p) => path.join(root, 'src/assets/media', ...p);

const JOBS = {
  gizaToday: [media('monuments/great-pyramid-of-giza/giza-today.jpg')],
  gizaBuilt: [media('monuments/great-pyramid-of-giza/giza-as-built.jpg')],
  gizaCore: [media('monuments/great-pyramid-of-giza/khufu-core-masonry.jpg')],
  gizaPanorama: [media('monuments/great-pyramid-of-giza/giza-plateau-360.jpg')],
  stepPyramidView: [media('monuments/step-pyramid-of-djoser/step-pyramid.jpg')],
  stepPyramidPoster: [media('monuments/step-pyramid-of-djoser/model-poster.png')],
  stepPyramidGlb: [path.join(root, 'public/models/step-pyramid-of-djoser.glb')],
  pyramidionView: [media('artifacts/pyramidion-of-amenemhat-iii/pyramidion.jpg')],
  pyramidionSpin: [media('spins/pyramidion-of-amenemhat-iii')],
};

const types = { '.html': 'text/html', '.js': 'text/javascript', '.woff2': 'font/woff2' };
const server = http
  .createServer(async (req, res) => {
    const file = path.join(root, decodeURIComponent(new URL(req.url, 'http://x').pathname));
    try {
      const body = await readFile(file.endsWith('/') ? `${file}index.html` : file);
      res.writeHead(200, { 'content-type': types[path.extname(file)] ?? 'application/octet-stream' });
      res.end(body);
    } catch {
      res.writeHead(404).end();
    }
  })
  .listen(0);
const port = server.address().port;

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH,
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});
const page = await browser.newPage();
page.on('console', (m) => m.type() === 'error' && console.error('[page]', m.text()));
page.on('pageerror', (e) => console.error('[page]', e.message));
await page.goto(`http://localhost:${port}/scripts/render/index.html`);
await page.waitForFunction(() => window.jobs && window.ready);
await page.evaluate(() => window.ready);

const selected = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(JOBS);
for (const name of selected) {
  const [target] = JOBS[name];
  const started = Date.now();
  const result = await page.evaluate((job) => window.jobs[job](), name);
  const decode = (s) => Buffer.from(s.replace(/^data:[^,]+,/, ''), 'base64');
  if (Array.isArray(result)) {
    await mkdir(target, { recursive: true });
    await Promise.all(result.map((r, i) => writeFile(path.join(target, `frame-${String(i).padStart(2, '0')}.jpg`), decode(r))));
  } else {
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, decode(result));
  }
  console.log(`${name} → ${path.relative(root, target)} (${((Date.now() - started) / 1000).toFixed(1)}s)`);
}
await browser.close();
server.close();
