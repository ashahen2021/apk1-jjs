/**
 * Great Pyramid and Giza plateau models, built from src/data/structures/great-pyramid.yaml
 * and published plateau positions. Model space: X = east, Y = up, Z = south (metres,
 * × PYRAMID_SCALE). src/lib/structures.ts places hotspots with the same mapping.
 *
 * Every mesh gets a named material so the page can switch views (as built, today,
 * cutaway, chambers, construction interpretations) through <model-viewer>'s
 * materials API. Names are part of the contract with src/lib/structures.ts.
 */
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export const PYRAMID_SCALE = 0.004; // 1:250
export const PLATEAU_SCALE = 0.001; // 1:1000

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
};

const COLORS = {
  casing: 0xe9e0c8, today: 0xb89a70, section: 0x8a7353, rock: 0x4d4033, outline: 0xe9e0c8,
  documented: 0xf0b73a, approximate: 0xe98a4f, uncertain: 0x7fa7d9,
  ramp: 0xa98bd8,
};

// ------------------------------------------------------------ geometry helpers

function tri(pts) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pts.flat(), 3));
  g.computeVertexNormals();
  return g;
}
const quadTris = (a, b, c, d) => [a, b, c, a, c, d];

/** Convex solid from a list of faces (each face a list of vertices, counter-clockwise from outside). */
function solid(faces) {
  const pts = [];
  for (const f of faces) for (let i = 1; i < f.length - 1; i++) pts.push(f[0], f[i], f[i + 1]);
  return tri(pts);
}

function boxGeo([x0, x1], [y0, y1], [z0, z1]) {
  const g = new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0).toNonIndexed();
  g.deleteAttribute('uv');
  g.translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
  return g;
}

/** Room box, optionally with a gabled roof whose ridge runs east–west. */
function roomGeo({ x, y, z }, apex) {
  const parts = [boxGeo(x, y, z)];
  if (apex) {
    const [x0, x1] = x, [z0, z1] = z, y1 = y[1], zm = (z0 + z1) / 2;
    parts.push(solid([
      [[x0, y1, z0], [x0, y1, z1], [x0, apex, zm]],
      [[x1, y1, z1], [x1, y1, z0], [x1, apex, zm]],
      [[x0, y1, z0], [x0, apex, zm], [x1, apex, zm], [x1, y1, z0]],
      [[x1, y1, z1], [x1, apex, zm], [x0, apex, zm], [x0, y1, z1]],
    ]));
  }
  return mergeGeometries(parts);
}

/**
 * Passage along a floor centre line: a prism with vertical sides and a vertical
 * height h (as a sloping passage looks in section).
 */
function passageGeo(path, w, h) {
  const parts = [];
  for (let i = 0; i < path.length - 1; i++) {
    const a = new THREE.Vector3(...path[i]), b = new THREE.Vector3(...path[i + 1]);
    const d = new THREE.Vector3().subVectors(b, a);
    const side = new THREE.Vector3(d.z, 0, -d.x).normalize().multiplyScalar(w / 2);
    if (side.lengthSq() === 0) side.set(w / 2, 0, 0);
    const up = new THREE.Vector3(0, h, 0);
    const v = (p, s, u) => p.clone().addScaledVector(side, s).add(u ? up : new THREE.Vector3()).toArray();
    const [a0, a1, a2, a3] = [v(a, -1, 0), v(a, 1, 0), v(a, 1, 1), v(a, -1, 1)];
    const [b0, b1, b2, b3] = [v(b, -1, 0), v(b, 1, 0), v(b, 1, 1), v(b, -1, 1)];
    parts.push(tri([
      ...quadTris(a0, b0, b1, a1), ...quadTris(a3, a2, b2, b3),
      ...quadTris(a0, a3, b3, b0), ...quadTris(a1, b1, b2, a2),
      ...quadTris(a0, a1, a2, a3), ...quadTris(b1, b0, b3, b2),
    ]));
  }
  return mergeGeometries(parts);
}

/** Where a line from p rising at `angle` towards dir ('n' = −z, 's' = +z) meets the pyramid face. */
function toFace(p, dir, angle, env) {
  const half = env.base / 2, slope = env.height / half;
  const t = Math.tan(THREE.MathUtils.degToRad(angle));
  const s = dir === 'n' ? -1 : 1;
  // Face: |z| = half − y / slope. Solve along the ray: z = z0 + s·d, y = y0 + t·d.
  const d = (half - p[1] / slope - s * p[2]) / (1 + t / slope);
  return [p[0], p[1] + t * d, p[2] + s * d];
}

