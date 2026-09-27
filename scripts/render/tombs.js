/**
 * Builds tomb models from plan data (src/data/plans/*.yaml).
 *
 * Model space: X = plan x, Y = floor depth (up), Z = plan y. Units are metres
 * before MODEL_SCALE is applied. src/lib/plans.ts uses the same mapping to
 * place hotspots, so keep the two in step.
 */
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export const MODEL_SCALE = 0.02; // 1:50 — a tomb fits on a table in AR

const C = {
  floor: new THREE.Color(0x8b7658),
  wall: new THREE.Color(0xcdb893),
  pillar: new THREE.Color(0xbfa77f),
  // One flat tint marks decorated surfaces; no invented layout of registers or friezes.
  painted: new THREE.Color(0xcfa451),
  damaged: new THREE.Color(0xa0685a),
  unfinished: new THREE.Color(0xe6ddcb),
  route: new THREE.Color(0xf2c14e),
  pit: new THREE.Color(0x231c15),
  quartzite: new THREE.Color(0x7e4636),
  granite: new THREE.Color(0x7c3b2e),
  calcite: new THREE.Color(0xe8e0cc),
  shrine: new THREE.Color(0xd8a93c),
};

const GHOST = () =>
  new THREE.MeshStandardMaterial({ color: 0x7fa7d9, transparent: true, opacity: 0.32, depthWrite: false, side: THREE.DoubleSide, roughness: 0.6 });

// ------------------------------------------------------------ primitives

function quad(a, b, c, d, color) {
  // a-b-c-d counter-clockwise; two triangles, flat normals, vertex colours.
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([...a, ...b, ...c, ...a, ...c, ...d], 3));
  g.computeVertexNormals();
  return paint(g, color);
}

function box(x0, x1, y0, y1, z0, z1, color) {
  const g = new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0).toNonIndexed();
  g.deleteAttribute('uv');
  g.translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
  return paint(g, color);
}

function paint(g, color) {
  const n = g.attributes.position.count;
  const col = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) col.set([color.r, color.g, color.b], i * 3);
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return g;
}

// ------------------------------------------------------------ plan helpers

const EPS = 0.06;

export function floorAt(s, x, y) {
  const [f0, f1] = s.floor;
  if (!s.descends || f0 === f1) return f0;
  const [x0, x1] = s.x, [y0, y1] = s.y;
  const t = {
    'x+': (x - x0) / (x1 - x0),
    'x-': (x1 - x) / (x1 - x0),
    'y+': (y - y0) / (y1 - y0),
    'y-': (y1 - y) / (y1 - y0),
  }[s.descends];
  return f0 + (f1 - f0) * Math.min(1, Math.max(0, t));
}

/** Door openings on one edge of a space, where another space touches it. */
function gaps(s, edge, spaces) {
  const out = [];
  const [x0, x1] = s.x, [y0, y1] = s.y;
  for (const o of spaces) {
    if (o === s) continue;
    let touch = false, a = 0, b = 0;
    if (edge === 'n' && Math.abs(o.y[1] - y0) < EPS) { touch = true; [a, b] = [Math.max(x0, o.x[0]), Math.min(x1, o.x[1])]; }
    if (edge === 's' && Math.abs(o.y[0] - y1) < EPS) { touch = true; [a, b] = [Math.max(x0, o.x[0]), Math.min(x1, o.x[1])]; }
    if (edge === 'w' && Math.abs(o.x[1] - x0) < EPS) { touch = true; [a, b] = [Math.max(y0, o.y[0]), Math.min(y1, o.y[1])]; }
    if (edge === 'e' && Math.abs(o.x[0] - x1) < EPS) { touch = true; [a, b] = [Math.max(y0, o.y[0]), Math.min(y1, o.y[1])]; }
    if (!touch || b - a < 0.3) continue;
    // Parts of one room are open to each other; narrow passages open fully;
    // other rooms get a doorway of at most 1.4 m.
    const width = (s.room && s.room === o.room) || b - a <= 2.8 ? b - a : 1.4;
    const mid = (a + b) / 2;
    out.push([mid - width / 2, mid + width / 2]);
  }
  return out.sort((p, q) => p[0] - q[0]);
}

function subtract([a, b], holes) {
  const segs = [];
  let cur = a;
  for (const [h0, h1] of holes) {
    if (h0 > cur) segs.push([cur, Math.min(h0, b)]);
    cur = Math.max(cur, h1);
  }
  if (cur < b) segs.push([cur, b]);
  return segs.filter(([p, q]) => q - p > 0.05);
}

// ------------------------------------------------------------ builder

/**
 * @param plan  plan data (as in the YAML)
 * @param opts.cut        wall height as a fraction of room height (cutaway)
 * @param opts.ceiling    add ceilings (for interior renders)
 * @param opts.shrines    add Tutankhamun's gilded shrines around the sarcophagus
 */
