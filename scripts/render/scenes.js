/**
 * Procedural reconstructions rendered with three.js in headless Chromium.
 * Every scene is built from published dimensions (metres) so images are
 * illustrative but proportionally faithful. Run via scripts/render/render.mjs.
 *
 * Axes: x = east, y = up, z = south (so -z points north).
 */
import * as THREE from 'three';
import { Sky } from 'three/addons/objects/Sky.js';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// ---------------------------------------------------------------- utilities

function rng(seed) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function valueNoise(seed) {
  const r = rng(seed);
  const perm = Array.from({ length: 512 }, () => r());
  const h = (x, y) => perm[((x * 73856093) ^ (y * 19349663)) & 511];
  const s = (t) => t * t * (3 - 2 * t);
  const noise = (x, y) => {
    const xi = Math.floor(x), yi = Math.floor(y);
    const xf = s(x - xi), yf = s(y - yi);
    const a = h(xi, yi), b = h(xi + 1, yi), c = h(xi, yi + 1), d = h(xi + 1, yi + 1);
    return a + (b - a) * xf + (c - a) * yf + (a - b - c + d) * xf * yf;
  };
  return (x, y, octaves = 4) => {
    let sum = 0, amp = 0.5, f = 1;
    for (let i = 0; i < octaves; i++) {
      sum += amp * noise(x * f, y * f);
      amp *= 0.5;
      f *= 2;
    }
    return sum;
  };
}

/** Stone material with world-space block pattern, joints and grain. */
function stone({ color, block = [1.4, 1.1, 1.4], variation = 0.16, grain = 0.1, joints = 0.22, roughness = 0.92, vertexColors = false }) {
  const m = new THREE.MeshStandardMaterial({ color, roughness, metalness: 0, vertexColors });
  m.onBeforeCompile = (shader) => {
    shader.uniforms.uBlock = { value: new THREE.Vector3(...block) };
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vWPos;')
      .replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvWPos = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
        varying vec3 vWPos;
        uniform vec3 uBlock;
        float h3(vec3 p) { return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }`,
      )
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
        vec3 bp = vWPos / uBlock;
        float course = floor(bp.y);
        bp.x += mod(course, 2.0) * 0.5; bp.z += mod(course, 2.0) * 0.5;
        vec3 cell = floor(bp);
        vec3 f = fract(bp);
        float blockTone = h3(cell) - 0.5;
        float fine = h3(floor(vWPos * 9.0)) - 0.5;
        float ex = min(f.x, 1.0 - f.x), ez = min(f.z, 1.0 - f.z), ey = min(f.y, 1.0 - f.y);
        float joint = 1.0 - smoothstep(0.0, 0.035, min(ey, max(ex, ez)));
        diffuseColor.rgb *= 1.0 + blockTone * ${variation.toFixed(3)} + fine * ${grain.toFixed(3)};
        diffuseColor.rgb *= 1.0 - joint * ${joints.toFixed(3)};`,
      );
  };
  return m;
}

function sandMaterial() {
  const m = new THREE.MeshStandardMaterial({ color: 0xe0b983, roughness: 1 });
  m.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vWPos;')
      .replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvWPos = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
        varying vec3 vWPos;
        float h2(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
        float n2(vec2 p) { vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
          return mix(mix(h2(i), h2(i+vec2(1,0)), f.x), mix(h2(i+vec2(0,1)), h2(i+vec2(1,1)), f.x), f.y); }`,
      )
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
        vec2 p = vWPos.xz;
        float big = n2(p / 180.0) * 0.6 + n2(p / 45.0) * 0.4;
        float ripple = sin(p.x * 0.9 + n2(p / 6.0) * 6.0) * 0.5 + 0.5;
        float speck = h2(floor(p * 4.0));
        diffuseColor.rgb *= 0.86 + big * 0.22 + ripple * 0.04 + (speck - 0.5) * 0.08;
        diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * vec3(0.93, 0.9, 0.86), smoothstep(0.55, 0.8, n2(p / 90.0 + 7.0)));`,
      );
  };
  return m;
}

// ---------------------------------------------------------------- geometry

