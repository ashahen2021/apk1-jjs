import type { CollectionEntry } from 'astro:content';

/**
 * Helpers for architectural plans (src/data/plans). The 3D models are built by
 * scripts/render/tombs.js with the same axis mapping and scale:
 * model X = plan x, model Y = floor depth, model Z = plan y, all × MODEL_SCALE.
 */
export const MODEL_SCALE = 0.02;

export type Plan = CollectionEntry<'plans'>['data'];
export type Space = Plan['spaces'][number];
export type Wall = 'n' | 'e' | 's' | 'w';

export const STATUS_LABEL: Record<Space['status'], string> = {
  documented: 'Documented',
  approximate: 'Approximate',
  uncertain: 'Uncertain',
};

export const STATUS_HELP: Record<Space['status'], string> = {
  documented: 'The space and its dimensions follow published surveys.',
  approximate: 'The space is documented; its size or depth in the model is approximate.',
  uncertain: 'Partly explored or disputed; shown to indicate, not to measure.',
};

export const KIND_LABEL: Record<Space['kind'], string> = {
  stairs: 'Stairway',
  corridor: 'Corridor',
  chamber: 'Chamber',
  hall: 'Pillared hall',
  well: 'Well chamber',
  annex: 'Side room',
  crypt: 'Crypt',
  tunnel: 'Tunnel',
};

export function floorAt(s: Space, x: number, y: number): number {
  const [f0, f1] = s.floor;
  if (!s.descends || f0 === f1) return f0;
  const [x0, x1] = s.x;
  const [y0, y1] = s.y;
  const t = {
    'x+': (x - x0) / (x1 - x0),
    'x-': (x1 - x) / (x1 - x0),
    'y+': (y - y0) / (y1 - y0),
    'y-': (y1 - y) / (y1 - y0),
  }[s.descends];
  return f0 + (f1 - f0) * Math.min(1, Math.max(0, t));
}

export const center = (s: Space): [number, number] => [(s.x[0] + s.x[1]) / 2, (s.y[0] + s.y[1]) / 2];
export const size = (s: Space) => ({ w: s.x[1] - s.x[0], d: s.y[1] - s.y[0] });

const fmt = (n: number) => (Math.round(n * 10) / 10).toString();
const m = (n: number) => (n * MODEL_SCALE).toFixed(3);

/** "about 7.9 × 3.6 m, 2.7 m high" — "about" unless documented. */
export function dimensions(s: Space): string {
  const { w, d } = size(s);
  const [long, short] = w > d ? [w, d] : [d, w];
  const c = s.status === 'documented' ? '' : 'about ';
  return `${c}${fmt(long)} × ${fmt(short)} m, ${fmt(s.height)} m high`;
}

export function depthText(s: Space): string {
  const [a, b] = s.floor.map((f) => Math.round(-f));
  const lead = s.status === 'documented' ? 'about' : 'roughly';
  if (a === b) return a === 0 ? 'At ground level' : `Floor ${lead} ${a} m below the entrance`;
  return `Descends from ${a} to ${b} m below the entrance (${lead})`;
}

const pos = (x: number, y: number, z: number) => `${m(x)}m ${m(y)}m ${m(z)}m`;

/** Hotspot position in model space for a space: its centre, just above the floor. */
export function hotspot(s: Space): string {
  const [cx, cy] = center(s);
  return pos(cx, floorAt(s, cx, cy) + Math.min(1.4, s.height * 0.4), cy);
}

/** Hotspot on the inside face of a wall, at mid height of the cut-away wall. */
export function wallHotspot(s: Space, wall: Wall): { position: string; normal: string } {
  const [cx, cy] = center(s);
  const inset = 0.2;
  const [x, y, normal] = {
    n: [cx, s.y[0] + inset, '0 0 1'],
    s: [cx, s.y[1] - inset, '0 0 -1'],
    w: [s.x[0] + inset, cy, '1 0 0'],
    e: [s.x[1] - inset, cy, '-1 0 0'],
  }[wall] as [number, number, string];
  return { position: pos(x, floorAt(s, x, y) + s.height * 0.3, y), normal };
}

/** Camera target and orbit that frame one space in <model-viewer>. */
export function orbit(s: Space, plan: Plan): { target: string; orbit: string } {
  const [cx, cy] = center(s);
  const { w, d } = size(s);
  const radius = Math.max(w, d, 5) * 2.4 * MODEL_SCALE;
  return {
    target: pos(cx, floorAt(s, cx, cy) + s.height * 0.3, cy),
    orbit: `${plan.camera.theta}deg ${Math.min(plan.camera.phi, 60)}deg ${radius.toFixed(3)}m`,
  };
}

export function bounds(plan: Plan) {
  const xs = plan.spaces.flatMap((s) => s.x);
  const ys = plan.spaces.flatMap((s) => s.y);
  const fs = plan.spaces.flatMap((s) => [...s.floor, ...(s.pit ? [s.floor[0] - s.pit.depth] : [])]);
  return { x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys), deepest: Math.min(...fs) };
}