// ------------------------------------------------------------ pyramid solids

function pyramidSolid(half, H, top = H) {
  const k = 1 - top / H, r = half * k;
  const b = [[-half, 0, -half], [half, 0, -half], [half, 0, half], [-half, 0, half]];
  if (r < 0.01) {
    const apex = [0, H, 0];
    return solid([[b[3], b[2], b[1], b[0]], [b[0], b[1], apex], [b[1], b[2], apex], [b[2], b[3], apex], [b[3], b[0], apex]]);
  }
  const t = [[-r, top, -r], [r, top, -r], [r, top, r], [-r, top, r]];
  return solid([
    [b[3], b[2], b[1], b[0]], [t[0], t[1], t[2], t[3]],
    [b[0], b[1], t[1], t[0]], [b[1], b[2], t[2], t[1]], [b[2], b[3], t[3], t[2]], [b[3], b[0], t[0], t[3]],
  ]);
}

/** Stepped core of courses up to `upTo` (the pyramid as it stands without its casing). */
function steppedCore(half, H, upTo, course = 2.2, inset = 1.2) {
  const parts = [];
  for (let y = 0; y < upTo - 0.01; y += course) {
    const top = Math.min(y + course, upTo);
    const r = half * (1 - top / H) - inset * 0.5;
    if (r <= 0.5) break;
    parts.push(boxGeo([-r, r], [y, top], [-r, r]));
  }
  return mergeGeometries(parts);
}

/** The part of the pyramid west of the plane x = c (c < 0): the cut-away backdrop. */
function westPart(half, H, c) {
  const r1 = -c, y1 = H * (1 - r1 / half);
  const B0 = [-half, 0, -half], B1 = [c, 0, -half], B2 = [c, 0, half], B3 = [-half, 0, half];
  const T0 = [c, y1, -r1], T1 = [c, y1, r1];
  return solid([[B3, B2, B1, B0], [B1, B2, T1, T0], [B0, B1, T0], [B2, B3, T1], [B3, B0, T0, T1]]);
}

// ------------------------------------------------------------ construction interpretations

/** Straight ramp against the south face up to about a third of the height, at about 1:10. */
function rampStraight(half, H) {
  const y = 48, zf = half * (1 - y / H), len = y * 10, w = 30;
  const A = [zf, y], B = [half, 0], C = [zf + len, 0];
  const f = (x, [z, yy]) => [x, yy, z];
  return solid([
    [f(-w / 2, A), f(-w / 2, B), f(-w / 2, C)],
    [f(w / 2, A), f(w / 2, C), f(w / 2, B)],
    [f(-w / 2, A), f(-w / 2, C), f(w / 2, C), f(w / 2, A)],
    [f(-w / 2, B), f(w / 2, B), f(w / 2, C), f(-w / 2, C)],
    [f(-w / 2, A), f(w / 2, A), f(w / 2, B), f(-w / 2, B)],
  ]);
}

/** A ribbon laid on (or offset from) the faces, following points given as [along-face, y] per face. */
function faceRibbon(points, half, H, { width = 8, offset = 2, thick = 1.5 } = {}) {
  // points: [x, y, z] on the pyramid surface; build a strip of boxes between consecutive points.
  const parts = [];
  for (let i = 0; i < points.length - 1; i++) {
    const a = new THREE.Vector3(...points[i]), b = new THREE.Vector3(...points[i + 1]);
    const mid = a.clone().add(b).multiplyScalar(0.5);
    const out = new THREE.Vector3(mid.x, 0, mid.z).normalize();
    // Outward normal of the face the segment lies on (dominant axis).
    const n = Math.abs(mid.x) > Math.abs(mid.z) ? new THREE.Vector3(Math.sign(mid.x), 0, 0) : new THREE.Vector3(0, 0, Math.sign(mid.z));
    if (!n.lengthSq()) n.copy(out);
    const dir = b.clone().sub(a);
    const side = n.clone().multiplyScalar(width);
    const o = n.clone().multiplyScalar(offset);
    const p = (v, s, up) => v.clone().add(o).addScaledVector(side, s).add(new THREE.Vector3(0, up, 0)).toArray();
    const [a0, a1, a2, a3] = [p(a, 0, 0), p(a, 1, 0), p(a, 1, thick), p(a, 0, thick)];
    const [b0, b1, b2, b3] = [p(b, 0, 0), p(b, 1, 0), p(b, 1, thick), p(b, 0, thick)];
    if (dir.lengthSq() < 0.01) continue;
    parts.push(tri([
      ...quadTris(a0, b0, b1, a1), ...quadTris(a3, a2, b2, b3), ...quadTris(a0, a3, b3, b0),
      ...quadTris(a1, b1, b2, a2), ...quadTris(a0, a1, a2, a3), ...quadTris(b1, b0, b3, b2),
    ]));
  }
  return mergeGeometries(parts);
}

