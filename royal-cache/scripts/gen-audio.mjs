// Original, fully synthesised score + foley (deterministic, seeded).
// Writes public/audio/music.wav, public/audio/foley.wav, audio/foley-cues.json
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SR = 44100, DUR = 180, N = SR * DUR;
const rng = (seed) => { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
const mtof = (m) => 440 * 2 ** ((m - 69) / 12);
const TAU = Math.PI * 2;

const writeWav = (file, L, R, gain = 1) => {
  let peak = 0; for (let i = 0; i < N; i++) peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
  const g = (peak > 0 ? Math.min(gain, 0.97 / peak) : 1);
  const buf = Buffer.alloc(44 + N * 4);
  buf.write("RIFF", 0); buf.writeUInt32LE(36 + N * 4, 4); buf.write("WAVEfmt ", 8); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22);
  buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34); buf.write("data", 36); buf.writeUInt32LE(N * 4, 40);
  for (let i = 0; i < N; i++) { buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, L[i] * g)) * 32767), 44 + i * 4); buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, R[i] * g)) * 32767), 46 + i * 4); }
  fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, buf);
  console.log("wrote", path.relative(root, file), "peak", peak.toFixed(3));
};

// Schroeder-style reverb on a stereo pair (in place, returns wet buffers)
const reverb = (L, R, mixWet = 0.3, seed = 5) => {
  const wetL = new Float32Array(N), wetR = new Float32Array(N);
  const combs = [1557, 1617, 1491, 1422, 1277, 1356].map((d) => d * 1.9 | 0);
  for (const [src, dst, off] of [[L, wetL, 0], [R, wetR, 23]]) {
    for (const d0 of combs) { const d = d0 + off; const b = new Float32Array(d); let p = 0, lp = 0; for (let i = 0; i < N; i++) { const y = b[p]; lp = y * 0.72 + lp * 0.28; b[p] = src[i] + lp * 0.86; dst[i] += y / combs.length; if (++p >= d) p = 0; } }
    for (const d of [225 + off, 556 + off]) { const b = new Float32Array(d); let p = 0; for (let i = 0; i < N; i++) { const x = dst[i], y = b[p]; b[p] = x + y * 0.5; dst[i] = y - x * 0.5; if (++p >= d) p = 0; } }
  }
  for (let i = 0; i < N; i++) { L[i] += wetL[i] * mixWet; R[i] += wetR[i] * mixWet; }
};