/** Square frustum with flat normals: base size (w,d) at y0 to top size at y1. */
function frustum(w0, d0, w1, d1, y0, y1) {
  const g = new THREE.BufferGeometry();
  const b = [[-w0 / 2, y0, -d0 / 2], [w0 / 2, y0, -d0 / 2], [w0 / 2, y0, d0 / 2], [-w0 / 2, y0, d0 / 2]];
  const t = [[-w1 / 2, y1, -d1 / 2], [w1 / 2, y1, -d1 / 2], [w1 / 2, y1, d1 / 2], [-w1 / 2, y1, d1 / 2]];
  const tris = [];
  for (let i = 0; i < 4; i++) {
    const j = (i + 1) % 4;
    tris.push(b[i], t[j], b[j], b[i], t[i], t[j]);
  }
  if (w1 > 0.001) tris.push(t[0], t[2], t[1], t[0], t[3], t[2]);
  tris.push(b[0], b[1], b[2], b[0], b[2], b[3]);
  g.setAttribute('position', new THREE.Float32BufferAttribute(tris.flat(), 3));
  g.computeVertexNormals();
  return g;
}

function tint(g, c) {
  const n = g.attributes.position.count;
  const col = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) col.set([c.r, c.g, c.b], i * 3);
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return g;
}

/** Stepped core: courses of `course` metres following the pyramid slope, up to `upTo`. */
function steppedCore({ base, depth = base, height, upTo = height, course = 1.5, from = 0, seed = 1, color = new THREE.Color(0xb89c72), jitter = 0.08 }) {
  const r = rng(seed);
  const parts = [];
  for (let y = from; y < upTo - 0.01; y += course) {
    const k = 1 - y / height;
    const top = Math.min(y + course, upTo);
    const c = color.clone().multiplyScalar(1 + (r() - 0.5) * jitter);
    parts.push(tint(frustum(base * k, depth * k, base * k, depth * k, y, top), c));
  }
  return mergeGeometries(parts);
}

function smoothPyramid({ base, depth = base, height, from = 0, to = height, color = new THREE.Color(0xe7dcc2) }) {
  const k0 = 1 - from / height, k1 = 1 - to / height;
  return tint(frustum(base * k0, depth * k0, base * k1, depth * k1, from, to), color);
}

// ---------------------------------------------------------------- scene kit

function makeRenderer(w, h, { alpha = false } = {}) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true, alpha });
  renderer.setPixelRatio(1);
  renderer.setSize(w, h);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  document.body.replaceChildren(renderer.domElement);
  return renderer;
}

function desert(scene, { elevation, azimuth, exposure = 0.45, haze = 0xd9b98c, fog = 0.00016, extent = 1400, center = [0, 0] }) {
  const sky = new Sky();
  sky.scale.setScalar(20000);
  const u = sky.material.uniforms;
  u.turbidity.value = 10;
  u.rayleigh.value = 2.6;
  u.mieCoefficient.value = 0.006;
  u.mieDirectionalG.value = 0.82;
  const sun = new THREE.Vector3().setFromSphericalCoords(1, THREE.MathUtils.degToRad(90 - elevation), THREE.MathUtils.degToRad(azimuth));
  u.sunPosition.value.copy(sun);
  scene.add(sky);
  scene.fog = new THREE.FogExp2(haze, fog);

  const light = new THREE.DirectionalLight(0xffcf98, 4.2);
  light.position.copy(sun).multiplyScalar(3000).add(new THREE.Vector3(center[0], 0, center[1]));
  light.target.position.set(center[0], 0, center[1]);
  light.castShadow = true;
  light.shadow.mapSize.set(4096, 4096);
  Object.assign(light.shadow.camera, { left: -extent, right: extent, top: extent, bottom: -extent, near: 1, far: 8000 });
  light.shadow.bias = -0.0004;
  light.shadow.normalBias = 0.6;
  scene.add(light, light.target);
  scene.add(new THREE.HemisphereLight(0x9fb4d8, 0xb08a5a, 0.9));

  const terrainNoise = valueNoise(11);
  const ground = new THREE.PlaneGeometry(16000, 16000, 320, 320);
  ground.rotateX(-Math.PI / 2);
  const pos = ground.attributes.position;
  const heightAt = (x, z) => {
    const d = Math.hypot(x - center[0], z - center[1]);
    const far = THREE.MathUtils.smoothstep(d, 1300, 3500);
    const near = THREE.MathUtils.smoothstep(d, 850, 1500);
    return terrainNoise(x / 700, z / 700) * 70 * far + terrainNoise(x / 160, z / 160, 3) * 22 * near + terrainNoise(x / 120, z / 120) * 1.6 - 1.2;
  };
  for (let i = 0; i < pos.count; i++) pos.setY(i, heightAt(pos.getX(i), pos.getZ(i)));
  ground.computeVertexNormals();
  const mesh = new THREE.Mesh(ground, sandMaterial());
  mesh.receiveShadow = true;
  scene.add(mesh);
  return { exposure, heightAt };
}

