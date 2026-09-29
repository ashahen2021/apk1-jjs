/**
 * Renders a vertical (9:16, 1080×1920) short from a tomb plan and encodes it.
 *
 *   node scripts/render/video.mjs kv62 [--fps 30] [--seconds 22] [--out file.mp4]
 *
 * Needs Chromium (CHROMIUM_PATH) and ffmpeg (FFMPEG_PATH, or ffmpeg on PATH;
 * `pip install imageio-ffmpeg` provides one). Rendering uses software WebGL,
 * so a 22-second short takes several minutes.
 */
import http from 'node:http';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
import yaml from 'js-yaml';

const root = path.resolve(fileURLToPath(import.meta.url), '../../..');
const args = process.argv.slice(2);
const name = args.find((a) => !a.startsWith('--')) ?? 'kv62';
const opt = (k, d) => { const i = args.indexOf(`--${k}`); return i >= 0 ? args[i + 1] : d; };
const fps = Number(opt('fps', 30));
const seconds = Number(opt('seconds', 22));
const outFile = path.resolve(opt('out', path.join(root, `${name}-short.mp4`)));
const framesDir = path.join(root, '.video-frames', name);

const types = { '.html': 'text/html', '.js': 'text/javascript', '.woff2': 'font/woff2' };
const server = http.createServer(async (req, res) => {
  const file = path.join(root, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  try {
    const body = await readFile(file.endsWith('/') ? `${file}index.html` : file);
    res.writeHead(200, { 'content-type': types[path.extname(file)] ?? 'application/octet-stream' });
    res.end(body);
  } catch { res.writeHead(404).end(); }
}).listen(0);

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH,
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});
const page = await browser.newPage();
page.on('pageerror', (e) => console.error('[page]', e.message));
await page.goto(`http://localhost:${server.address().port}/scripts/render/video.html`);
await page.waitForFunction(() => window.videoJobs);

const plan = yaml.load(await readFile(path.join(root, `src/data/plans/${name}.yaml`), 'utf8'));
await page.evaluate(([n, p]) => window.videoJobs.setup(n, p), [name, plan]);

// --preview 1,5,12: render only those moments (seconds) as JPGs, for checking framing.
const preview = opt('preview');
if (preview) {
  const dir = path.join(root, '.video-frames', `${name}-preview`);
  await mkdir(dir, { recursive: true });
  for (const t of preview.split(',').map(Number)) {
    await writeFile(path.join(dir, `t${t}.jpg`), Buffer.from((await page.evaluate((x) => window.videoJobs.frame(x), t)).split(',')[1], 'base64'));
  }
  console.log(`preview → ${dir}`);
  await browser.close();
  server.close();
  process.exit(0);
}

await rm(framesDir, { recursive: true, force: true });
await mkdir(framesDir, { recursive: true });
const total = Math.round(fps * seconds);
const started = Date.now();
for (let i = 0; i < total; i++) {
  const data = await page.evaluate((t) => window.videoJobs.frame(t), i / fps);
  await writeFile(path.join(framesDir, `f${String(i).padStart(4, '0')}.jpg`), Buffer.from(data.split(',')[1], 'base64'));
  if (i % fps === 0) console.log(`frame ${i}/${total} (${((Date.now() - started) / 1000).toFixed(0)} s)`);
}
await browser.close();
server.close();

const ffmpeg = process.env.FFMPEG_PATH ?? 'ffmpeg';
execFileSync(ffmpeg, [
  '-y', '-framerate', String(fps), '-i', path.join(framesDir, 'f%04d.jpg'),
  '-f', 'lavfi', '-i', 'anullsrc=channel_layout=stereo:sample_rate=48000',
  '-shortest', '-c:v', 'libx264', '-profile:v', 'high', '-pix_fmt', 'yuv420p', '-crf', '18', '-preset', 'slow',
  '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', outFile,
], { stdio: 'inherit' });
await rm(path.join(root, '.video-frames'), { recursive: true, force: true });
console.log(`→ ${outFile}`);
