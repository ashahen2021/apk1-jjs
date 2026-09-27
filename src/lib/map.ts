import geo from '@/data/geo/egypt.json';

/** Equirectangular projection scaled for Egypt's mid latitude (~26.6°N). */
export const K = 100;
const KX = K * Math.cos((26.6 * Math.PI) / 180);
/** Default framing (the data itself extends further so coasts run past the edges). */
export const BBOX = { west: 28, east: 35.5, south: 21, north: 32.2 };

export const project = (lat: number, lon: number): [number, number] => [
  Math.round((lon - BBOX.west) * KX * 100) / 100,
  Math.round((BBOX.north - lat) * K * 100) / 100,
];

export const WIDTH = project(BBOX.south, BBOX.east)[0];
export const HEIGHT = project(BBOX.south, BBOX.east)[1];
/** Full extent of the geodata, for background layers. */
export const EXTENT = { min: project(geo.bbox.north, geo.bbox.west), max: project(geo.bbox.south, geo.bbox.east) };

export interface View { id: string; label: string; north: number; south: number; west: number; east: number }

/** Named zoom levels; the viewBox is fitted to these bounds. */
export const VIEWS: View[] = [
  { id: 'egypt', label: 'All Egypt', north: BBOX.north, south: BBOX.south, west: BBOX.west, east: BBOX.east },
  { id: 'delta', label: 'Delta', north: 31.7, south: 29.6, west: 29.9, east: 32.4 },
  { id: 'memphis', label: 'Memphis & Giza', north: 30.08, south: 29.72, west: 31.0, east: 31.42 },
  { id: 'thebes', label: 'Thebes', north: 25.84, south: 25.6, west: 32.5, east: 32.76 },
  { id: 'nubia', label: 'Nubia', north: 24.4, south: 21.2, west: 30.4, east: 33.4 },
];

export function viewBox(v: View): [number, number, number, number] {
  const [x0, y0] = project(v.north, v.west);
  const [x1, y1] = project(v.south, v.east);
  return [x0, y0, x1 - x0, y1 - y0];
}

/** Smallest named view (after "All Egypt") that contains a point. */
export function viewFor(lat: number, lon: number): View {
  const inside = VIEWS.slice(1).filter((v) => lat <= v.north && lat >= v.south && lon >= v.west && lon <= v.east);
  return inside.sort((a, b) => (a.north - a.south) - (b.north - b.south))[0] ?? VIEWS[0];
}

const path = (points: number[][], close: boolean) =>
  points.map(([lon, lat], i) => `${i ? 'L' : 'M'}${project(lat, lon).join(',')}`).join('') + (close ? 'Z' : '');

export const LAND_PATH = geo.land.map((ring) => path(ring, true)).join('');
export const RIVERS = geo.rivers.map((r) => ({ name: r.name, d: path(r.points, false) }));
export const MAP_SOURCE = geo.source;