function add(scene, geometry, material, [x, z] = [0, 0], rotY = 0) {
  const m = new THREE.Mesh(geometry, material);
  m.position.set(x, 0, z);
  m.rotation.y = rotY;
  m.castShadow = m.receiveShadow = true;
  scene.add(m);
  return m;
}

/** Film grain + vignette, matching the NeoKemet channel look. */
function finish(canvas, { grain = 0.035, vignette = 0.38, warm = 1 } = {}) {
  const out = document.createElement('canvas');
  out.width = canvas.width;
  out.height = canvas.height;
  const ctx = out.getContext('2d');
  ctx.drawImage(canvas, 0, 0);
  const img = ctx.getImageData(0, 0, out.width, out.height);
  const r = rng(99);
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (r() - 0.5) * 255 * grain;
    // Gentle warm grade: lift reds in the highlights, cool the shadows slightly.
    const l = (img.data[i] + img.data[i + 1] + img.data[i + 2]) / 765;
    img.data[i] += n + warm * 18 * l;
    img.data[i + 1] += n + warm * 6 * l;
    img.data[i + 2] += n - warm * 10 * l + warm * 6 * (1 - l);
  }
  ctx.putImageData(img, 0, 0);
  const g = ctx.createRadialGradient(out.width / 2, out.height / 2, out.height * 0.35, out.width / 2, out.height / 2, out.width * 0.75);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, `rgba(8,6,3,${vignette})`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, out.width, out.height);
  return out.toDataURL('image/jpeg', 0.9);
}

// ---------------------------------------------------------------- Giza

const GIZA = {
  // Offsets from Khufu in metres, derived from site coordinates.
  khufu: { at: [0, 0], base: 230.3, height: 146.6, today: 138.5 },
  khafre: { at: [-328, 344], base: 215.3, height: 143.5, today: 136.4 },
  menkaure: { at: [-589, 743], base: 103.4, height: 65.5, today: 61 },
  queensKhufu: [[165, -60], [165, 0], [165, 55]],
  queensMenkaure: [[-470, 860], [-540, 860], [-610, 860]],
};

function gizaScene(scene, state) {
  const built = state === 'built';
  const core = stone({ color: 0xffffff, vertexColors: true, block: [1.6, 1.5, 1.6], variation: 0.2, joints: 0.28 });
  const casing = stone({ color: 0xffffff, vertexColors: true, block: [2.2, 1.5, 2.2], variation: 0.05, grain: 0.05, joints: 0.05, roughness: 0.7 });
  const limestone = new THREE.Color(0xeee4cc);
  const cap = new THREE.Color(0xe9dfc8);

  const { khufu, khafre, menkaure } = GIZA;
  if (built) {
    add(scene, smoothPyramid({ base: khufu.base, height: khufu.height, to: khufu.height - 1.6, color: limestone }), casing, khufu.at);
    add(scene, smoothPyramid({ base: khufu.base, height: khufu.height, from: khufu.height - 1.6, color: cap }), casing, khufu.at);
    add(scene, smoothPyramid({ base: khafre.base, height: khafre.height, color: limestone }), casing, khafre.at);
    add(scene, smoothPyramid({ base: menkaure.base, depth: 101.8, height: menkaure.height, to: 14, color: new THREE.Color(0x9a4e3c) }), casing, menkaure.at);
    add(scene, smoothPyramid({ base: menkaure.base, depth: 101.8, height: menkaure.height, from: 14, color: limestone }), casing, menkaure.at);
  } else {
    add(scene, steppedCore({ base: khufu.base, height: khufu.height, upTo: khufu.today, seed: 2 }), core, khufu.at);
    add(scene, steppedCore({ base: khafre.base, height: khafre.height, upTo: 112, seed: 3 }), core, khafre.at);
    // Khafre keeps part of its original casing near the summit.
    add(scene, smoothPyramid({ base: khafre.base, height: khafre.height, from: 112, to: khafre.today, color: new THREE.Color(0xcdbb99) }), casing, khafre.at);
    add(scene, steppedCore({ base: menkaure.base, depth: 101.8, height: menkaure.height, from: 6, upTo: menkaure.today, seed: 4, color: new THREE.Color(0xb39570) }), core, menkaure.at);
    add(scene, smoothPyramid({ base: menkaure.base, depth: 101.8, height: menkaure.height, to: 6, color: new THREE.Color(0x7d4a3c) }), core, menkaure.at);
  }
  for (const [i, at] of [...GIZA.queensKhufu, ...GIZA.queensMenkaure].entries()) {
    const small = i < 3 ? { base: 46, height: 30 } : { base: 36, height: 22 };
    const g = built
      ? smoothPyramid({ ...small, color: limestone })
      : steppedCore({ ...small, upTo: small.height * 0.8, course: 1.2, seed: 20 + i });
    add(scene, g, built ? casing : core, at);
  }
}