export function buildTomb(plan, { cut = 0.55, ceiling = false, shrines = false, route = true } = {}) {
  // Geometry is grouped by evidence status so the viewer can recolour it.
  const groups = { documented: [], approximate: [] };
  const ghost = [];
  // Same defaults as the content schema (raw YAML does not have them).
  const spaces = plan.spaces.map((s) => ({ decorated: [], pillars: [], pillarSize: 1.1, decoratedPillars: false, ...s }));

  const byId = new Map(spaces.map((s) => [s.id, s]));
  for (const s of spaces) {
    const out = s.status === 'uncertain' ? ghost : groups[s.status];
    const [x0, x1] = s.x, [y0, y1] = s.y;
    const wallH = s.height * cut;
    // A space cut into this one's floor (e.g. a descent in a hall) leaves a hole.
    const hole = spaces.find((o) => o.within === s.id);
    // A space cut into another's floor has walls only up to that floor.
    const parent = s.within ? byId.get(s.within) : undefined;

    // Floor: steps, a slope, or a flat slab (with a hole for a shaft).
    if (s.kind === 'stairs' && s.descends) {
      const along = s.descends[0];
      const len = along === 'x' ? x1 - x0 : y1 - y0;
      const n = Math.max(4, Math.round(Math.abs(s.floor[1] - s.floor[0]) / 0.32));
      for (let i = 0; i < n; i++) {
        const t0 = i / n, t1 = (i + 1) / n;
        const top = s.floor[0] + (s.floor[1] - s.floor[0]) * t0;
        const fwd = s.descends[1] === '+';
        const p0 = fwd ? t0 : 1 - t1, p1 = fwd ? t1 : 1 - t0;
        if (along === 'x') out.push(box(x0 + len * p0, x0 + len * p1, top - 0.3, top, y0, y1, C.floor));
        else out.push(box(x0, x1, top - 0.3, top, y0 + len * p0, y0 + len * p1, C.floor));
      }
    } else if (s.descends && s.floor[0] !== s.floor[1]) {
      const f = (x, y) => floorAt(s, x, y);
      out.push(quad([x0, f(x0, y1), y1], [x1, f(x1, y1), y1], [x1, f(x1, y0), y0], [x0, f(x0, y0), y0], C.floor));
    } else if (s.pit) {
      const f = s.floor[0];
      const [px0, px1] = s.pit.x, [py0, py1] = s.pit.y;
      out.push(box(x0, x1, f - 0.3, f, y0, py0, C.floor), box(x0, x1, f - 0.3, f, py1, y1, C.floor));
      out.push(box(x0, px0, f - 0.3, f, py0, py1, C.floor), box(px1, x1, f - 0.3, f, py0, py1, C.floor));
      const b = f - s.pit.depth;
      out.push(
        quad([px0, b, py0], [px1, b, py0], [px1, f, py0], [px0, f, py0], C.pit),
        quad([px1, b, py1], [px0, b, py1], [px0, f, py1], [px1, f, py1], C.pit),
        quad([px0, b, py1], [px0, b, py0], [px0, f, py0], [px0, f, py1], C.pit),
        quad([px1, b, py0], [px1, b, py1], [px1, f, py1], [px1, f, py0], C.pit),
        box(px0, px1, b - 0.2, b, py0, py1, C.pit),
      );
    } else if (hole) {
      const f = s.floor[0];
      const [hx0, hx1] = hole.x, [hy0, hy1] = hole.y;
      for (const [a0, a1, b0, b1] of [[x0, x1, y0, hy0], [x0, x1, hy1, y1], [x0, hx0, hy0, hy1], [hx1, x1, hy0, hy1]]) {
        if (a1 - a0 > 0.01 && b1 - b0 > 0.01) out.push(box(a0, a1, f - 0.3, f, b0, b1, C.floor));
      }
    } else {
      out.push(box(x0, x1, s.floor[0] - 0.3, s.floor[0], y0, y1, C.floor));
    }

    // Walls: plain rock, a flat "decorated" tint, or the condition colour.
    const edges = {
      n: [[x0, y0], [x1, y0], 'x'],
      s: [[x1, y1], [x0, y1], 'x'],
      w: [[x0, y1], [x0, y0], 'y'],
      e: [[x1, y0], [x1, y1], 'y'],
    };
    for (const [edge, [[ax, ay], [bx, by], axis]] of Object.entries(edges)) {
      const decorated = s.decorated.includes(edge);
      const span = axis === 'x' ? [Math.min(ax, bx), Math.max(ax, bx)] : [Math.min(ay, by), Math.max(ay, by)];
      for (const [p, q] of subtract(span, gaps(s, edge, spaces))) {
        const pt = (v) => (axis === 'x' ? [v, ay] : [ax, v]);
        const [pa, pb] = (axis === 'x' ? ax < bx : ay < by) ? [pt(p), pt(q)] : [pt(q), pt(p)];
        const fa = floorAt(s, pa[0], pa[1]), fb = floorAt(s, pb[0], pb[1]);
        const marked = s.condition === 'unfinished' || (s.condition === 'damaged' && (!s.conditionWalls?.length || s.conditionWalls.includes(edge)));
        const color = marked ? C[s.condition] : decorated ? C.painted : C.wall;
        if (parent) {
          // Sides of the cutting: from the stair up to the floor of the room above.
          const pf = parent.floor[0];
          if (pf - fa > 0.02 || pf - fb > 0.02) out.push(quad([pa[0], fa, pa[1]], [pb[0], fb, pb[1]], [pb[0], Math.max(fb, pf), pb[1]], [pa[0], Math.max(fa, pf), pa[1]], color));
          continue;
        }
        const top = ceiling ? s.height : wallH;
        out.push(quad([pa[0], fa, pa[1]], [pb[0], fb, pb[1]], [pb[0], fb + top, pb[1]], [pa[0], fa + top, pa[1]], color));
      }
    }

    // Step face where this part of a room drops to a lower part of the same room.
    if (s.room) {
      for (const o of spaces) {
        if (o === s || o.room !== s.room || o.floor[0] >= s.floor[0] - 0.02) continue;
        const [lo, hi] = [o.floor[0], s.floor[0]];
        const ox0 = Math.max(x0, o.x[0]), ox1 = Math.min(x1, o.x[1]);
        const oy0 = Math.max(y0, o.y[0]), oy1 = Math.min(y1, o.y[1]);
        if (Math.abs(o.y[0] - y1) < EPS && ox1 > ox0) out.push(box(ox0, ox1, lo, hi, y1 - 0.05, y1 + 0.05, C.floor));
        if (Math.abs(o.y[1] - y0) < EPS && ox1 > ox0) out.push(box(ox0, ox1, lo, hi, y0 - 0.05, y0 + 0.05, C.floor));
        if (Math.abs(o.x[0] - x1) < EPS && oy1 > oy0) out.push(box(x1 - 0.05, x1 + 0.05, lo, hi, oy0, oy1, C.floor));
        if (Math.abs(o.x[1] - x0) < EPS && oy1 > oy0) out.push(box(x0 - 0.05, x0 + 0.05, lo, hi, oy0, oy1, C.floor));
      }
    }

    if (ceiling && !parent) {
      const f = (x, y) => floorAt(s, x, y) + s.height;
      out.push(quad([x0, f(x0, y0), y0], [x1, f(x1, y0), y0], [x1, f(x1, y1), y1], [x0, f(x0, y1), y1], C.wall));
    }

    for (const [px, py] of s.pillars) {
      const h = s.pillarSize / 2;
      const top = ceiling ? s.height : wallH * 1.05;
      out.push(box(px - h, px + h, s.floor[0], s.floor[0] + top, py - h, py + h, s.decoratedPillars ? C.painted : C.pillar));
    }

    const sar = s.sarcophagus;
    if (sar) {
      const f = floorAt(s, sar.x, sar.y);
      const target = sar.state === 'in-situ' ? out : ghost;
      const color = C[sar.material];
      target.push(box(sar.x - sar.w / 2, sar.x + sar.w / 2, f, f + sar.h * 0.88, sar.y - sar.d / 2, sar.y + sar.d / 2, color));
      target.push(box(sar.x - sar.w / 2 - 0.05, sar.x + sar.w / 2 + 0.05, f + sar.h * 0.88, f + sar.h, sar.y - sar.d / 2 - 0.05, sar.y + sar.d / 2 + 0.05, color.clone().multiplyScalar(1.08)));
      if (shrines) {
        // Outermost shrine (Carter no. 207): base 502 × 334 cm, 270.5 cm to the top of the
        // cornice (Griffith Institute, Carter card 207-01). Its batter and roof are not modelled.
        const W = 5.02, D = 3.34, H = 2.705;
        out.push(box(sar.x - W / 2, sar.x + W / 2, f, f + H, sar.y - D / 2, sar.y + D / 2, C.shrine));
      }
    }
  }

  const group = new THREE.Group();
  // Material names are read by the page to switch the evidence colours.
  for (const [status, name] of [['documented', 'Documented architecture'], ['approximate', 'Reconstructed geometry']]) {
    if (!groups[status].length) continue;
    const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9, metalness: 0, side: THREE.DoubleSide });
    mat.name = name;
    const mesh = new THREE.Mesh(mergeGeometries(groups[status]), mat);
    mesh.name = name;
    mesh.castShadow = mesh.receiveShadow = true;
    group.add(mesh);
  }
  if (ghost.length) {
    const mat = GHOST();
    mat.name = 'Uncertain or removed';
    const g = new THREE.Mesh(mergeGeometries(ghost.map((x) => { x.deleteAttribute('color'); return x; })), mat);
    g.name = 'Uncertain or removed';
    group.add(g);
  }
  if (route && plan.route?.length) {
    const mat = new THREE.MeshStandardMaterial({ color: C.route, emissive: C.route, emissiveIntensity: 0.6, transparent: true, opacity: 1, side: THREE.DoubleSide, roughness: 0.5 });
    mat.name = 'Route';
    const r = new THREE.Mesh(ribbon(routePoints(plan, spaces)), mat);
    r.name = 'Route';
    group.add(r);
  }
  return group;
}

