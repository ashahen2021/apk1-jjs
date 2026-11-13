#!/usr/bin/env node
// Zero-dependency, read-only QA for the Royal Cache vertical pilot.
// Does not call any paid service, write project.json, or render video.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const slug = process.argv[2] || 'royal-cache-short-2026';
const PROJECT = path.join(ROOT, 'projects', slug, 'project.json');
const expectedVideo = 'YIS3_xrkv4I';
const allowed = new Set(['royal-pharaohs','tomb-robbery','priests-rewrapping','rc-07','rc-08','rc-15','rc-06','end-card']);
let errors = [], warnings = [];
const fail = s => errors.push(s);
const warn = s => warnings.push(s);
if (!fs.existsSync(PROJECT)) { console.error('Missing:', PROJECT);process.exit(2); }
const raw = JSON.parse(fs.readFileSync(PROJECT,'utf8'));
if (raw.format !== '9:16') fail('Project must use vertical 9:16.');
if (raw.fps !== 30) warn('Pilot was designed for 30 fps.');
if (!String(raw.topic||'').includes(expectedVideo)) fail('Published documentary link is missing from project topic.');
if (!Array.isArray(raw.scenes) || !raw.scenes.length || raw.scenes.length > 40) fail('Expected 1–40 scenes.');
const ids = new Set();
let estimated = 0, words = 0;
for (const [i,s] of (raw.scenes||[]).entries()) {
  const n = i+1;
  if (ids.has(s.id)) fail(`Scene ${n}: duplicate ID.`);
  ids.add(s.id);
  if (!allowed.has(s.template)) warn(`Scene ${n}: template ${s.template} was not part of this checked pilot.`);
  const w = String(s.narration||'').trim().split(/\s+/).filter(Boolean).length;
  if (!w) fail(`Scene ${n}: narration is empty.`);
  words += w;
  // Studio's default estimates: 135 words/minute, 0.5s lead, 0.9s tail.
  // Actual recorded audio can be longer; measure it using the Studio CLI.
  estimated += (w/135)*60 + 1.4;
  if (s.durationSec !== undefined) warn(`Scene ${n}: manually forced duration; check against actual audio.`);
  if (s.narrationFile && !fs.existsSync(path.resolve(path.dirname(PROJECT), s.narrationFile))) {
    warn(`Scene ${n}: narrationFile points to a missing file (${s.narrationFile}).`);
  }
}
if (estimated > 60) warn(`Estimate ${estimated.toFixed(1)}s exceeds 60s; edit narration to stay concise.`);
if (raw.subtitles !== true) warn('Burned-in captions are OFF. Normally useful for Shorts, but optional.');
if (raw.scenes?.at(-1)?.template !== 'end-card') fail('Closing scene must use the end-card CTA.');
console.log(`Royal Cache Short Pilot QA | ${slug}`);
console.log(`Scenes: ${raw.scenes?.length??0} | words: ${words} | estimated without audio: ${estimated.toFixed(1)}s | ${raw.format}`);
console.log('Full documentary:', `https://www.youtube.com/watch?v=${expectedVideo}`);
console.log('NOTE: Final timing depends on the recorded MP3 files; use the Studio validate command after narration.');
for (const s of warnings) console.log('WARN:', s);
for (const s of errors) console.error('ERROR:', s);
if (errors.length) process.exit(1);
console.log(`PASS: ${warnings.length} warning(s), no QA errors.`);