function gizaView(state, { w = 2400, h = 1350 } = {}) {
  const renderer = makeRenderer(w, h);
  const scene = new THREE.Scene();
  const { exposure, heightAt } = desert(scene, { elevation: 8, azimuth: 300, center: [-300, 350], extent: 1300 });
  renderer.toneMappingExposure = exposure;
  gizaScene(scene, state);
  const camera = new THREE.PerspectiveCamera(26, w / h, 1, 20000);
  camera.position.set(-760, heightAt(-760, 1640) + 9, 1640);
  camera.lookAt(-300, 108, 280);
  renderer.render(scene, camera);
  return finish(renderer.domElement);
}

function gizaCore({ w = 1800, h = 1200 } = {}) {
  const renderer = makeRenderer(w, h);
  const scene = new THREE.Scene();
  const { exposure } = desert(scene, { elevation: 16, azimuth: 300, center: [0, 0], extent: 600 });
  renderer.toneMappingExposure = exposure;
  gizaScene(scene, 'today');
  const camera = new THREE.PerspectiveCamera(42, w / h, 0.5, 20000);
  camera.position.set(-150, 2, 150);
  camera.lookAt(-20, 60, 60);
  renderer.render(scene, camera);
  return finish(renderer.domElement);
}

/** Cylindrical 360° panorama stitched from narrow slices. */
function gizaPanorama({ slices = 144, sliceW = 40, vfov = 64 } = {}) {
  const hfov = 360 / slices;
  const aspect = Math.tan(THREE.MathUtils.degToRad(hfov / 2)) / Math.tan(THREE.MathUtils.degToRad(vfov / 2));
  const h = Math.round(sliceW / aspect);
  const renderer = makeRenderer(sliceW, h);
  const scene = new THREE.Scene();
  const { exposure } = desert(scene, { elevation: 11, azimuth: 300, center: [-200, 250], extent: 1200 });
  renderer.toneMappingExposure = exposure;
  gizaScene(scene, 'today');
  const camera = new THREE.PerspectiveCamera(vfov, sliceW / h, 0.5, 20000);
  camera.position.set(-260, 1.7, -120);
  const out = document.createElement('canvas');
  out.width = sliceW * slices;
  out.height = h;
  const ctx = out.getContext('2d');
  for (let i = 0; i < slices; i++) {
    // Start facing north, turning clockwise (east).
    const yaw = -THREE.MathUtils.degToRad(i * hfov + hfov / 2);
    camera.rotation.set(THREE.MathUtils.degToRad(9), yaw, 0, 'YXZ');
    renderer.render(scene, camera);
    ctx.drawImage(renderer.domElement, i * sliceW, 0);
  }
  return finish(out, { vignette: 0 });
}

// ---------------------------------------------------------------- Saqqara

function stepPyramidGeometry(seed = 5) {
  const r = rng(seed);
  const tiers = [11.5, 11, 10.6, 10.2, 9.8, 9.4];
  const batter = 0.29; // horizontal inset per metre of height (~74°)
  const ledge = 5.2;
  let w = 121, d = 109, y = 0;
  const parts = [];
  for (const th of tiers) {
    for (let cy = 0; cy < th - 0.01; cy += 1.2) {
      const step = Math.min(1.2, th - cy);
      const w0 = w - 2 * batter * cy, d0 = d - 2 * batter * cy;
      const w1 = w - 2 * batter * (cy + step), d1 = d - 2 * batter * (cy + step);
      const tone = new THREE.Color(0xc2a77f).multiplyScalar(1 + (r() - 0.5) * 0.14);
      parts.push(tint(frustum(w0, d0, w1, d1, y + cy, y + cy + step), tone));
    }
    y += th;
    w = w - 2 * batter * th - 2 * ledge;
    d = d - 2 * batter * th - 2 * ledge;
  }
  return mergeGeometries(parts);
}