// ======================= MUSIC ==========================================
{
  const L = new Float32Array(N), R = new Float32Array(N);
  const r = rng(1881);
  // D "hijaz" colour: D Eb F# G A Bb C
  const scale = [0, 1, 4, 5, 7, 8, 10];
  const chords = { i: [38, 45, 50, 54, 57], II: [39, 46, 51, 55, 58], iv: [43, 50, 55, 58, 62], vii: [36, 43, 48, 55, 58], I: [38, 45, 50, 54, 62] };
  const prog = ["i", "i", "iv", "i", "II", "i", "iv", "vii", "i", "II", "i", "iv", "i", "vii", "iv", "II", "iv", "I"];
  // pads: one swell per scene, overlapping
  prog.forEach((name, s) => {
    const t0 = s * 10 - 1.2, len = 13.2;
    chords[name].forEach((m, k) => {
      const f = mtof(m), amp = (k === 0 ? 0.11 : 0.05) * (s === 17 ? 1.15 : 1), pan = 0.5 + (k - 2) * 0.16;
      const det = [1, 1.0031, 0.9972], ph = det.map(() => r() * TAU), lfo = 0.07 + r() * 0.09, lph = r() * TAU;
      const a = Math.max(0, t0 * SR | 0), b = Math.min(N, (t0 + len) * SR | 0);
      for (let i = a; i < b; i++) {
        const t = i / SR - t0; const env = Math.min(1, t / 3.2) * Math.min(1, (len - t) / 3.6); const e = env * env * (3 - 2 * env);
        let v = 0; for (let d = 0; d < 3; d++) { const p = TAU * f * det[d] * t + ph[d]; v += Math.sin(p) + 0.22 * Math.sin(2 * p) + 0.08 * Math.sin(3 * p); }
        v *= amp / 3 * e * (0.8 + 0.2 * Math.sin(TAU * lfo * t + lph));
        L[i] += v * (1 - pan); R[i] += v * pan;
      }
    });
  });
  // plucked string (Karplus–Strong), sparse modal phrases
  const pluck = (t0, midi, vel, pan) => {
    const f = mtof(midi), d = Math.round(SR / f), b = new Float32Array(d); let lpn = 0;
    for (let i = 0; i < d; i++) { lpn = lpn * 0.55 + (r() * 2 - 1) * 0.45; b[i] = lpn; }
    const a = t0 * SR | 0, len = Math.min(N - a, SR * 3.2 | 0); let p = 0, prev = 0;
    for (let i = 0; i < len; i++) { const y = b[p]; const nv = (y + prev) * 0.4975; prev = y; b[p] = nv; if (++p >= d) p = 0; const v = y * vel * Math.min(1, i / 60); L[a + i] += v * (1 - pan); R[a + i] += v * pan; }
  };
  let deg = 7, t = 2.4;
  while (t < 174) {
    const s = Math.floor(t / 10); const dense = [5, 6, 10, 16].includes(s) ? 0.8 : 1;
    const step = [-2, -1, -1, 1, 1, 2, 0, 3, -3][r() * 9 | 0]; deg = Math.max(3, Math.min(14, deg + step));
    const midi = 50 + 12 * Math.floor(deg / 7) + scale[deg % 7];
    pluck(t, midi, 0.16 + r() * 0.1, 0.3 + r() * 0.4);
    if (r() < 0.22) pluck(t + 0.16, midi + (r() < 0.5 ? 7 : 12), 0.08, 0.6);
    t += (r() < 0.3 ? 0.62 : 1.5 + r() * 1.9) * dense;
    if (t % 10 > 8.6) t = Math.ceil(t / 10) * 10 + 1.4 + r(); // breathe across cuts
  }
  // soft frame drum: one "doum" on each cut, slow pulse under the two processions
  const doum = (t0, amp) => { const a = t0 * SR | 0; for (let i = 0; i < SR * 0.9 && a + i < N; i++) { const tt = i / SR; const v = Math.sin(TAU * (48 * tt + 14 * (1 - Math.exp(-tt * 18)) / 18)) * Math.exp(-tt * 5.5) * amp * Math.min(1, i / 90); L[a + i] += v; R[a + i] += v; } };
  for (let s = 1; s < 18; s++) doum(s * 10 + 0.02, 0.22);
  for (const s of [5, 16]) for (let k = 1; k < 8; k++) doum(s * 10 + k * 1.25, 0.12);
  reverb(L, R, 0.42, 3);
  for (let i = 0; i < N; i++) { const tt = i / SR; const g = Math.min(1, tt / 1.6) * Math.min(1, Math.max(0, (179.7 - tt) / 3.2)); L[i] *= g; R[i] *= g; }
  writeWav(path.join(root, "public/audio/music.wav"), L, R, 1.6);
}

