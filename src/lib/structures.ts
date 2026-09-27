import type { CollectionEntry } from 'astro:content';

/**
 * Helpers for 3D structure models (src/data/structures). The GLB is built by
 * scripts/render/pyramid.js with the same axes: x east, y up, z south, metres
 * × PYRAMID_SCALE. Material names below must match that script.
 */
export const PYRAMID_SCALE = 0.004;
export const PLATEAU_SCALE = 0.001;

export type Structure = CollectionEntry<'structures'>['data'];
export type Element = Structure['elements'][number];
export type Evidence = Element['status'];

export const MAT = {
  casing: 'Casing as built',
  today: 'Core today',
  section: 'Section: masonry',
  rock: 'Section: bedrock',
  outline: 'Outline as built',
  documented: 'Spaces: documented',
  approximate: 'Spaces: approximate',
  uncertain: 'Spaces: uncertain',
  rampStraight: 'Interpretation: straight ramp',
  rampZigzag: 'Interpretation: zigzag ramp',
  rampSpiral: 'Interpretation: spiral ramp',
  rampInternal: 'Interpretation: internal ramp',
} as const;
type Part = keyof typeof MAT;

export interface ViewMode {
  id: string;
  label: string;
  group: 'Monument' | 'Construction interpretations';
  parts: Part[];
  /** Theta and phi of the camera, degrees. */
  camera: [number, number];
  note: string;
  /** Hotspots shown: interior spaces, or none. */
  spots: boolean;
  evidence: 'documented' | 'reconstructed' | 'interpretation';
}

/** Mirrors MODES and CAMERA in scripts/render/pyramid-scenes.js (posters are rendered per mode). */
export const PYRAMID_MODES: ViewMode[] = [
  { id: 'exterior', label: 'As built', group: 'Monument', parts: ['casing'], camera: [35, 70], spots: false, evidence: 'reconstructed',
    note: 'The finished pyramid in smooth white Tura limestone, to Petrie\'s measured base (230.35 m) and slope (51°50′40″). Most of the casing was later removed.' },
  { id: 'today', label: 'Today', group: 'Monument', parts: ['today'], camera: [35, 70], spots: false, evidence: 'reconstructed',
    note: 'The stepped core that stands today, about 138.5 m high, after most of the casing was removed. Course heights and the flat summit are simplified.' },
  { id: 'cutaway', label: 'Cutaway', group: 'Monument', parts: ['section', 'rock', 'outline', 'documented', 'approximate', 'uncertain'], camera: [80, 72], spots: true, evidence: 'documented',
    note: 'Seen from the east with the pyramid cut away along a north–south plane. Passages and chambers are placed from Petrie\'s survey.' },
  { id: 'chambers', label: 'Chambers', group: 'Monument', parts: ['outline', 'documented', 'approximate', 'uncertain'], camera: [80, 70], spots: true, evidence: 'documented',
    note: 'Only the internal spaces, inside a transparent outline of the pyramid. Gold: surveyed. Orange: approximate. Blue: detected but not established.' },
  { id: 'ramp-straight', label: 'Straight ramp', group: 'Construction interpretations', parts: ['today', 'rampStraight'], camera: [30, 68], spots: false, evidence: 'interpretation',
    note: 'Interpretation: one long ramp against a face. At a workable 1:10 gradient it would need to be about 490 m long just to reach a third of the height (arithmetic, not a finding).' },
  { id: 'ramp-zigzag', label: 'Zigzag ramp', group: 'Construction interpretations', parts: ['today', 'rampZigzag'], camera: [60, 68], spots: false, evidence: 'interpretation',
    note: 'Interpretation: a switchback ramp climbing one face. Its gradient and turns are illustrative.' },
  { id: 'ramp-spiral', label: 'Spiral ramp', group: 'Construction interpretations', parts: ['today', 'rampSpiral'], camera: [35, 62], spots: false, evidence: 'interpretation',
    note: 'Interpretation: a ramp wrapping around the faces. Critics note it would hide the corners and edges needed to keep the pyramid true.' },
  { id: 'ramp-internal', label: 'Internal ramp', group: 'Construction interpretations', parts: ['outline', 'rampInternal', 'documented'], camera: [60, 66], spots: false, evidence: 'interpretation',
    note: 'Interpretation after J.-P. Houdin (2006): an external ramp for roughly the lowest 30 per cent of the height, then a ramp just inside the faces. Unproven; the ramp here is drawn schematically by us.' },
];