function enclosure(scene, material) {
  // Wall 277 m (E–W) × 545 m (N–S), mostly reduced to rubble; the south-east
  // stretch is shown restored with its panelled bastions.
  const W = 277, D = 545, parts = [];
  const rubble = new THREE.Color(0xb49a74), wall = new THREE.Color(0xd8c6a2);
  const seg = (x, z, sx, sz, hgt, c) => {
    const g = new THREE.BoxGeometry(sx, hgt, sz);
    g.translate(x, hgt / 2, z);
    parts.push(tint(g.toNonIndexed(), c));
  };
  const r = rng(8);
  for (const [x0, z0, x1, z1] of [[-W / 2, -D / 2, W / 2, -D / 2], [W / 2, -D / 2, W / 2, D / 2], [W / 2, D / 2, -W / 2, D / 2], [-W / 2, D / 2, -W / 2, -D / 2]]) {
    const len = Math.hypot(x1 - x0, z1 - z0), n = Math.round(len / 8);
    for (let i = 0; i < n; i++) {
      const t = (i + 0.5) / n;
      const x = x0 + (x1 - x0) * t, z = z0 + (z1 - z0) * t;
      const horizontal = z0 === z1;
      const restored = x > W / 2 - 1 && z > D / 2 - 170;
      const hgt = restored ? 10.5 : 1.5 + r() * 2.5;
      seg(x, z, horizontal ? len / n : 3.5, horizontal ? 3.5 : len / n, hgt, restored ? wall : rubble);
      if (restored && i % 2 === 0) seg(x + 1.4, z, 1.6, 4.2, 10.5, wall.clone().multiplyScalar(1.05));
    }
  }
  add(scene, mergeGeometries(parts), material, [0, 60]);
}

function stepPyramidView({ w = 2400, h = 1350 } = {}) {
  const renderer = makeRenderer(w, h);
  const scene = new THREE.Scene();
  const { exposure } = desert(scene, { elevation: 12, azimuth: 115, center: [0, 0], extent: 450, haze: 0xe0c29a });
  renderer.toneMappingExposure = exposure * 0.95;
  const mat = stone({ color: 0xffffff, vertexColors: true, block: [1.1, 1.2, 1.1], variation: 0.24, joints: 0.3 });
  add(scene, stepPyramidGeometry(), mat);
  enclosure(scene, mat);
  const camera = new THREE.PerspectiveCamera(30, w / h, 1, 20000);
  camera.position.set(380, 12, 150);
  camera.lookAt(0, 40, 0);
  renderer.render(scene, camera);
  return finish(renderer.domElement);
}

/** GLB of the Step Pyramid for <model-viewer>, with vertex colours only (small). */
async function stepPyramidGlb() {
  const scene = new THREE.Scene();
  const mesh = new THREE.Mesh(stepPyramidGeometry(), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, metalness: 0 }));
  mesh.name = 'Step Pyramid of Djoser';
  const plinth = new THREE.Mesh(
    tint(frustum(150, 138, 146, 134, -2, 0), new THREE.Color(0xb89770)),
    new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, metalness: 0 }),
  );
  plinth.name = 'Ground';
  scene.add(mesh, plinth);
  scene.scale.setScalar(0.01); // 1 unit = 100 m keeps AR placement table-sized
  const glb = await new GLTFExporter().parseAsync(scene, { binary: true });
  return arrayBufferToBase64(glb);
}

function modelPoster({ w = 1600, h = 1000 } = {}) {
  const renderer = makeRenderer(w, h, { alpha: true });
  renderer.toneMappingExposure = 1.0;
  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight(0xfff1dc, 0x3a2c1c, 1.6));
  const key = new THREE.DirectionalLight(0xffe0b8, 2.4);
  key.position.set(200, 260, 180);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  Object.assign(key.shadow.camera, { left: -120, right: 120, top: 120, bottom: -120 });
  scene.add(key);
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95 });
  add(scene, stepPyramidGeometry(), mat);
  add(scene, tint(frustum(150, 138, 146, 134, -2, 0), new THREE.Color(0xb89770)), mat);
  const camera = new THREE.PerspectiveCamera(30, w / h, 1, 5000);
  camera.position.set(190, 120, 230);
  camera.lookAt(0, 18, 0);
  renderer.render(scene, camera);
  return renderer.domElement.toDataURL('image/png');
}

