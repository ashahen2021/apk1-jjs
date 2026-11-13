// Audio: WAV i/o, original synthesised score and foley, and the final mix.
// Everything is deterministic (seeded) and generated locally — no samples.
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import type { Project } from "../shared/schema.ts";
import { VO_LEAD } from "../shared/timing.ts";
import { ffmpeg } from "./ff.ts";
import { CACHE_DIR, ensureDir } from "./paths.ts";
import type { Timeline } from "./timeline.ts";

export const SR = 44100;
const TAU = Math.PI * 2;
const rng = (seed: number) => { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
const mtof = (m: number) => 440 * 2 ** ((m - 69) / 12);

export type Pcm = { sr: number; ch: Float32Array[] };

/** Minimal RIFF/WAVE reader (PCM 16-bit, as written by Piper and by this file). */
export const readWav = (file: string): Pcm => {
  const b = fs.readFileSync(file);
  if (b.toString("ascii", 0, 4) !== "RIFF" || b.toString("ascii", 8, 12) !== "WAVE") throw new Error(`Not a WAV file: ${file}`);
  let off = 12, sr = SR, nch = 1, bits = 16, fmt = 1;
  while (off + 8 <= b.length) {
    const id = b.toString("ascii", off, off + 4);
    const size = b.readUInt32LE(off + 4);
    if (id === "fmt ") { fmt = b.readUInt16LE(off + 8); nch = b.readUInt16LE(off + 10); sr = b.readUInt32LE(off + 12); bits = b.readUInt16LE(off + 22); }
    if (id === "data") {
      if (fmt !== 1 || bits !== 16) throw new Error(`Unsupported WAV encoding in ${file} (need 16-bit PCM)`);
      const end = Math.min(b.length, off + 8 + (size === 0xffffffff || size === 0 ? b.length : size));
      const n = Math.floor((end - off - 8) / (2 * nch));
      const ch = Array.from({ length: nch }, () => new Float32Array(n));
      for (let i = 0; i < n; i++) for (let c = 0; c < nch; c++) ch[c][i] = b.readInt16LE(off + 8 + (i * nch + c) * 2) / 32768;
      return { sr, ch };
    }
    off += 8 + size + (size % 2);
  }
  throw new Error(`No audio data in ${file}`);
};

export const writeWav = (file: string, L: Float32Array, R: Float32Array, sr = SR) => {
  const n = L.length;
  const buf = Buffer.alloc(44 + n * 4);
  buf.write("RIFF", 0); buf.writeUInt32LE(36 + n * 4, 4); buf.write("WAVEfmt ", 8); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22);
  buf.writeUInt32LE(sr, 24); buf.writeUInt32LE(sr * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34); buf.write("data", 36); buf.writeUInt32LE(n * 4, 40);
  for (let i = 0; i < n; i++) {
    buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, L[i])) * 32767), 44 + i * 4);
    buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, R[i])) * 32767), 46 + i * 4);
  }
  ensureDir(path.dirname(file));
  fs.writeFileSync(file, buf);
};

/** Decode any audio file to 44.1 kHz PCM (cached by content hash). */
export const decodeAudio = async (file: string): Promise<Pcm> => {
  if (/\.wav$/i.test(file)) { try { return readWav(file); } catch { /* fall through to ffmpeg */ } }
  const st = fs.statSync(file);
  const key = crypto.createHash("sha1").update(`${file}|${st.size}|${st.mtimeMs}`).digest("hex").slice(0, 16);
  const out = path.join(ensureDir(path.join(CACHE_DIR, "audio")), `${key}.wav`);
  if (!fs.existsSync(out)) await ffmpeg(["-v", "error", "-i", file, "-ar", String(SR), "-ac", "2", "-c:a", "pcm_s16le", out]);
  return readWav(out);
};

export const audioSeconds = async (file: string) => { const p = await decodeAudio(file); return p.ch[0].length / p.sr; };

/** Leading / trailing silence trimmed, so cue timing follows the actual speech. */
export const speechSpan = (p: Pcm, thresh = 0.012) => {
  const d = p.ch[0];
  let a = 0, b = d.length - 1;
  while (a < d.length && Math.abs(d[a]) < thresh) a++;
  while (b > a && Math.abs(d[b]) < thresh) b--;
  return { start: a / p.sr, end: (b + 1) / p.sr };
};

