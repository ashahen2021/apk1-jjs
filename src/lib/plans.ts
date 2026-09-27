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

/**
 * Evidence categories. The data keeps the short keys; readers see:
 * documented architecture · reconstructed geometry · uncertain / hypothetical.
 */
export const STATUS_LABEL: Record<Space['status'], string> = {
  documented: 'Documented',
  approximate: 'Reconstructed',
  uncertain: 'Uncertain',
};

export const STATUS_LONG: Record<Space['status'], string> = {
  documented: 'Documented architecture',
  approximate: 'Reconstructed geometry',
  uncertain: 'Uncertain or hypothetical',
};

export const STATUS_HELP: Record<Space['status'], string> = {
  documented: 'The space and its dimensions follow published surveys.',
  approximate: 'The space is documented, but its size, position or depth here is reconstructed from published plans.',
  uncertain: 'Partly explored, unsurveyed or disputed; shown to indicate, not to measure.',
};

export const CONDITION_LABEL = { damaged: 'Damaged', unfinished: 'Unfinished' } as const;

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

// ------------------------------------------------------------------ hotspots

export type HotspotType = 'space' | 'scene' | 'feature';
export interface Hotspot {
  type: HotspotType;
  /** Unique id; for scenes and features "<space>--<id>". */
  id: string;
  space: string;
  label: string;
  title: string;
  /** feature subtype for styling: sarcophagus, shaft, find, damage, opening, feature */
  kind?: string;
  status: Space['status'];
  position: string;
  normal: string;
  target: string;
  orbit: string;
}

const featureGlyph: Record<string, string> = { sarcophagus: '▭', shaft: '▼', find: '◆', damage: '!', opening: '↓', feature: '◆' };

/** Point features: those recorded in the plan plus sarcophagi and shafts derived from it. */
export interface Feature { id: string; kind: string; title: string; text: string; at: [number, number]; z: number; status: Space['status'] }

export function features(s: Space): Feature[] {
  const out: Feature[] = s.features.map((f) => ({ ...f }));
  if (s.sarcophagus) {
    const where = { 'in-situ': 'in place', removed: 'original position', lost: 'original position' }[s.sarcophagus.state];
    const material = s.sarcophagus.material[0].toUpperCase() + s.sarcophagus.material.slice(1);
    out.push({ id: 'sarcophagus', kind: 'sarcophagus', title: `${material} sarcophagus (${where})`, text: `${s.sarcophagus.label}.`, at: [s.sarcophagus.x, s.sarcophagus.y], z: s.sarcophagus.h + 0.3, status: s.status });
  }
  if (s.pit) {
    const [px, py] = [(s.pit.x[0] + s.pit.x[1]) / 2, (s.pit.y[0] + s.pit.y[1]) / 2];
    out.push({ id: 'shaft', kind: 'shaft', title: 'Well shaft', text: `A vertical shaft about ${Math.round(s.pit.depth)} m deep${s.status === 'documented' ? '' : ' (depth approximate)'}.`, at: [px, py], z: 0.2, status: s.status });
  }
  return out;
}

export function hotspots(plan: Plan): Hotspot[] {
  return plan.spaces.flatMap((s) => {
    const view = orbit(s, plan);
    return [
      { type: 'space' as const, id: s.id, space: s.id, label: s.code, title: s.name, status: s.status, position: hotspot(s), normal: '0 1 0', ...view },
      ...s.scenes.map((sc) => {
        const spot = wallHotspot(s, sc.wall);
        return {
          type: 'scene' as const, id: `${s.id}--${sc.id}`, space: s.id, label: '◉', title: sc.title, status: sc.status, ...spot,
          ...wallView(s, sc.wall, spot.position),
        };
      }),
      ...features(s).map((f) => ({
        type: 'feature' as const, id: `${s.id}--${f.id}`, space: s.id, kind: f.kind, label: featureGlyph[f.kind] ?? '◆', title: f.title, status: f.status,
        position: pos(f.at[0], floorAt(s, f.at[0], f.at[1]) + f.z, f.at[1]), normal: '0 1 0', ...view,
      })),
    ];
  });
}

// ------------------------------------------------------------------ route