// ---------------------------------------------------------------- Pyramidion

/** Face texture: incised decoration of the east face, simplified. */
function pyramidionTexture(size = 2048) {
  const color = document.createElement('canvas');
  const bump = document.createElement('canvas');
  color.width = color.height = bump.width = bump.height = size;
  const c = color.getContext('2d'), b = bump.getContext('2d');
  // Polished dark granite with mineral speckle.
  c.fillStyle = '#2a2927';
  c.fillRect(0, 0, size, size);
  b.fillStyle = '#fff';
  b.fillRect(0, 0, size, size);
  const r = rng(31);
  for (let i = 0; i < 90000; i++) {
    const x = r() * size, y = r() * size, s = r() * 2.6;
    const v = r();
    c.fillStyle = v > 0.93 ? 'rgba(170,165,155,0.55)' : v > 0.7 ? 'rgba(12,12,12,0.6)' : 'rgba(80,78,74,0.35)';
    c.fillRect(x, y, s, s);
  }
  // Quadrant layout: 0 = east face (decorated), 1..3 = other faces.
  const q = size / 2;
  const incise = (draw) => {
    c.save(); b.save();
    c.fillStyle = c.strokeStyle = '#8f8a80';
    b.fillStyle = b.strokeStyle = '#000';
    draw(c); draw(b);
    c.restore(); b.restore();
  };
  const face = (ox, oy, decorated) => {
    const cx = ox + q / 2;
    const Y = (t) => oy + q - t * q; // t: 0 at base edge, 1 at apex
    incise((g) => {
      g.lineWidth = 5;
      for (const t of [0.08, 0.14]) {
        const half = (q / 2) * (1 - t) * 0.92;
        g.beginPath(); g.moveTo(cx - half, Y(t)); g.lineTo(cx + half, Y(t)); g.stroke();
      }
      if (!decorated) {
        for (let i = -3; i <= 3; i++) {
          const x = cx + i * q * 0.075;
          g.beginPath(); g.moveTo(x, Y(0.16)); g.lineTo(x, Y(0.16 + 0.34 * (1 - Math.abs(i) / 4))); g.stroke();
        }
        return;
      }
      // Winged sun disc.
      const sy = Y(0.6), sw = q * 0.36;
      g.beginPath(); g.arc(cx, sy, q * 0.035, 0, Math.PI * 2); g.fill();
      for (const dir of [-1, 1]) {
        for (let k = 0; k < 4; k++) {
          g.beginPath();
          g.moveTo(cx + dir * q * 0.04, sy - q * 0.012 + k * q * 0.012);
          g.quadraticCurveTo(cx + dir * sw * 0.5, sy - q * 0.035 + k * q * 0.012, cx + dir * sw * (0.62 - k * 0.1), sy + k * q * 0.016);
          g.lineWidth = 7 - k;
          g.stroke();
        }
      }
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.font = `${Math.round(q * 0.12)}px "Noto Sans Egyptian Hieroglyphs"`;
      g.fillText('𓂀', cx - q * 0.085, Y(0.44));
      g.save(); g.translate(cx + q * 0.085, Y(0.44)); g.scale(-1, 1); g.fillText('𓂀', 0, 0); g.restore();
      g.font = `${Math.round(q * 0.09)}px "Noto Sans Egyptian Hieroglyphs"`;
      g.fillText('𓄤𓄤𓄤', cx, Y(0.3));
      g.font = `${Math.round(q * 0.05)}px "Noto Sans Egyptian Hieroglyphs"`;
      g.fillText('𓇳', cx, Y(0.22));
    });
  };
  face(0, 0, true);
  face(q, 0, false);
  face(0, q, false);
  face(q, q, false);
  const map = new THREE.CanvasTexture(color);
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = 8;
  return { map, bumpMap: new THREE.CanvasTexture(bump) };
}