const faceR = (half, H, y) => half * (1 - y / H);

/** Switchback ramp climbing the east face in legs. */
function rampZigzag(half, H) {
  const pts = [];
  const legs = 6, top = 110;
  for (let i = 0; i <= legs; i++) {
    const y = (top * i) / legs, r = faceR(half, H, y) * 0.92;
    pts.push([faceR(half, H, y), y, i % 2 ? -r : r]);
  }
  return faceRibbon(pts, half, H, { width: 7, offset: 0.5 });
}

/** Ramp spiralling around all four faces, rising about 25 m per side. */
function rampSpiral(half, H) {
  const pts = [];
  let y = 0;
  const corners = (r) => [[r, r], [r, -r], [-r, -r], [-r, r]]; // SE → NE → NW → SW (x, z)
  for (let k = 0; y <= 108; k++) {
    const r = faceR(half, H, y);
    const [x, z] = corners(r)[k % 4];
    pts.push([x, y, z]);
    y += 18;
  }
  return faceRibbon(pts, half, H, { width: 9, offset: 0.5, thick: 2 });
}

/** Internal ramp (after J.-P. Houdin, 2006; schematic): a spiral about 12 m inside the faces, above roughly the lowest 30% of the height. */
function rampInternal(half, H) {
  const parts = [];
  const inset = 12, w = 2.6, h = 3.4;
  let y = 43;
  const corners = (r) => [[r, r], [r, -r], [-r, -r], [-r, r]];
  let prev;
  for (let i = 0; y < 132; i++) {
    const r = faceR(half, H, y) - inset;
    if (r < 6) break;
    const [x, z] = corners(r)[i % 4];
    const p = [x, y, z];
    if (prev) parts.push(passageGeo([prev, p], w, h));
    prev = p;
    y += 2 * r * 0.07; // about a 7% gradient along each side
  }
  return mergeGeometries(parts);
}

// ------------------------------------------------------------ assembly

function material(name, color, { opacity = 1, emissive = 0, doubleSide = false, roughness = 0.9 } = {}) {
  const m = new THREE.MeshStandardMaterial({
    color, roughness, metalness: 0, transparent: opacity < 1, opacity, depthWrite: opacity >= 1,
    side: THREE.DoubleSide,
    emissive: emissive ? new THREE.Color(color).multiplyScalar(emissive) : new THREE.Color(0),
  });
  m.name = name;
  return m;
}

function mesh(geo, mat) {
  const m = new THREE.Mesh(geo, mat);
  m.name = mat.name;
  m.castShadow = m.receiveShadow = mat.opacity >= 1;
  return m;
}

/**
 * Build the Great Pyramid. `show` limits which named parts are included
 * (for still renders); the GLB includes everything.
 */