const m = (n: number, s: number) => (n * s).toFixed(3);
const pos = ([x, y, z]: number[], s = PYRAMID_SCALE) => `${m(x, s)}m ${m(y, s)}m ${m(z, s)}m`;

/** A representative point for labels: the given label point, or the element's centre. */
export function anchor(e: Element): [number, number, number] {
  if (e.label) return e.label;
  if (e.box) return [(e.box.x[0] + e.box.x[1]) / 2, e.box.y[1] + 0.5, (e.box.z[0] + e.box.z[1]) / 2];
  if (e.path) {
    const [a, b] = [e.path[0], e.path[e.path.length - 1]];
    return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + (e.h ?? 1), (a[2] + b[2]) / 2];
  }
  if (e.start) return e.start;
  return [0, 0, 0];
}

export interface Spot { id: string; label: string; title: string; status: Evidence; position: string; target: string }

/** Hotspots for the main interior spaces (shafts and minor features are listed but not pinned). */
export function pyramidSpots(s: Structure): Spot[] {
  const skip = new Set(['lower-passage', 'coffer', 'kings-shaft-s', 'queens-shaft-s', 'blind-passage']);
  return s.elements.filter((e) => !skip.has(e.id)).map((e, i) => ({
    id: e.id,
    label: String(i + 1),
    title: e.name,
    status: e.status,
    position: pos(anchor(e)),
    target: pos(anchor(e)),
  }));
}

export const EVIDENCE_LABEL: Record<Evidence, string> = {
  documented: 'Documented (surveyed)',
  approximate: 'Approximate',
  uncertain: 'Uncertain (detected, not established)',
};

/** Whole-model camera: centre of the pyramid, radius from its size. */
export function pyramidOrbit(s: Structure, [theta, phi]: [number, number]) {
  const r = Math.hypot(s.envelope.base, s.envelope.height) * 1.6 * PYRAMID_SCALE;
  return { orbit: `${theta}deg ${phi}deg ${r.toFixed(3)}m`, target: pos([0, s.envelope.height * 0.3, 0]) };
}

// ------------------------------------------------------------------ plateau

export const PLATEAU_MAT = {
  built: 'Pyramids as built',
  today: 'Pyramids today',
  temples: 'Temples and causeways',
  sphinx: 'Great Sphinx',
  cemeteries: 'Cemeteries (schematic)',
  ground: 'Plateau',
} as const;

export const PLATEAU_MODES: ViewMode[] = [
  { id: 'built', label: 'As built', group: 'Monument', parts: [], camera: [150, 58], spots: true, evidence: 'reconstructed', note: 'The three main pyramids and the queens\' pyramids with their casing. Pyramid bases to published sizes; positions indicative. Temples, causeways and cemeteries are schematic blocks placed by us.' },
  { id: 'today', label: 'Today', group: 'Monument', parts: [], camera: [150, 58], spots: true, evidence: 'reconstructed', note: 'The pyramids without most of their casing. Khafre\'s pyramid keeps a cap of casing near the top; Menkaure\'s keeps some of its granite lower courses.' },
];
export const PLATEAU_PARTS: Record<string, (keyof typeof PLATEAU_MAT)[]> = {
  built: ['built', 'temples', 'sphinx', 'cemeteries', 'ground'],
  today: ['today', 'temples', 'sphinx', 'cemeteries', 'ground'],
};

/** Plateau landmarks, metres from the centre of Khufu's pyramid (x east, z south). Mirrors PLATEAU in pyramid.js. */
export const PLATEAU_SITES = [
  { id: 'khufu', title: 'Great Pyramid of Khufu', at: [0, 150, 0], href: '/monuments/great-pyramid/' },
  { id: 'khafre', title: 'Pyramid of Khafre', at: [-328, 146, 344], href: '/pharaohs/khafre/' },
  { id: 'menkaure', title: 'Pyramid of Menkaure', at: [-589, 68, 743], href: '/pharaohs/menkaure/' },
  { id: 'sphinx', title: 'Great Sphinx', at: [328, 24, 434], href: '/monuments/great-sphinx/' },
  { id: 'khafre-valley', title: "Khafre's valley temple", at: [290, 16, 484] },
  { id: 'east-field', title: 'Eastern cemetery (mastabas)', at: [280, 10, -40] },
  { id: 'west-field', title: 'Western cemetery (mastabas)', at: [-270, 10, -170] },
  { id: 'queens', title: "Queens' pyramids of Khufu", at: [165, 34, 0] },
] as const;

export const plateauPos = (at: readonly number[]) => pos(at as number[], PLATEAU_SCALE);