function pyramidionGeometry(base = 1.85, height = 1.3) {
  const hw = base / 2;
  const apex = [0, height, 0];
  // Faces: east (+x), south (+z), west (-x), north (-z); each mapped to a quadrant.
  const faces = [
    [[hw, 0, hw], [hw, 0, -hw], [0, 0]],
    [[-hw, 0, hw], [hw, 0, hw], [0.5, 0]],
    [[-hw, 0, -hw], [-hw, 0, hw], [0, 0.5]],
    [[hw, 0, -hw], [-hw, 0, -hw], [0.5, 0.5]],
  ];
  const pos = [], uv = [];
  for (const [a, b, [u0, v0]] of faces) {
    pos.push(...a, ...b, ...apex);
    // Canvas y grows downward and the texture is flipped, so v runs from quadrant bottom.
    uv.push(u0, 1 - v0 - 0.5, u0 + 0.5, 1 - v0 - 0.5, u0 + 0.25, 1 - v0);
  }
  pos.push(-hw, 0, -hw, hw, 0, -hw, hw, 0, hw, -hw, 0, -hw, hw, 0, hw, -hw, 0, hw);
  uv.push(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.computeVertexNormals();
  return g;
}

function museumScene(w, h) {
  const renderer = makeRenderer(w, h);
  renderer.toneMappingExposure = 1.05;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0d0b09);
  const spot = new THREE.SpotLight(0xffe2bd, 60, 12, 0.5, 0.6, 1.6);
  spot.position.set(1.6, 4.2, 2.4);
  spot.castShadow = true;
  spot.shadow.mapSize.set(2048, 2048);
  scene.add(spot);
  const rim = new THREE.DirectionalLight(0x6f8fc4, 1.4);
  rim.position.set(-3, 2, -3);
  scene.add(rim, new THREE.AmbientLight(0x3a3026, 0.6));
  const plinth = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.6, 2.6), new THREE.MeshStandardMaterial({ color: 0x1b1814, roughness: 0.85 }));
  plinth.position.y = -0.3;
  plinth.receiveShadow = true;
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.MeshStandardMaterial({ color: 0x100e0b, roughness: 1 }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.6;
  floor.receiveShadow = true;
  scene.add(plinth, floor);
  const { map, bumpMap } = pyramidionTexture();
  const stoneMesh = new THREE.Mesh(
    pyramidionGeometry(),
    new THREE.MeshStandardMaterial({ map, bumpMap, bumpScale: 2.5, roughness: 0.32, metalness: 0.05 }),
  );
  stoneMesh.castShadow = true;
  scene.add(stoneMesh);
  return { renderer, scene, stoneMesh, spot };
}

function pyramidionView({ w = 1800, h = 1200 } = {}) {
  const { renderer, scene, stoneMesh } = museumScene(w, h);
  stoneMesh.rotation.y = THREE.MathUtils.degToRad(-28);
  const camera = new THREE.PerspectiveCamera(30, w / h, 0.1, 100);
  camera.position.set(3.4, 1.7, 3.0);
  camera.lookAt(0, 0.5, 0);
  renderer.render(scene, camera);
  return finish(renderer.domElement, { vignette: 0.5 });
}

function pyramidionSpin({ frames = 36, size = 900 } = {}) {
  const { renderer, scene, stoneMesh } = museumScene(size, size);
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  camera.position.set(0, 1.9, 5.0);
  camera.lookAt(0, 0.45, 0);
  const out = [];
  for (let i = 0; i < frames; i++) {
    // Frame 0 shows the decorated east face straight on.
    stoneMesh.rotation.y = -Math.PI / 2 - (i / frames) * Math.PI * 2;
    renderer.render(scene, camera);
    out.push(finish(renderer.domElement, { vignette: 0.45, grain: 0.02 }));
  }
  return out;
}

// ---------------------------------------------------------------- export

function arrayBufferToBase64(buf) {
  const bytes = new Uint8Array(buf);
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
}

window.jobs = {
  gizaToday: () => gizaView('today'),
  gizaBuilt: () => gizaView('built'),
  gizaCore,
  gizaPanorama,
  stepPyramidView,
  stepPyramidGlb,
  stepPyramidPoster: modelPoster,
  pyramidionView,
  pyramidionSpin,
};
window.ready = document.fonts.load('64px "Noto Sans Egyptian Hieroglyphs"', '𓂀𓄤𓇳').then(() => true);

export { finish, makeRenderer, arrayBufferToBase64, stone };
