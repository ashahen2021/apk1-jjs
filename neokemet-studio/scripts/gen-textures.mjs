// Procedural print textures (deterministic, seeded). Writes:
//   public/textures/grain.png    – paper fibre / grain, used with multiply
//   public/textures/distress.png – ivory dry-brush streaks that "wear" the ink
//   public/textures/speckle.png  – sparse dark ink speckle / mis-registration dust
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const out = path.join(root, "engine/public/textures");
fs.mkdirSync(out, { recursive: true });
const W = 1080, H = 1920;

const rng = (seed) => { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
const hash2 = (x, y, s) => { let h = (Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(s, 2147483647)) >>> 0; h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
const vnoise = (x, y, s) => { const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi; const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy); const a = hash2(xi, yi, s), b = hash2(xi + 1, yi, s), c = hash2(xi, yi + 1, s), d = hash2(xi + 1, yi + 1, s); return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v; };
const fbm = (x, y, s) => vnoise(x, y, s) * 0.55 + vnoise(x * 2.1, y * 2.1, s + 1) * 0.3 + vnoise(x * 4.3, y * 4.3, s + 2) * 0.15;

const crcTable = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
const crc32 = (buf) => { let c = 0xffffffff; for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
const chunk = (type, data) => { const len = Buffer.alloc(4); len.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(type), data]); const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td)); return Buffer.concat([len, td, crc]); };
const writePng = (file, rgba) => {
  const raw = Buffer.alloc((W * 4 + 1) * H);
  for (let y = 0; y < H; y++) { raw[y * (W * 4 + 1)] = 0; rgba.copy(raw, y * (W * 4 + 1) + 1, y * W * 4, (y + 1) * W * 4); }
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4); ihdr[8] = 8; ihdr[9] = 6;
  fs.writeFileSync(file, Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", ihdr), chunk("IDAT", zlib.deflateSync(raw, { level: 9 })), chunk("IEND", Buffer.alloc(0))]));
  console.log("wrote", path.relative(root, file));
};

// ---- grain (multiply) -------------------------------------------------
{
  const px = Buffer.alloc(W * H * 4);
  const fib = new Float32Array(W * H);
  const r = rng(11);
  for (let i = 0; i < 2600; i++) { // paper fibres
    let x = r() * W, y = r() * H; const ang = (r() - 0.5) * 1.2 + (r() < 0.5 ? 0 : Math.PI / 2) * (r() < 0.2 ? 1 : 0); const len = 8 + r() * 46, k = 0.03 + r() * 0.07;
    for (let s = 0; s < len; s++) { const xi = ((x | 0) + W) % W, yi = ((y | 0) + H) % H; fib[yi * W + xi] += k; x += Math.cos(ang + Math.sin(s * 0.2) * 0.3); y += Math.sin(ang + Math.sin(s * 0.2) * 0.3); }
  }
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = (y * W + x) * 4;
    const fine = (hash2(x, y, 3) - 0.5) * 0.07;
    const blot = (fbm(x / 260, y / 260, 5) - 0.5) * 0.09;
    const laid = Math.sin(y * 0.9 + fbm(x / 90, y / 90, 9) * 4) * 0.008; // faint laid lines
    const ex = Math.min(x, W - x) / W, ey = Math.min(y, H - y) / H;
    const edge = Math.max(0, 1 - Math.min(ex * 9, ey * 14)) ** 2 * 0.10 * (0.6 + fbm(x / 60, y / 60, 21));
    const d = Math.max(0, Math.min(0.5, -fine - blot + laid + fib[y * W + x] + edge + 0.02));
    px[i] = 255 * (1 - d * 0.75); px[i + 1] = 255 * (1 - d * 0.95); px[i + 2] = 255 * (1 - d * 1.35); px[i + 3] = 255;
  }
  writePng(path.join(out, "grain.png"), px);
}

// ---- distress (ivory streaks over ink) --------------------------------
{
  const a = new Float32Array(W * H);
  const r = rng(77);
  const stamp = (x, y, v) => { const xi = ((x | 0) % W + W) % W, yi = ((y | 0) % H + H) % H; a[yi * W + xi] = Math.max(a[yi * W + xi], v); };
  for (let i = 0; i < 15000; i++) { // horizontal dry-brush streaks, clustered
    const x = r() * W, y = r() * H; const m = fbm(x / 170, y / 110, 31);
    if (r() > (m - 0.28) * 2.4) continue;
    const len = 5 + r() * r() * 90, th = r() < 0.75 ? 1 : 2 + (r() * 2 | 0), v = 0.45 + r() * 0.5;
    for (let s = 0; s < len; s++) { if (r() < 0.12) continue; for (let t = 0; t < th; t++) stamp(x + s, y + t + Math.sin(s * 0.11) * 0.8, v * (0.7 + r() * 0.3)); }
  }
  for (let i = 0; i < 26000; i++) { // stipple pin-holes
    const x = r() * W, y = r() * H; if (r() > fbm(x / 120, y / 120, 41) * 1.5) continue;
    const v = 0.35 + r() * 0.6; stamp(x, y, v); if (r() < 0.3) stamp(x + 1, y, v * 0.8); if (r() < 0.15) stamp(x, y + 1, v * 0.8);
  }
  const px = Buffer.alloc(W * H * 4);
  for (let i = 0; i < W * H; i++) { px[i * 4] = 0xf8; px[i * 4 + 1] = 0xeb; px[i * 4 + 2] = 0xd2; px[i * 4 + 3] = Math.round(a[i] * 255); }
  writePng(path.join(out, "distress.png"), px);
}

// ---- speckle (dark ink dust) ------------------------------------------
{
  const px = Buffer.alloc(W * H * 4);
  const r = rng(303);
  const put = (x, y, v) => { const xi = ((x | 0) % W + W) % W, yi = ((y | 0) % H + H) % H, i = (yi * W + xi) * 4; px[i] = 0x2d; px[i + 1] = 0x48; px[i + 2] = 0x45; px[i + 3] = Math.max(px[i + 3], v); };
  for (let i = 0; i < 5200; i++) { const x = r() * W, y = r() * H, v = 40 + r() * 120; put(x, y, v); if (r() < 0.35) put(x + 1, y, v * 0.8); if (r() < 0.2) { put(x, y + 1, v); put(x + 1, y + 1, v * 0.7); } }
  for (let i = 0; i < 420; i++) { const x = r() * W, y = r() * H, len = 3 + r() * 16; for (let s = 0; s < len; s++) put(x + s, y, 30 + r() * 60); }
  writePng(path.join(out, "speckle.png"), px);
}
