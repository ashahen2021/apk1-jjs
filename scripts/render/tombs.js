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
  dado: new THREE.Color(0x5b2d1f),
  painted: new THREE.Color(0xd9b04f),
  frieze: new THREE.Color(0x2c5876),
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
    // Narrow passages open fully; rooms get a doorway of at most 1.4 m.
    const width = b - a <= 2.8 ? b - a : 1.4;
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
export function buildTomb(plan, { cut = 0.55, ceiling = false, shrines = false, material } = {}) {
  const solid = [];
  const ghost = [];
  // Same defaults as the content schema (raw YAML does not have them).
  const spaces = plan.spaces.map((s) => ({ decorated: [], pillars: [], pillarSize: 1.1, decoratedPillars: false, ...s }));

  for (const s of spaces) {
    const out = s.status === 'uncertain' ? ghost : solid;
    const [x0, x1] = s.x, [y0, y1] = s.y;
    const wallH = s.height * cut;

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
    } else {
      out.push(box(x0, x1, s.floor[0] - 0.3, s.floor[0], y0, y1, C.floor));
    }

    // Walls, split into dado / painted field / frieze where decorated.
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
        const bands = decorated
          ? [[0, 0.16, C.dado], [0.16, 0.86, C.painted], [0.86, 1, C.frieze]]
          : [[0, 1, C.wall]];
        const top = ceiling ? s.height : wallH;
        for (const [b0, b1, color] of bands) {
          out.push(quad([pa[0], fa + top * b0, pa[1]], [pb[0], fb + top * b0, pb[1]], [pb[0], fb + top * b1, pb[1]], [pa[0], fa + top * b1, pa[1]], color));
        }
      }
    }

    if (ceiling) {
      const f = (x, y) => floorAt(s, x, y) + s.height;
      out.push(quad([x0, f(x0, y0), y0], [x1, f(x1, y0), y0], [x1, f(x1, y1), y1], [x0, f(x0, y1), y1], s.kind === 'crypt' ? new THREE.Color(0x1c2a48) : C.wall));
    }

    for (const [px, py] of s.pillars) {
      const h = s.pillarSize / 2;
      const top = ceiling ? s.height : wallH * 1.05;
      out.push(box(px - h, px + h, s.floor[0], s.floor[0] + top, py - h, py + h, s.decoratedPillars ? C.painted : C.pillar));
    }

    const sar = s.sarcophagus;
    if (sar) {
      const f = floorAt(s, sar.x, sar.y);
      const target = sar.state === 'in-situ' ? solid : ghost;
      const color = C[sar.material];
      target.push(box(sar.x - sar.w / 2, sar.x + sar.w / 2, f, f + sar.h * 0.88, sar.y - sar.d / 2, sar.y + sar.d / 2, color));
      target.push(box(sar.x - sar.w / 2 - 0.05, sar.x + sar.w / 2 + 0.05, f + sar.h * 0.88, f + sar.h, sar.y - sar.d / 2 - 0.05, sar.y + sar.d / 2 + 0.05, color.clone().multiplyScalar(1.08)));
      if (shrines) {
        // Outermost of the four gilded shrines: about 5.1 × 3.3 × 2.75 m.
        const W = 5.08, D = 3.28, H = 2.75;
        solid.push(box(sar.x - W / 2, sar.x + W / 2, f, f + H, sar.y - D / 2, sar.y + D / 2, C.shrine));
      }
    }
  }

  const group = new THREE.Group();
  const solidMat = material ?? new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9, metalness: 0, side: THREE.DoubleSide });
  const mesh = new THREE.Mesh(mergeGeometries(solid), solidMat);
  mesh.name = 'Tomb';
  mesh.castShadow = mesh.receiveShadow = true;
  group.add(mesh);
  if (ghost.length) {
    const g = new THREE.Mesh(mergeGeometries(ghost.map((x) => { x.deleteAttribute('color'); return x; })), GHOST());
    g.name = 'Uncertain or removed';
    group.add(g);
  }
  return group;
}