const reverb = (L: Float32Array, R: Float32Array, wet: number) => {
  const n = L.length;
  const combs = [1557, 1617, 1491, 1422, 1277, 1356].map((d) => (d * 1.9) | 0);
  for (const [src, off] of [[L, 0], [R, 23]] as [Float32Array, number][]) {
    const out = new Float32Array(n);
    for (const d0 of combs) { const d = d0 + off; const b = new Float32Array(d); let p = 0, lp = 0; for (let i = 0; i < n; i++) { const y = b[p]; lp = y * 0.72 + lp * 0.28; b[p] = src[i] + lp * 0.86; out[i] += y / combs.length; if (++p >= d) p = 0; } }
    for (const d of [225 + off, 556 + off]) { const b = new Float32Array(d); let p = 0; for (let i = 0; i < n; i++) { const x = out[i], y = b[p]; b[p] = x + y * 0.5; out[i] = y - x * 0.5; if (++p >= d) p = 0; } }
    for (let i = 0; i < n; i++) src[i] += out[i] * wet;
  }
};

/** Original score: modal drone in D, sparse plucked phrases, a soft drum on each cut. */
export const synthMusic = (dur: number, cuts: number[], seed: number): [Float32Array, Float32Array] => {
  const N = Math.ceil(dur * SR);
  const L = new Float32Array(N), R = new Float32Array(N);
  const r = rng(seed);
  const scale = [0, 1, 4, 5, 7, 8, 10];
  const chords = [[38, 45, 50, 54, 57], [43, 50, 55, 58, 62], [39, 46, 51, 55, 58], [36, 43, 48, 55, 58]];
  const bounds = [0, ...cuts.filter((c) => c > 0 && c < dur), dur];
  for (let s = 0; s < bounds.length - 1; s++) {
    const last = s === bounds.length - 2;
    const chord = last ? [38, 45, 50, 54, 62] : s === 0 ? chords[0] : chords[(s * 5 + (seed % 3)) % 4];
    const t0 = bounds[s] - 1.2, len = bounds[s + 1] - bounds[s] + 3.2;
    chord.forEach((m, k) => {
      const f = mtof(m), amp = k === 0 ? 0.11 : 0.05, pan = 0.5 + (k - 2) * 0.16;
      const det = [1, 1.0031, 0.9972], ph = det.map(() => r() * TAU), lfo = 0.07 + r() * 0.09, lph = r() * TAU;
      const a = Math.max(0, (t0 * SR) | 0), b = Math.min(N, ((t0 + len) * SR) | 0);
      for (let i = a; i < b; i++) {
        const t = i / SR - t0; const env = Math.min(1, t / 3.2) * Math.min(1, (len - t) / 3.6); const e = env * env * (3 - 2 * env);
        let v = 0; for (let d = 0; d < 3; d++) { const p = TAU * f * det[d] * t + ph[d]; v += Math.sin(p) + 0.22 * Math.sin(2 * p) + 0.08 * Math.sin(3 * p); }
        v *= (amp / 3) * e * (0.8 + 0.2 * Math.sin(TAU * lfo * t + lph));
        L[i] += v * (1 - pan); R[i] += v * pan;
      }
    });
  }
  const pluck = (t0: number, midi: number, vel: number, pan: number) => {
    const f = mtof(midi), d = Math.round(SR / f), b = new Float32Array(d); let lpn = 0;
    for (let i = 0; i < d; i++) { lpn = lpn * 0.55 + (r() * 2 - 1) * 0.45; b[i] = lpn; }
    const a = (t0 * SR) | 0, len = Math.min(N - a, (SR * 3.2) | 0); let p = 0, prev = 0;
    for (let i = 0; i < len; i++) { const y = b[p]; b[p] = (y + prev) * 0.4975; prev = y; if (++p >= d) p = 0; const v = y * vel * Math.min(1, i / 60); L[a + i] += v * (1 - pan); R[a + i] += v * pan; }
  };
  let deg = 7, t = 2.2;
  while (t < dur - 5) {
    deg = Math.max(3, Math.min(14, deg + [-2, -1, -1, 1, 1, 2, 0, 3, -3][(r() * 9) | 0]));
    const midi = 50 + 12 * Math.floor(deg / 7) + scale[deg % 7];
    pluck(t, midi, 0.16 + r() * 0.1, 0.3 + r() * 0.4);
    if (r() < 0.22) pluck(t + 0.16, midi + (r() < 0.5 ? 7 : 12), 0.08, 0.6);
    t += r() < 0.3 ? 0.62 : 1.5 + r() * 1.9;
  }
  for (const c of cuts) {
    const a = ((c + 0.02) * SR) | 0;
    for (let i = 0; i < SR * 0.9 && a + i < N; i++) { const tt = i / SR; const v = Math.sin(TAU * (48 * tt + (14 * (1 - Math.exp(-tt * 18))) / 18)) * Math.exp(-tt * 5.5) * 0.2 * Math.min(1, i / 90); L[a + i] += v; R[a + i] += v; }
  }
  reverb(L, R, 0.42);
  for (let i = 0; i < N; i++) { const tt = i / SR; const g = Math.min(1, tt / 1.6) * Math.min(1, Math.max(0, (dur - 0.2 - tt) / 3)) * 1.6; L[i] *= g; R[i] *= g; }
  return [L, R];
};