/** Midpoint of the shared edge between two touching spaces (the doorway). */
function doorway(a: Space, b: Space): [number, number] | undefined {
  const E = 0.06;
  const ov = (p: [number, number], q: [number, number]) => [Math.max(p[0], q[0]), Math.min(p[1], q[1])];
  if (Math.abs(a.x[1] - b.x[0]) < E || Math.abs(a.x[0] - b.x[1]) < E) {
    const [y0, y1] = ov(a.y, b.y);
    if (y1 > y0) return [Math.abs(a.x[1] - b.x[0]) < E ? a.x[1] : a.x[0], (y0 + y1) / 2];
  }
  if (Math.abs(a.y[1] - b.y[0]) < E || Math.abs(a.y[0] - b.y[1]) < E) {
    const [x0, x1] = ov(a.x, b.x);
    if (x1 > x0) return [(x0 + x1) / 2, Math.abs(a.y[1] - b.y[0]) < E ? a.y[1] : a.y[0]];
  }
  return undefined;
}

/** Route as plan points (x, y, floor depth): entrance → doorways → burial chamber. */
export function routePoints(plan: Plan): [number, number, number][] {
  const byId = new Map(plan.spaces.map((s) => [s.id, s]));
  const spaces = plan.route.map((id) => byId.get(id)).filter((s): s is Space => !!s);
  const pts: [number, number, number][] = [];
  let prev: [number, number] | undefined; // doorway we entered by
  spaces.forEach((s, i) => {
    if (i === 0) {
      // Start at the entrance edge: the end of the space opposite its descent.
      const [cx, cy] = center(s);
      const start: [number, number] = s.descends
        ? ({ 'x+': [s.x[0], cy], 'x-': [s.x[1], cy], 'y+': [cx, s.y[0]], 'y-': [cx, s.y[1]] } as const)[s.descends] as [number, number]
        : [cx, cy];
      pts.push([...start, floorAt(s, ...start)]);
      prev = start;
    }
    const next = spaces[i + 1];
    if (!next) {
      const [cx, cy] = center(s);
      pts.push([cx, cy, floorAt(s, cx, cy)]);
      return;
    }
    const d = doorway(s, next);
    if (d) {
      // Turn at right angles inside rooms: from the entry doorway to the exit doorway.
      const exitOnSide = Math.abs(d[0] - s.x[0]) < 0.07 || Math.abs(d[0] - s.x[1]) < 0.07;
      if (prev && s.kind !== 'stairs' && s.kind !== 'corridor') {
        const corner: [number, number] = exitOnSide ? [prev[0], d[1]] : [d[0], prev[1]];
        if (Math.hypot(corner[0] - prev[0], corner[1] - prev[1]) > 0.1) pts.push([...corner, floorAt(s, ...corner)]);
      }
      pts.push([d[0], d[1], Math.min(floorAt(s, d[0], d[1]), floorAt(next, d[0], d[1]))]);
      prev = d;
    }
  });
  return pts;
}

export interface TourStop { space: string; scene?: string; text: string; title: string }

/** Guided tour: explicit stops if the plan has them, otherwise the route. */
export function tour(plan: Plan): TourStop[] {
  const byId = new Map(plan.spaces.map((s) => [s.id, s]));
  if (plan.tour.length) {
    return plan.tour.map((t) => {
      const s = byId.get(t.space)!;
      const sc = t.scene ? s.scenes.find((x) => x.id === t.scene) : undefined;
      return { ...t, title: sc ? `${s.name}: ${sc.title}` : s.name };
    });
  }
  return plan.route.map((id) => byId.get(id)!).map((s) => ({ space: s.id, text: s.summary, title: s.name }));
}

/** Camera facing a wall from inside the room (for scene stops). */
export function wallView(s: Space, wall: Wall, position: string): { target: string; orbit: string } {
  const theta = { n: 0, s: 180, w: 90, e: -90 }[wall];
  const { w, d } = size(s);
  const radius = Math.max(Math.max(w, d) * 1.4, 9) * MODEL_SCALE;
  return { target: position, orbit: `${theta}deg 55deg ${radius.toFixed(3)}m` };
}

/** Camera framing the whole tomb: centre of its bounds, radius from its size. */
export function overview(plan: Plan): { target: string; orbit: string } {
  const b = bounds(plan);
  const top = Math.max(...plan.spaces.map((s) => Math.max(...s.floor) + s.height * 0.55));
  const [cx, cy, cz] = [(b.x0 + b.x1) / 2, (b.deepest + top) / 2, (b.y0 + b.y1) / 2];
  const diag = Math.hypot(b.x1 - b.x0, b.y1 - b.y0, top - b.deepest);
  return { target: pos(cx, cy, cz), orbit: `${plan.camera.theta}deg ${plan.camera.phi}deg ${(diag * 1.08 * MODEL_SCALE).toFixed(3)}m` };
}