// ------------------------------------------------------------ route
// Mirrors routePoints() in src/lib/plans.ts: entrance → doorways → burial chamber.

function doorway(a, b) {
  const E = 0.06;
  if (Math.abs(a.x[1] - b.x[0]) < E || Math.abs(a.x[0] - b.x[1]) < E) {
    const y0 = Math.max(a.y[0], b.y[0]), y1 = Math.min(a.y[1], b.y[1]);
    if (y1 > y0) return [Math.abs(a.x[1] - b.x[0]) < E ? a.x[1] : a.x[0], (y0 + y1) / 2];
  }
  if (Math.abs(a.y[1] - b.y[0]) < E || Math.abs(a.y[0] - b.y[1]) < E) {
    const x0 = Math.max(a.x[0], b.x[0]), x1 = Math.min(a.x[1], b.x[1]);
    if (x1 > x0) return [(x0 + x1) / 2, Math.abs(a.y[1] - b.y[0]) < E ? a.y[1] : a.y[0]];
  }
  return undefined;
}

const PASSAGE = new Set(['stairs', 'corridor', 'gate', 'tunnel']);

/** Where a route enters a space: the edge its floor descends from, or its centre. */
function entry(s) {
  const cx = (s.x[0] + s.x[1]) / 2, cy = (s.y[0] + s.y[1]) / 2;
  return s.descends ? { 'x+': [s.x[0], cy], 'x-': [s.x[1], cy], 'y+': [cx, s.y[0]], 'y-': [cx, s.y[1]] }[s.descends] : [cx, cy];
}