const INTERIOR = new Set(["tomb-robbery", "priests-rewrapping", "tomb-interior", "cutaway", "coffin-chamber", "artifact", "map", "rc-02", "rc-04", "rc-05", "rc-08", "rc-09", "rc-13"]);
const WALKING = new Set(["procession", "rc-06", "rc-11", "rc-15"]);

/** Original foley: wind or room tone per scene, footsteps under walking scenes. */
export const synthFoley = (tl: Timeline, fps: number, seed: number): [Float32Array, Float32Array] => {
  const dur = tl.totalFrames / fps;
  const N = Math.ceil(dur * SR);
  const L = new Float32Array(N), R = new Float32Array(N);
  const r = rng(seed + 320);
  const bed = (t0: number, t1: number, gain: number, lo: number, hi: number) => {
    const a = (t0 * SR) | 0, b = Math.min(N, (t1 * SR) | 0); let y1 = 0, y2 = 0, z = 0; const ph = r() * 10, ph2 = r() * 10;
    for (let i = a; i < b; i++) {
      const t = i / SR; const sw = 0.5 + 0.5 * Math.sin(t * 0.55 + ph) * Math.sin(t * 0.23 + ph2); const k = 1 - Math.exp((-TAU * (lo + (hi - lo) * sw)) / SR);
      y1 += (r() * 2 - 1 - y1) * k; y2 += (y1 - y2) * k; z += (y2 - z) * 0.002;
      const env = Math.min(1, (t - t0) / 1.0) * Math.min(1, (t1 - t) / 1.0) * (0.55 + 0.45 * sw) * gain * 3.2; const pan = 0.5 + 0.25 * Math.sin(t * 0.31 + ph);
      L[i] += (y2 - z) * env * (1 - pan); R[i] += (y2 - z) * env * pan;
    }
  };
  const step = (t0: number, gain: number, pan: number) => {
    const a = (t0 * SR) | 0, len = (0.11 * SR) | 0, k = 1 - Math.exp((-TAU * 700) / SR); let y = 0;
    for (let i = 0; i < len && a + i < N; i++) { const tt = i / SR; y += (r() * 2 - 1 - y) * k; const v = (y * 2.2 + Math.sin(TAU * 70 * tt) * 0.9) * Math.min(1, i / 40) * Math.exp(-tt * 45) * gain; L[a + i] += v * (1 - pan); R[a + i] += v * pan; }
  };
  for (const s of tl.scenes) {
    const t0 = s.startFrame / fps, t1 = (s.startFrame + s.durationInFrames) / fps;
    const mode = s.scene.ambience === "auto" ? (INTERIOR.has(s.scene.template) || s.scene.environment === "tomb-wall" || s.scene.params?.environment === "royal burial chamber" ? "interior" : "wind") : s.scene.ambience;
    if (mode === "wind") bed(t0 - 0.3, t1 + 0.3, 0.1, 250, 950);
    if (mode === "interior") bed(t0 - 0.3, t1 + 0.3, 0.09, 75, 210);
    const walks = WALKING.has(s.scene.template) || (s.scene.cast ?? []).some((c) => c.action === "walk");
    if (walks && mode !== "none") { let k = 0; for (let t = t0 + 0.4; t < t1 - 0.3; t += 0.6, k++) step(t + (r() - 0.5) * 0.04, 0.15 + r() * 0.05, 0.4 + (k % 2) * 0.2); }
  }
  reverb(L, R, 0.22);
  for (let i = 0; i < N; i++) { const tt = i / SR; const g = Math.min(1, tt / 0.8) * Math.min(1, Math.max(0, (dur - 0.1 - tt) / 2)); L[i] *= g; R[i] *= g; }
  return [L, R];
};

const FADE_OUT_SEC = 0.03;
/**
 * Mix `src` into `dst` starting at `atSec`. With `untilSec`, nothing is written
 * at or after that time and the last 30 ms before it fade out, so a clip can be
 * held inside its own scene without a click.
 */