// ======================= FOLEY ==========================================
{
  const L = new Float32Array(N), R = new Float32Array(N);
  const r = rng(320);
  const cues = [];
  const cue = (t, name, note) => cues.push({ t: +t.toFixed(2), name, note });
  // filtered-noise bed (wind / room tone)
  const bed = (t0, t1, gain, lo, hi, name) => {
    cue(t0, name, `${(t1 - t0).toFixed(1)} s bed`);
    const a = t0 * SR | 0, b = Math.min(N, t1 * SR | 0); let y1 = 0, y2 = 0, z = 0; const ph = r() * 10, ph2 = r() * 10;
    for (let i = a; i < b; i++) {
      const t = i / SR; const sw = 0.5 + 0.5 * Math.sin(t * 0.55 + ph) * Math.sin(t * 0.23 + ph2); const fc = lo + (hi - lo) * sw; const k = 1 - Math.exp(-TAU * fc / SR);
      const n = r() * 2 - 1; y1 += (n - y1) * k; y2 += (y1 - y2) * k; z += (y2 - z) * 0.002; const v = (y2 - z);
      const env = Math.min(1, (t - t0) / 1.2) * Math.min(1, (t1 - t) / 1.2) * (0.55 + 0.45 * sw) * gain * 3.2; const pan = 0.5 + 0.25 * Math.sin(t * 0.31 + ph);
      L[i] += v * env * (1 - pan); R[i] += v * env * pan;
    }
  };
  // short noise hit with one-pole lowpass + optional low sine body
  const hit = (t0, { gain = 0.3, fc = 900, dur = 0.09, body = 0, pan = 0.5 }) => {
    const a = t0 * SR | 0, len = dur * SR | 0, k = 1 - Math.exp(-TAU * fc / SR); let y = 0;
    for (let i = 0; i < len && a + i < N; i++) { const tt = i / SR; y += ((r() * 2 - 1) - y) * k; const env = Math.min(1, i / 40) * Math.exp(-tt * (5 / dur)); const v = (y * 2.2 + (body ? Math.sin(TAU * body * tt) * 0.9 : 0)) * env * gain; L[a + i] += v * (1 - pan); R[a + i] += v * pan; }
  };
  const steps = (t0, t1, every, name, opt = {}) => { cue(t0, name, `footsteps every ${every}s until ${t1}`); let k = 0; for (let t = t0; t < t1; t += every, k++) hit(t + (r() - 0.5) * 0.04, { gain: 0.16 + r() * 0.05, fc: 700, dur: 0.11, body: 70, pan: 0.4 + (k % 2) * 0.2, ...opt }); };
  const swish = (t0, name, gain = 0.1, dur = 0.55) => { cue(t0, name, "cloth / paper movement"); const a = t0 * SR | 0, len = dur * SR | 0; let y = 0, z = 0; for (let i = 0; i < len && a + i < N; i++) { const p = i / len; const n = r() * 2 - 1; y += (n - y) * 0.45; z += (y - z) * 0.08; const v = (y - z) * Math.sin(Math.PI * p) ** 2 * gain * 2; const pan = 0.3 + 0.4 * p; L[a + i] += v * (1 - pan); R[a + i] += v * pan; } };
  const creak = (t0, name, gain = 0.07, dur = 0.7) => { cue(t0, name, "rope strain"); const a = t0 * SR | 0, len = dur * SR | 0; let ph = 0; for (let i = 0; i < len && a + i < N; i++) { const p = i / len; const f = 190 + 70 * p + 12 * Math.sin(p * 40); ph += TAU * f / SR; const slip = 0.5 + 0.5 * Math.sign(Math.sin(TAU * 27 * (i / SR))); const v = (Math.sin(ph) + 0.5 * Math.sin(2 * ph) + 0.3 * Math.sin(3.01 * ph)) * slip * Math.sin(Math.PI * p) * gain; L[a + i] += v * 0.55; R[a + i] += v * 0.45; } };
  const crackle = (t0, t1, name, gain = 0.05) => { cue(t0, name, "torch / lantern flame"); for (let t = t0; t < t1; t += 0.05 + r() * 0.32) hit(t, { gain: gain * (0.4 + r()), fc: 3500, dur: 0.02 + r() * 0.03, pan: 0.4 + r() * 0.2 }); };
  const scrape = (t0, t1, name, gain = 0.06) => { cue(t0, name, "stone scrape"); for (let t = t0; t < t1; t += 0.012 + r() * 0.05) hit(t, { gain: gain * r(), fc: 1500 + r() * 1500, dur: 0.03, pan: 0.45 + r() * 0.1 }); };
  const thud = (t0, name, gain = 0.3) => { cue(t0, name, "stone / impact"); hit(t0, { gain, fc: 420, dur: 0.28, body: 62 }); };

  // 01 exterior, wind
  bed(0, 10.6, 0.11, 250, 900, "wind – open desert");
  // 02 tomb interior: room tone, crawling fracture, amulets
  bed(9.6, 20.4, 0.09, 80, 220, "tomb room tone"); scrape(12.0, 15.4, "fracture crawls across stone", 0.07); thud(15.5, "stone settles", 0.18);
  // 03 courtyard: light air, papyrus
  bed(19.6, 30.4, 0.05, 300, 1100, "courtyard air, palm fronds"); swish(24.0, "papyrus extended", 0.07, 0.7);
  // 04 linen wrapping
  bed(29.6, 40.4, 0.05, 90, 260, "workshop room tone"); [31.2, 32.7, 34.2, 35.7, 37.2].forEach((t, k) => swish(t, `linen band ${k + 1}`, 0.085, 0.7));
  // 05 labels
  bed(39.6, 50.4, 0.04, 90, 260, "room tone"); [41.3, 42.5].forEach((t) => { swish(t, "label slides into place", 0.06, 0.35); hit(t + 0.35, { gain: 0.1, fc: 1800, dur: 0.05 }); });
  // 06 procession
  bed(49.6, 60.4, 0.07, 250, 800, "desert air"); steps(50.3, 59.6, 0.62, "bearers on sand");
  // 07 landscape
  bed(59.6, 70.4, 0.1, 220, 1000, "high wind over the Nile valley");
  // 08 shaft / passages
  bed(69.6, 80.4, 0.08, 70, 200, "rock interior tone"); crackle(71, 80, "torch"); steps(73.6, 79.2, 0.58, "sandals on rock", { fc: 1400, body: 0, gain: 0.07 });
  // 09 chamber
  bed(79.6, 90.4, 0.09, 70, 190, "chamber tone");
  // 10 sealing
  bed(89.6, 100.4, 0.16, 300, 1300, "sand-laden wind"); [91.2, 92.0, 92.9, 93.5, 94.4].forEach((t, k) => thud(t, `fallen stone ${k + 1}`, 0.2 + (k % 2) * 0.06));
  // 11 village
  bed(99.6, 110.4, 0.07, 250, 900, "village air"); steps(100.4, 109.4, 0.58, "path footsteps and goats", { gain: 0.1 });
  // 12 goat legend
  bed(109.6, 120.4, 0.08, 250, 900, "foothill wind"); steps(110.4, 113.2, 0.3, "goat hooves", { gain: 0.07, fc: 2000, body: 0 }); hit(114.6, { gain: 0.12, fc: 900, dur: 0.3 }); cue(114.6, "goat slips from sight", "soft scuff, no impact");
  steps(115.0, 117.0, 0.7, "owner approaches", { gain: 0.1 }); creak(117.4, "rope uncoils", 0.05, 0.9); creak(118.6, "rope uncoils", 0.04, 0.8);
  // 13 chamber of kings
  bed(119.6, 130.4, 0.1, 70, 200, "passage tone"); crackle(120.2, 130, "torch", 0.06); steps(121.0, 126.4, 0.75, "cautious steps", { fc: 1300, body: 0, gain: 0.06 });
  // 14 market
  bed(129.6, 140.4, 0.05, 300, 1200, "market air"); swish(133.6, "artifact becomes record card", 0.07, 0.5); swish(136.4, "paper trail", 0.05, 0.6);
  // 15 1881
  bed(139.6, 150.4, 0.09, 250, 900, "cliff wind"); thud(140.6, "date stamp", 0.26); steps(141.2, 146.6, 0.56, "team arrives");
  // 16 removal
  bed(149.6, 160.4, 0.07, 120, 500, "shaft air"); [150.8, 152.3, 153.8, 155.3, 156.8].forEach((t, k) => { creak(t, `rope heave ${k + 1}`, 0.075, 0.8); scrape(t + 0.1, t + 0.6, "coffin against shaft wall", 0.03); });
  swish(157.4, "inventory sheets", 0.05, 0.6);
  // 17 parade
  bed(159.6, 170.4, 0.05, 200, 700, "city night air");
  // 18 return
  bed(169.6, 180, 0.11, 250, 950, "wind – Deir el-Bahari");

  reverb(L, R, 0.22, 9);
  for (let i = 0; i < N; i++) { const tt = i / SR; const g = Math.min(1, tt / 0.8) * Math.min(1, Math.max(0, (179.8 - tt) / 2.4)); L[i] *= g; R[i] *= g; }
  writeWav(path.join(root, "public/audio/foley.wav"), L, R, 1.0);
  cues.sort((a, b) => a.t - b.t);
  fs.writeFileSync(path.join(root, "audio/foley-cues.json"), JSON.stringify(cues, null, 1));
}
