/**
 * Schematic north–south section of the Great Pyramid (looking west), drawn to
 * scale from published measurements (Lehner, The Complete Pyramids; Maragioglio
 * & Rinaldi). Writes an SVG into src/assets/media.
 *
 *   node scripts/render/cross-section.mjs
 */
import { writeFile } from 'node:fs/promises';

const S = 2.6; // px per metre
const W = 900, H = 600, OX = 470, OY = 450; // origin: centre of the base
const X = (m) => (OX + m * S).toFixed(1);
const Y = (m) => (OY - m * S).toFixed(1);
const pt = ([x, y]) => `${X(x)},${Y(y)}`;
const line = (pts, cls) => `<polyline class="${cls}" points="${pts.map(pt).join(' ')}"/>`;
const rect = (x0, y0, x1, y1, cls = 'room') => `<polygon class="${cls}" points="${[[x0, y0], [x1, y0], [x1, y1], [x0, y1]].map(pt).join(' ')}"/>`;
const deg = (d) => (d * Math.PI) / 180;
const along = ([x, y], a, l) => [x + Math.cos(deg(a)) * l, y + Math.sin(deg(a)) * l];

const half = 115.15, height = 146.6, today = 138.5;
const entrance = [-half + 17 * (half / height), 17];
const descEnd = along(entrance, -26.5, 105);
const subterranean = [[descEnd[0], descEnd[1]], [descEnd[0] + 9, descEnd[1]]];
const junction = along(entrance, -26.5, 28);
const galleryFoot = along(junction, 26, 39);
const galleryTop = along(galleryFoot, 26, 46.7);
const kingFloor = galleryTop[1];

const labels = [];
/** Leader from a point in metres to a label position in pixels. */
const label = (text, at, [px, py], anchor = 'start') => {
  const lx = anchor === 'start' ? px - 4 : px + 4;
  labels.push(`<line class="leader" x1="${X(at[0])}" y1="${Y(at[1])}" x2="${lx}" y2="${py - 4}"/>`);
  labels.push(`<text x="${px}" y="${py}" text-anchor="${anchor}">${text}</text>`);
};
label('Entrance', entrance, [150, 332], 'end');
label('Descending Passage', along(entrance, -26.5, 60), [150, 432], 'end');
label('Ascending Passage', along(junction, 26, 20), [150, 392], 'end');
label('Grand Gallery', along(galleryFoot, 26, 22), [150, 250], 'end');
label("Queen's Chamber", [0, galleryFoot[1] + 3], [150, 290], 'end');
label('Subterranean Chamber', [descEnd[0] + 9, descEnd[1] + 1], [560, 540]);
label("King's Chamber", [8.2, kingFloor + 3], [700, 300]);
label('Relieving chambers', [8.2, kingFloor + 14], [700, 262]);
label('Original summit, 146.6 m', [0, height], [540, 70]);
label('Present summit, 138.5 m', [0, today], [540, 104]);

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-labelledby="t d">
<title id="t">Section through the Great Pyramid of Giza</title>
<desc id="d">Schematic north–south section showing the entrance, descending and ascending passages, subterranean chamber, Queen's Chamber, Grand Gallery, King's Chamber and relieving chambers.</desc>
<style>
  .bg { fill: #14120e; }
  .rock { fill: #1d1912; }
  .body { fill: #3a2f20; stroke: #c8952b; stroke-width: 1.5; }
  .casing { fill: none; stroke: #d8cba8; stroke-width: 1; stroke-dasharray: 5 4; }
  .core { fill: #4a3b27; }
  .pass { fill: none; stroke: #e2b453; stroke-width: 3; stroke-linecap: round; }
  .shaft { fill: none; stroke: #2e8b84; stroke-width: 1.4; }
  .blocked { stroke-dasharray: 3 3; }
  .room { fill: #e2b453; }
  .gallery { fill: #e2b453; opacity: 0.85; }
  .leader { stroke: #a89c80; stroke-width: 0.8; }
  text { fill: #e9e0c9; font: 13px Georgia, 'Times New Roman', serif; letter-spacing: 0.02em; }
  .title { font-size: 20px; fill: #d8cba8; letter-spacing: 0.12em; }
  .note { font-size: 11px; fill: #a89c80; }
  .ground { stroke: #7a6f58; stroke-width: 1; }
</style>
<rect class="bg" width="${W}" height="${H}"/>
<rect class="rock" x="0" y="${OY}" width="${W}" height="${H - OY}"/>
<line class="ground" x1="0" y1="${OY}" x2="${W}" y2="${OY}"/>
<polygon class="core" points="${pt([-half, 0])} ${pt([-half * (1 - today / height), today])} ${pt([half * (1 - today / height), today])} ${pt([half, 0])}"/>
<polygon class="casing" points="${pt([-half, 0])} ${pt([0, height])} ${pt([half, 0])}"/>
${line([entrance, descEnd, [descEnd[0] + 9, descEnd[1]]], 'pass')}
${rect(subterranean[0][0], descEnd[1] - 1, subterranean[1][0] + 5, descEnd[1] + 4)}
${line([junction, galleryFoot], 'pass')}
${line([galleryFoot, [0, galleryFoot[1]]], 'pass')}
${rect(-2.6, galleryFoot[1], 2.6, galleryFoot[1] + 4.7)}
<polygon class="room" points="${pt([-2.6, galleryFoot[1] + 4.7])} ${pt([0, galleryFoot[1] + 6.2])} ${pt([2.6, galleryFoot[1] + 4.7])}"/>
<polygon class="gallery" points="${pt(galleryFoot)} ${pt(galleryTop)} ${pt([galleryTop[0], galleryTop[1] + 8.6])} ${pt([galleryFoot[0], galleryFoot[1] + 8.6])}"/>
${line([galleryTop, [3, kingFloor]], 'pass')}
${rect(3, kingFloor, 8.2, kingFloor + 5.8)}
${[1, 2, 3, 4].map((i) => rect(3, kingFloor + 5.8 + i * 2.4, 8.2, kingFloor + 5.8 + i * 2.4 + 1.2, 'room')).join('')}
<polygon class="room" points="${pt([2.5, kingFloor + 17.5])} ${pt([5.6, kingFloor + 20.5])} ${pt([8.7, kingFloor + 17.5])}"/>
${line([[3, kingFloor + 1], along([3, kingFloor + 1], 180 - 32.6, 71)], 'shaft')}
${line([[8.2, kingFloor + 1], along([8.2, kingFloor + 1], 45, 67)], 'shaft')}
${line([[-2.6, galleryFoot[1] + 1], along([-2.6, galleryFoot[1] + 1], 180 - 39, 60)], 'shaft blocked')}
${line([[2.6, galleryFoot[1] + 1], along([2.6, galleryFoot[1] + 1], 39.5, 60)], 'shaft blocked')}
${labels.join('\n')}
<text class="title" x="28" y="40">THE GREAT PYRAMID · SECTION</text>
<text class="note" x="28" y="62">North ← → South · looking west · schematic, approximately to scale</text>
<text class="note" x="28" y="${H - 16}">Dashed outline: lost limestone casing. Teal lines: shafts (dotted where blocked).</text>
<text class="note" x="${W - 28}" y="${H - 16}" text-anchor="end">NeoKemetAI · after Lehner, The Complete Pyramids</text>
</svg>`;

await writeFile(new URL('../../src/assets/media/monuments/great-pyramid-of-giza/cross-section.svg', import.meta.url), svg);
console.log('cross-section.svg written');