const addInto = (dst: [Float32Array, Float32Array], src: Pcm, atSec: number, gain: number, untilSec?: number) => {
  const ratio = src.sr / SR;
  const a = Math.round(atSec * SR);
  const n = Math.floor(src.ch[0].length / ratio);
  const l = src.ch[0], rr = src.ch[1] ?? src.ch[0];
  const stop = untilSec === undefined ? dst[0].length : Math.min(dst[0].length, Math.round(untilSec * SR));
  const fade = Math.round(FADE_OUT_SEC * SR);
  for (let i = Math.max(0, -a); i < n && a + i < stop; i++) {
    const x = i * ratio, i0 = Math.floor(x), fr = x - i0, i1 = Math.min(l.length - 1, i0 + 1);
    const g = untilSec === undefined ? gain : gain * Math.min(1, (stop - (a + i)) / fade);
    dst[0][a + i] += (l[i0] + (l[i1] - l[i0]) * fr) * g;
    dst[1][a + i] += (rr[i0] + (rr[i1] - rr[i0]) * fr) * g;
  }
};

/** Narration + music + foley → one stereo WAV the length of the film. */
export const mixProject = async (project: Project, projectDir: string, tl: Timeline, outFile: string) => {
  const dur = tl.totalFrames / project.fps;
  const N = Math.ceil(dur * SR);
  const mix: [Float32Array, Float32Array] = [new Float32Array(N), new Float32Array(N)];
  let narrated = 0;
  const contained: number[] = []; // scene indexes whose voice had to be held inside the scene
  for (const s of tl.scenes) {
    if (!s.narrationPath) continue;
    const pcm = await decodeAudio(s.narrationPath);
    let peak = 0; for (const v of pcm.ch[0]) peak = Math.max(peak, Math.abs(v));
    const span = speechSpan(pcm);
    // align the first spoken sample with the cue start
    const at = s.startFrame / project.fps + VO_LEAD - span.start;
    const sceneEnd = (s.startFrame + s.durationInFrames) / project.fps;
    // resolveTimeline never produces a scene shorter than its voice, so this only
    // triggers for a hand-built timeline. Speech that fits is mixed exactly as before.
    const spills = at + span.end > sceneEnd + 1 / SR;
    addInto(mix, pcm, at, (peak > 0 ? 0.82 / peak : 1) * project.audio.narrationVolume, spills ? sceneEnd : undefined);
    if (spills) contained.push(s.index);
    narrated++;
  }
  const cuts = tl.scenes.slice(1).map((s) => s.startFrame / project.fps);
  if (project.audio.music === "generated") {
    const [l, r] = synthMusic(dur, cuts, project.audio.musicSeed);
    for (let i = 0; i < N; i++) { mix[0][i] += l[i] * project.audio.musicVolume; mix[1][i] += r[i] * project.audio.musicVolume; }
  } else if (project.audio.music === "file" && project.audio.musicFile) {
    const file = path.resolve(projectDir, project.audio.musicFile);
    if (!fs.existsSync(file)) throw new Error(`Music file not found: ${project.audio.musicFile}`);
    const pcm = await decodeAudio(file);
    const len = pcm.ch[0].length / pcm.sr;
    const bed: [Float32Array, Float32Array] = [new Float32Array(N), new Float32Array(N)];
    for (let t = 0; t < dur; t += len) addInto(bed, pcm, t, 1); // loop to length
    for (let i = 0; i < N; i++) { const tt = i / SR; const g = Math.min(1, tt / 1.2) * Math.min(1, Math.max(0, (dur - 0.2 - tt) / 3)) * project.audio.musicVolume * 0.6; mix[0][i] += bed[0][i] * g; mix[1][i] += bed[1][i] * g; }
  }
  if (project.audio.sfx) {
    const [l, r] = synthFoley(tl, project.fps, project.audio.musicSeed);
    for (let i = 0; i < N; i++) { mix[0][i] += l[i] * project.audio.sfxVolume; mix[1][i] += r[i] * project.audio.sfxVolume; }
  }
  let peak = 0; for (let i = 0; i < N; i++) peak = Math.max(peak, Math.abs(mix[0][i]), Math.abs(mix[1][i]));
  if (peak > 0.97) { const g = 0.97 / peak; for (let i = 0; i < N; i++) { mix[0][i] *= g; mix[1][i] *= g; } }
  writeWav(outFile, mix[0], mix[1]);
  return { narrated, peak, contained };
};