export function buildPyramid(data, { show } = {}) {
  const env = data.envelope;
  const half = env.base / 2, H = env.height;
  const group = new THREE.Group();
  const want = (k) => !show || show.includes(k);
  const add = (k, geo, mat) => { if (want(k) && geo) group.add(mesh(geo, mat)); };

  add('casing', pyramidSolid(half, H), material(MAT.casing, COLORS.casing, { roughness: 0.7 }));
  add('today', steppedCore(half, H, env.today), material(MAT.today, COLORS.today));
  add('section', westPart(half, H, -3.3), material(MAT.section, COLORS.section));
  add('rock', boxGeo([-half - 20, -7], [-40, 0], [-half - 20, half + 20]), material(MAT.rock, COLORS.rock));
  add('outline', pyramidSolid(half, H), material(MAT.outline, COLORS.outline, { opacity: 0.12 }));

  const byStatus = { documented: [], approximate: [], uncertain: [] };
  for (const e of data.elements) {
    let g;
    if (e.kind === 'room' || (e.kind === 'void' && e.box)) g = roomGeo(e.box, e.apex);
    else if (e.kind === 'shaft') {
      const end = e.length
        ? [e.start[0], e.start[1] + Math.sin(THREE.MathUtils.degToRad(e.angle)) * e.length, e.start[2] + (e.dir === 'n' ? -1 : 1) * Math.cos(THREE.MathUtils.degToRad(e.angle)) * e.length]
        : toFace(e.start, e.dir, e.angle, env);
      g = passageGeo([e.start, end], 0.5, 0.5);
    } else g = passageGeo(e.path, e.w, e.h);
    byStatus[e.status].push(g);
  }
  add('documented', byStatus.documented.length && mergeGeometries(byStatus.documented), material(MAT.documented, COLORS.documented, { emissive: 0.25, roughness: 0.6 }));
  add('approximate', byStatus.approximate.length && mergeGeometries(byStatus.approximate), material(MAT.approximate, COLORS.approximate, { emissive: 0.2, roughness: 0.6 }));
  add('uncertain', byStatus.uncertain.length && mergeGeometries(byStatus.uncertain), material(MAT.uncertain, COLORS.uncertain, { opacity: 0.45 }));

  add('rampStraight', rampStraight(half, H), material(MAT.rampStraight, COLORS.ramp, { opacity: 0.8 }));
  add('rampZigzag', rampZigzag(half, H), material(MAT.rampZigzag, COLORS.ramp, { opacity: 0.85 }));
  add('rampSpiral', rampSpiral(half, H), material(MAT.rampSpiral, COLORS.ramp, { opacity: 0.85 }));
  add('rampInternal', rampInternal(half, H), material(MAT.rampInternal, COLORS.ramp, { opacity: 0.85 }));
  return group;
}

// ------------------------------------------------------------ Giza plateau (schematic)

/**
 * Positions in metres from the centre of Khufu's pyramid (x east, z south),
 * derived from site coordinates; outlines of temples and cemeteries are schematic.
 */
export const PLATEAU = {
  khufu: { at: [0, 0], base: 230.35, height: 146.7, today: 138.5 },
  khafre: { at: [-328, 344], base: 215.3, height: 143.5, today: 136.4 },
  menkaure: { at: [-589, 743], base: 103.4, depth: 101.8, height: 65.5, today: 61 },
  sphinx: { at: [328, 434], length: 73, width: 19, height: 20 },
};

export const PLATEAU_MAT = {
  built: 'Pyramids as built',
  today: 'Pyramids today',
  temples: 'Temples and causeways',
  sphinx: 'Great Sphinx',
  cemeteries: 'Cemeteries (schematic)',
  ground: 'Plateau',
};

function ribbon2d(pts, w, y = 0.6, thick = 1.2) {
  const parts = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const [ax, az] = pts[i], [bx, bz] = pts[i + 1];
    parts.push(passageGeo([[ax, y, az], [bx, y, bz]], w, thick));
  }
  return mergeGeometries(parts);
}

/** Simple massing of the Sphinx: body, forepaws, head and nemes. Proportions only. */
export function sphinxGeo([cx, cz], { length = 73, width = 19, height = 20 } = {}) {
  const x0 = cx - length / 2;
  const parts = [
    // Haunches and body.
    boxGeo([x0, x0 + 50], [0, 12], [cz - width / 2, cz + width / 2]),
    boxGeo([x0 + 2, x0 + 20], [12, 15], [cz - width / 2 + 1, cz + width / 2 - 1]),
    // Forepaws extending east.
    boxGeo([x0 + 50, x0 + 73], [0, 3.5], [cz - 8, cz - 3]),
    boxGeo([x0 + 50, x0 + 73], [0, 3.5], [cz + 3, cz + 8]),
    // Chest and neck.
    boxGeo([x0 + 44, x0 + 54], [0, 13], [cz - 6.5, cz + 6.5]),
    // Head with nemes headdress.
    boxGeo([x0 + 45, x0 + 52], [12.5, 20], [cz - 4.5, cz + 4.5]),
    solid([
      [[x0 + 43, 12, cz - 6.5], [x0 + 43, 12, cz + 6.5], [x0 + 44.5, 19, cz + 4.6], [x0 + 44.5, 19, cz - 4.6]],
      [[x0 + 51, 12, cz + 6.5], [x0 + 51, 12, cz - 6.5], [x0 + 51, 19, cz - 4.6], [x0 + 51, 19, cz + 4.6]],
      [[x0 + 43, 12, cz - 6.5], [x0 + 44.5, 19, cz - 4.6], [x0 + 51, 19, cz - 4.6], [x0 + 51, 12, cz - 6.5]],
      [[x0 + 43, 12, cz + 6.5], [x0 + 51, 12, cz + 6.5], [x0 + 51, 19, cz + 4.6], [x0 + 44.5, 19, cz + 4.6]],
    ]),
    // Face block.
    boxGeo([x0 + 52, x0 + 53.6], [13.5, 18.5], [cz - 2.1, cz + 2.1]),
  ];
  return mergeGeometries(parts);
}

