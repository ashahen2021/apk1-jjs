/**
 * Builds src/data/geo/egypt.json for the <EgyptMap> component from Natural Earth
 * (public domain, https://www.naturalearthdata.com), clipped to Egypt and Nubia
 * and simplified. Modern features (Lake Nasser, the Suez Canal) are left out so
 * the map shows the ancient landscape.
 *
 *   node scripts/build-map-data.mjs
 */
import { writeFile } from 'node:fs/promises';

const SOURCE = 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson';
// Wider than the default view so land continues past the frame edges.
const BBOX = { west: 24, east: 39, south: 18.5, north: 34 };
const TOLERANCE = 0.006; // degrees, Douglas–Peucker
const RIVERS = new Set(['Nile', 'Rosetta Branch', 'Damietta Branch']);

const load = async (name) => (await fetch(`${SOURCE}/${name}.geojson`)).json();
const round = ([x, y]) => [Math.round(x * 1000) / 1000, Math.round(y * 1000) / 1000];

function simplify(points, tol) {
  if (points.length < 3) return points;
  const [a, b] = [points[0], points.at(-1)];
  let max = 0, index = 0;
  for (let i = 1; i < points.length - 1; i++) {
    const [x, y] = points[i];
    const dx = b[0] - a[0], dy = b[1] - a[1];
    const d = Math.abs(dy * x - dx * y + b[0] * a[1] - b[1] * a[0]) / (Math.hypot(dx, dy) || 1);
    if (d > max) { max = d; index = i; }
  }
  if (max <= tol) return [a, b];
  return [...simplify(points.slice(0, index + 1), tol).slice(0, -1), ...simplify(points.slice(index), tol)];
}

/** Sutherland–Hodgman polygon clipping against the bounding box. */
function clipRing(ring) {
  const edges = [
    [(p) => p[0] >= BBOX.west, (p, q) => lerpX(p, q, BBOX.west)],
    [(p) => p[0] <= BBOX.east, (p, q) => lerpX(p, q, BBOX.east)],
    [(p) => p[1] >= BBOX.south, (p, q) => lerpY(p, q, BBOX.south)],
    [(p) => p[1] <= BBOX.north, (p, q) => lerpY(p, q, BBOX.north)],
  ];
  let out = ring;
  for (const [inside, cut] of edges) {
    const input = out;
    out = [];
    for (let i = 0; i < input.length; i++) {
      const cur = input[i], prev = input[(i + input.length - 1) % input.length];
      if (inside(cur)) {
        if (!inside(prev)) out.push(cut(prev, cur));
        out.push(cur);
      } else if (inside(prev)) out.push(cut(prev, cur));
    }
    if (!out.length) break;
  }
  return out;
}
const lerpX = (p, q, x) => [x, p[1] + ((q[1] - p[1]) * (x - p[0])) / (q[0] - p[0])];
const lerpY = (p, q, y) => [p[0] + ((q[0] - p[0]) * (y - p[1])) / (q[1] - p[1]), y];
const inBox = ([x, y]) => x >= BBOX.west && x <= BBOX.east && y >= BBOX.south && y <= BBOX.north;

const land = [];
for (const f of (await load('ne_10m_land')).features) {
  const polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates;
  for (const poly of polys) {
    const ring = clipRing(poly[0]);
    if (ring.length > 2) land.push(simplify(ring, TOLERANCE).map(round));
  }
}

const rivers = [];
for (const f of (await load('ne_10m_rivers_lake_centerlines')).features) {
  if (!RIVERS.has(f.properties.name)) continue;
  const lines = f.geometry.type === 'LineString' ? [f.geometry.coordinates] : f.geometry.coordinates;
  for (const line of lines) {
    const kept = line.filter(inBox);
    if (kept.length > 1) rivers.push({ name: f.properties.name, points: simplify(kept, TOLERANCE / 8).map(round) });
  }
}

await writeFile(
  new URL('../src/data/geo/egypt.json', import.meta.url),
  JSON.stringify({ source: 'Natural Earth 1:10m (public domain)', bbox: BBOX, land, rivers }),
);
console.log(`land rings: ${land.length}, river lines: ${rivers.length}`);
