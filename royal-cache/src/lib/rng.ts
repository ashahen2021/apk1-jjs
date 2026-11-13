// Deterministic pseudo-randomness. Nothing here (or anywhere in the film)
// calls Math.random(): every frame renders identically on every machine.

export const mulberry32 = (seed: number) => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

/** Stateless hash → [0,1). */
export const hash = (n: number, seed = 0): number => {
  let h = (Math.imul(n | 0, 374761393) + Math.imul(seed | 0, 668265263)) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};

/** Smooth 1-D value noise in [-1,1]. */
export const noise1 = (x: number, seed = 0): number => {
  const i = Math.floor(x);
  const f = x - i;
  const u = f * f * (3 - 2 * f);
  const a = hash(i, seed) * 2 - 1;
  const b = hash(i + 1, seed) * 2 - 1;
  return a + (b - a) * u;
};

export type Pt = [number, number];

/**
 * Turn a clean polygon into a rough "relief-print" outline: edges are
 * subdivided and nudged along their normals with seeded jitter.
 */
export const roughPath = (
  pts: Pt[],
  seed = 1,
  amp = 2.4,
  step = 16,
  closed = true,
): string => {
  const rnd = mulberry32(seed * 7919 + 13);
  const out: Pt[] = [];
  const n = pts.length;
  const edges = closed ? n : n - 1;
  for (let i = 0; i < edges; i++) {
    const [x1, y1] = pts[i];
    const [x2, y2] = pts[(i + 1) % n];
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    const segs = Math.max(1, Math.round(len / step));
    for (let s = 0; s < segs; s++) {
      const t = s / segs;
      const j = (rnd() - 0.5) * 2 * amp * (s === 0 ? 0.45 : 1);
      out.push([x1 + dx * t + nx * j, y1 + dy * t + ny * j]);
    }
  }
  if (!closed) out.push(pts[n - 1]);
  return (
    out
      .map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`)
      .join("") + (closed ? "Z" : "")
  );
};

export const rectPts = (x: number, y: number, w: number, h: number): Pt[] => [
  [x, y],
  [x + w, y],
  [x + w, y + h],
  [x, y + h],
];

export const ellipsePts = (
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  n = 22,
): Pt[] =>
  Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    return [cx + Math.cos(a) * rx, cy + Math.sin(a) * ry] as Pt;
  });
