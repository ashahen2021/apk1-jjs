/**
 * Render jobs for the Giza cluster: the Great Pyramid GLB and a poster for each
 * view mode, the schematic plateau GLB and posters, and landscape heroes.
 */
import * as THREE from 'three';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { buildPyramid, buildPlateau, sphinxGeo, PYRAMID_SCALE, PLATEAU_SCALE, PLATEAU } from './pyramid.js';
import { finish, makeRenderer, arrayBufferToBase64, stone, desert, gizaScene, add } from './scenes.js';

/** Parts shown in each view; mirrors PYRAMID_MODES in src/lib/structures.ts. */
const MODES = {
  exterior: ['casing'],
  today: ['today'],
  cutaway: ['section', 'rock', 'outline', 'documented', 'approximate', 'uncertain'],
  chambers: ['outline', 'documented', 'approximate', 'uncertain'],
  'ramp-straight': ['today', 'rampStraight'],
  'ramp-zigzag': ['today', 'rampZigzag'],
  'ramp-spiral': ['today', 'rampSpiral'],
  'ramp-internal': ['outline', 'rampInternal', 'documented'],
};
const CAMERA = {
  exterior: [35, 70], today: [35, 70], cutaway: [80, 72], chambers: [80, 70],
  'ramp-straight': [30, 68], 'ramp-zigzag': [60, 68], 'ramp-spiral': [35, 62], 'ramp-internal': [60, 66],
};

function frame(object, camera, { theta, phi, pad = 1.05 }) {
  const box = new THREE.Box3().setFromObject(object);
  const sphere = box.getBoundingSphere(new THREE.Sphere());
  const t = THREE.MathUtils.degToRad(theta), p = THREE.MathUtils.degToRad(phi);
  const r = (sphere.radius * pad) / Math.sin(THREE.MathUtils.degToRad(camera.fov / 2));
  camera.position.copy(sphere.center).add(new THREE.Vector3(Math.sin(p) * Math.sin(t), Math.cos(p), Math.sin(p) * Math.cos(t)).multiplyScalar(r));
  camera.lookAt(sphere.center);
  camera.near = r / 100;
  camera.far = r * 10;
  camera.updateProjectionMatrix();
  return box;
}

function studio(scene, box) {
  scene.add(new THREE.HemisphereLight(0xfff0d8, 0x2a2016, 1.4));
  const key = new THREE.DirectionalLight(0xffe2b8, 2.3);
  const c = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3()).length();
  key.position.copy(c).add(new THREE.Vector3(size * 0.4, size * 0.8, size * 0.5));
  key.target.position.copy(c);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  Object.assign(key.shadow.camera, { left: -size, right: size, top: size, bottom: -size, near: 1, far: size * 4 });
  key.shadow.bias = -0.0005;
  key.shadow.normalBias = 0.5;
  scene.add(key, key.target);
  const rim = new THREE.DirectionalLight(0x6f8fc4, 0.7);
  rim.position.copy(c).add(new THREE.Vector3(-size, size * 0.3, -size * 0.6));
  scene.add(rim);
}

function poster(data, mode, { w = 1600, h = 1000 } = {}) {
  const renderer = makeRenderer(w, h, { alpha: true });
  renderer.toneMappingExposure = 1.0;
  const scene = new THREE.Scene();
  const model = buildPyramid(data, { show: MODES[mode] });
  scene.add(model);
  const camera = new THREE.PerspectiveCamera(30, w / h, 1, 20000);
  const [theta, phi] = CAMERA[mode];
  // Frame the whole pyramid in every mode so posters line up when switching.
  const ref = buildPyramid(data, { show: ['casing', 'rock'] });
  const box = frame(ref, camera, { theta, phi, pad: mode.startsWith('ramp') ? 1.35 : 1.0 });
  studio(scene, box);
  renderer.render(scene, camera);
  return renderer.domElement.toDataURL('image/png');
}