export function buildPlateau({ show } = {}) {
  const P = PLATEAU;
  const group = new THREE.Group();
  const want = (k) => !show || show.includes(k);
  const at = (g, [x, z]) => g.translate(x, 0, z);
  const pyr = (p, top) => at(pyramidSolid(p.base / 2, p.height, top), p.at);
  const stepped = (p) => at(steppedCore(p.base / 2, p.height, p.today, 4, 1.6), p.at);

  const queens = [[165, -60], [165, 0], [165, 55]].map((a) => at(pyramidSolid(23, 30), a))
    .concat([[-470, 860], [-540, 860], [-610, 860]].map((a) => at(pyramidSolid(18, 22), a)));
  const queensToday = [[165, -60], [165, 0], [165, 55]].map((a) => at(steppedCore(23, 30, 24, 3, 1), a))
    .concat([[-470, 860], [-540, 860], [-610, 860]].map((a) => at(steppedCore(18, 22, 16, 3, 1), a)));

  if (want('built')) group.add(mesh(mergeGeometries([pyr(P.khufu), pyr(P.khafre), pyr(P.menkaure), ...queens]), material(PLATEAU_MAT.built, COLORS.casing, { roughness: 0.7 })));
  if (want('today')) group.add(mesh(mergeGeometries([stepped(P.khufu), stepped(P.khafre), stepped(P.menkaure), ...queensToday]), material(PLATEAU_MAT.today, COLORS.today)));

  if (want('temples')) {
    const temples = [
      // Khufu: mortuary temple against the east face; causeway runs east (its lower end lies under the modern town).
      boxGeo([115, 167], [0, 8], [-26, 26]),
      // Khafre: mortuary temple, causeway, valley temple beside the Sphinx.
      boxGeo([-220, -170], [0, 9], [318, 370]),
      boxGeo([268, 313], [0, 12], [462, 507]),
      // Sphinx temple, in front of the Sphinx.
      boxGeo([372, 418], [0, 8], [412, 458]),
      // Menkaure: mortuary temple and (distant) valley temple.
      boxGeo([-537, -495], [0, 7], [718, 768]),
      ribbon2d([[-170, 350], [268, 480]], 9),
      ribbon2d([[167, 0], [420, 160]], 9),
      ribbon2d([[-495, 745], [-40, 950]], 8),
    ];
    group.add(mesh(mergeGeometries(temples), material(PLATEAU_MAT.temples, 0xcdb893)));
  }
  if (want('sphinx')) group.add(mesh(sphinxGeo(P.sphinx.at), material(PLATEAU_MAT.sphinx, 0xd2b17c)));
  if (want('cemeteries')) {
    const m = [];
    // Eastern and western mastaba fields, drawn as rows of blocks (layout schematic).
    for (let i = 0; i < 6; i++) for (let j = 0; j < 5; j++) m.push(boxGeo([200 + i * 32, 222 + i * 32], [0, 5], [-110 + j * 36, -92 + j * 36]));
    for (let i = 0; i < 7; i++) for (let j = 0; j < 6; j++) m.push(boxGeo([-360 + i * 30, -338 + i * 30], [0, 5], [-250 + j * 32, -234 + j * 32]));
    group.add(mesh(mergeGeometries(m), material(PLATEAU_MAT.cemeteries, 0xa8916c)));
  }
  if (want('ground')) group.add(mesh(boxGeo([-760, 560], [-2, 0], [-360, 1100]), material(PLATEAU_MAT.ground, 0x7d6a4f)));
  return group;
}
