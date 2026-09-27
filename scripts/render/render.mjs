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
import yaml from 'js-yaml';

const root = path.resolve(fileURLToPath(import.meta.url), '../../..');
const media = (...p) => path.join(root, 'src/assets/media', ...p);

const JOBS = {
  gizaToday: [media('monuments/great-pyramid/giza-today.jpg')],
  gizaBuilt: [media('monuments/great-pyramid/giza-as-built.jpg')],
  gizaCore: [media('monuments/great-pyramid/khufu-core-masonry.jpg')],
  gizaPanorama: [media('monuments/great-pyramid/giza-plateau-360.jpg')],
  stepPyramidView: [media('monuments/step-pyramid-of-djoser/step-pyramid.jpg')],
  stepPyramidPoster: [media('monuments/step-pyramid-of-djoser/model-poster.png')],
  stepPyramidGlb: [path.join(root, 'public/models/step-pyramid-of-djoser.glb')],
  pyramidionView: [media('artifacts/pyramidion-of-amenemhat-iii/pyramidion.jpg')],
  pyramidionSpin: [media('spins/pyramidion-of-amenemhat-iii')],
};

/**
 * Tomb renders, generated from src/data/plans/<plan>.yaml. Run one with
 * `node scripts/render/render.mjs tomb:kv62`. Camera angles come from the plan's
 * `camera` field, which the page also uses, so the poster matches the 3D view.
 * Interior cameras are [x, eye height, y] in plan metres.
 */
const TOMBS = {
  kv62: {
    folder: 'tombs/kv62-tutankhamun',
    view: {},
    interiors: {
      'burial-chamber': { from: [-17.9, -6.2, -6.6], to: [-15.3, -7.3, -9.8] },
      antechamber: { from: [-15.5, -5.3, 1.3], to: [-17.6, -6.4, -4.6], fov: 72 },
    },
    // Before/after pair: the burial chamber as Carter found it, and today.
    details: {
      'as-found': { space: 'kv62-j', shrines: true, theta: 150 },
      today: { space: 'kv62-j', theta: 150 },
    },
  },
  kv17: {
    folder: 'tombs/kv17-seti-i',
    view: { heroPad: 0.5 },
    interiors: {
      crypt: { from: [6.3, -26.2, 92.8], to: [-0.4, -27, 98], fov: 72, lamp: [5.6, -25.8, 93.4] },
      'pillared-hall': { from: [3.5, -15.9, 52.6], to: [-3.2, -16.9, 59.8], fov: 72 },
    },
  },
  kv43: {
    folder: 'tombs/kv43-thutmose-iv',
    view: { heroPad: 0.6 },
    interiors: {
      'burial-chamber': { from: [26.5, -19.9, 36.4], to: [26.5, -22.6, 23.4], fov: 66 },
    },
  },
  qv66: {
    folder: 'tombs/qv66-nefertari',
    view: {},
    interiors: {
      'burial-chamber': { from: [1.5, -4.3, -12.6], to: [1.5, -5.6, -21.5], fov: 72, lamp: [2.3, -4, -13] },
      antechamber: { from: [1.8, -0.9, -0.4], to: [-2.2, -1.7, -4.6], fov: 72 },
    },
  },
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
await page.waitForFunction(() => window.jobs && window.tombJobs && window.pyramidJobs && window.ready);
await page.evaluate(() => window.ready);

const selected = process.argv.slice(2).length ? process.argv.slice(2) : [...Object.keys(JOBS), ...Object.keys(TOMBS).map((t) => `tomb:${t}`)];
const decode = (s) => Buffer.from(s.replace(/^data:[^,]+,/, ''), 'base64');

async function renderTomb(id) {
  const cfg = TOMBS[id];
  const plan = yaml.load(await readFile(path.join(root, `src/data/plans/${id}.yaml`), 'utf8'));
  const view = { ...(plan.camera ?? { theta: 35, phi: 52 }), ...cfg.view };
  const dir = media(cfg.folder);
  await mkdir(dir, { recursive: true });
  const out = [
    ['hero.jpg', await page.evaluate(([p, v]) => window.tombJobs.hero(p, v), [plan, view])],
    ['model-poster.png', await page.evaluate(([p, v]) => window.tombJobs.poster(p, v), [plan, view])],
  ];
  for (const [name, cam] of Object.entries(cfg.interiors)) {
    out.push([`${name}.jpg`, await page.evaluate(([p, c]) => window.tombJobs.interior(p, c), [plan, cam])]);
  }
  for (const [name, opts] of Object.entries(cfg.details ?? {})) {
    out.push([`${name}.jpg`, await page.evaluate(([p, o]) => window.tombJobs.detail(p, o), [plan, opts])]);
  }
  for (const [name, data] of out) await writeFile(path.join(dir, name), decode(data));
  const glbPath = path.join(root, `public/models/${id}.glb`);
  await writeFile(glbPath, decode(await page.evaluate((p) => window.tombJobs.glb(p), plan)));
  console.log(`tomb:${id} → ${path.relative(root, dir)} (${out.length} images) + ${path.relative(root, glbPath)}`);
}

/** Great Pyramid GLB and one poster per view mode; the plateau GLB, posters and heroes. */
async function renderGiza() {
  const data = yaml.load(await readFile(path.join(root, 'src/data/structures/great-pyramid.yaml'), 'utf8'));
  const gp = media('monuments/great-pyramid');
  await mkdir(gp, { recursive: true });
  for (const mode of await page.evaluate(() => window.pyramidJobs.modes)) {
    await writeFile(path.join(gp, `model-${mode}.png`), decode(await page.evaluate(([d, m]) => window.pyramidJobs.poster(d, m), [data, mode])));
  }
  await writeFile(path.join(root, 'public/models/great-pyramid.glb'), decode(await page.evaluate((d) => window.pyramidJobs.glb(d), data)));
  const pl = media('monuments/giza-plateau');
  await mkdir(pl, { recursive: true });
  for (const mode of ['built', 'today']) {
    await writeFile(path.join(pl, `model-${mode}.png`), decode(await page.evaluate((m) => window.pyramidJobs.plateauPoster(m), mode)));
  }
  await writeFile(path.join(root, 'public/models/giza-plateau.glb'), decode(await page.evaluate(() => window.pyramidJobs.plateauGlb())));
  await writeFile(path.join(pl, 'plateau.jpg'), decode(await page.evaluate(() => window.pyramidJobs.plateauHero())));
  const sp = media('monuments/great-sphinx');
  await mkdir(sp, { recursive: true });
  await writeFile(path.join(sp, 'sphinx.jpg'), decode(await page.evaluate(() => window.pyramidJobs.sphinxHero())));
  console.log('giza → great-pyramid posters + GLB, giza-plateau posters + GLB + hero, great-sphinx hero');
}

for (const name of selected) {
  if (name === 'giza') {
    await renderGiza();
    continue;
  }
  if (name.startsWith('tomb:')) {
    await renderTomb(name.slice(5));
    continue;
  }
  const [target] = JOBS[name];
  const started = Date.now();
  const result = await page.evaluate((job) => window.jobs[job](), name);
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