async function glb(data) {
  const scene = new THREE.Scene();
  const model = buildPyramid(data);
  model.scale.setScalar(PYRAMID_SCALE);
  model.name = data.title;
  scene.add(model);
  return arrayBufferToBase64(await new GLTFExporter().parseAsync(scene, { binary: true }));
}

const PLATEAU_MODES = {
  built: ['built', 'temples', 'sphinx', 'cemeteries', 'ground'],
  today: ['today', 'temples', 'sphinx', 'cemeteries', 'ground'],
};

function plateauPoster(mode, { w = 1600, h = 1000 } = {}) {
  const renderer = makeRenderer(w, h, { alpha: true });
  const scene = new THREE.Scene();
  const model = buildPlateau({ show: PLATEAU_MODES[mode] });
  scene.add(model);
  const camera = new THREE.PerspectiveCamera(30, w / h, 1, 50000);
  const box = frame(model, camera, { theta: 150, phi: 58, pad: 0.82 });
  studio(scene, box);
  renderer.render(scene, camera);
  return renderer.domElement.toDataURL('image/png');
}

async function plateauGlb() {
  const scene = new THREE.Scene();
  const model = buildPlateau();
  model.scale.setScalar(PLATEAU_SCALE);
  model.name = 'Giza plateau (schematic)';
  scene.add(model);
  return arrayBufferToBase64(await new GLTFExporter().parseAsync(scene, { binary: true }));
}

/** Landscape scene of the plateau today, with the Sphinx and valley temple massing. */
function landscape(scene, { temples = true } = {}) {
  gizaScene(scene, 'today');
  const rock = stone({ color: 0xd8bd8c, block: [2.2, 1.6, 2.2], variation: 0.22, joints: 0.18 });
  add(scene, sphinxGeo([0, 0]), rock, PLATEAU.sphinx.at);
  const temple = stone({ color: 0xc9b089, block: [2.6, 1.8, 2.6], variation: 0.15, joints: 0.35 });
  const box = (x0, x1, h, z0, z1) => new THREE.BoxGeometry(x1 - x0, h, z1 - z0).translate((x0 + x1) / 2, h / 2, (z0 + z1) / 2);
  if (!temples) return;
  add(scene, box(268, 313, 12, 462, 507), temple);
  add(scene, box(372, 418, 8, 412, 458), temple);
}

function plateauHero({ w = 2400, h = 1350 } = {}) {
  const renderer = makeRenderer(w, h);
  const scene = new THREE.Scene();
  const { exposure } = desert(scene, { elevation: 14, azimuth: 115, center: [-150, 350], extent: 1500 });
  renderer.toneMappingExposure = exposure;
  landscape(scene);
  const camera = new THREE.PerspectiveCamera(30, w / h, 1, 20000);
  camera.position.set(760, 330, 1020);
  camera.lookAt(-190, 20, 330);
  renderer.render(scene, camera);
  return finish(renderer.domElement);
}

function sphinxHero({ w = 2400, h = 1350 } = {}) {
  const renderer = makeRenderer(w, h);
  const scene = new THREE.Scene();
  const { exposure, heightAt } = desert(scene, { elevation: 9, azimuth: 105, center: [200, 400], extent: 1500 });
  renderer.toneMappingExposure = exposure;
  landscape(scene, { temples: false });
  const camera = new THREE.PerspectiveCamera(34, w / h, 0.5, 20000);
  const [sx, sz] = PLATEAU.sphinx.at;
  camera.position.set(sx + 78, heightAt(sx + 78, sz - 72) + 5, sz - 72);
  camera.lookAt(sx - 18, 12, sz + 4);
  renderer.render(scene, camera);
  return finish(renderer.domElement);
}

window.pyramidJobs = { poster, glb, plateauPoster, plateauGlb, plateauHero, sphinxHero, modes: Object.keys(MODES) };