export function routePoints(plan, spaces) {
  const byId = new Map(spaces.map((s) => [s.id, s]));
  const list = plan.route.map((id) => byId.get(id)).filter(Boolean);
  const pts = [];
  let prev;
  list.forEach((s, i) => {
    const cx = (s.x[0] + s.x[1]) / 2, cy = (s.y[0] + s.y[1]) / 2;
    if (i === 0) {
      const start = s.descends ? { 'x+': [s.x[0], cy], 'x-': [s.x[1], cy], 'y+': [cx, s.y[0]], 'y-': [cx, s.y[1]] }[s.descends] : [cx, cy];
      pts.push([...start, floorAt(s, ...start)]);
      prev = start;
    }
    const next = list[i + 1];
    if (!next) return pts.push([cx, cy, floorAt(s, cx, cy)]);
    const d = doorway(s, next) ?? (next.within === s.id ? entry(next) : undefined);
    if (d) {
      const exitOnSide = Math.abs(d[0] - s.x[0]) < 0.07 || Math.abs(d[0] - s.x[1]) < 0.07;
      if (prev && !PASSAGE.has(s.kind)) {
        const corner = exitOnSide ? [prev[0], d[1]] : [d[0], prev[1]];
        if (Math.hypot(corner[0] - prev[0], corner[1] - prev[1]) > 0.1) pts.push([...corner, floorAt(s, ...corner)]);
      }
      pts.push([d[0], d[1], Math.min(floorAt(s, ...d), floorAt(next, ...d))]);
      prev = d;
    }
  });
  return pts;
}

/** Flat ribbon 0.45 m wide, floating above the floor (and stair nosings) along the route. */
function ribbon(pts, width = 0.45, lift = 0.42) {
  const parts = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const [ax, ay, af] = pts[i], [bx, by, bf] = pts[i + 1];
    const len = Math.hypot(bx - ax, by - ay) || 1;
    const nx = (-(by - ay) / len) * width / 2, ny = ((bx - ax) / len) * width / 2;
    parts.push(quad([ax - nx, af + lift, ay - ny], [bx - nx, bf + lift, by - ny], [bx + nx, bf + lift, by + ny], [ax + nx, af + lift, ay + ny], C.route));
  }
  return mergeGeometries(parts.map((g) => { g.deleteAttribute('color'); return g; }));
}
