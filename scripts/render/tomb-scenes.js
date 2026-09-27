/**
 * Render jobs for tombs: cutaway hero, model-viewer poster, GLB and an
 * interior view, all generated from the same plan data.
 */
import * as THREE from 'three';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { buildTomb, MODEL_SCALE } from './tombs.js';
import { finish, makeRenderer, arrayBufferToBase64 } from './scenes.js';


function frame(group, camera, { theta = 35, phi = 52, pad = 1.08, box: given } = {}) {
  const box = given ?? new THREE.Box3().setFromObject(group);
  const sphere = box.getBoundingSphere(new THREE.Sphere());
  const t = THREE.MathUtils.degToRad(theta), p = THREE.MathUtils.degToRad(phi);
  const r = (sphere.radius * pad) / Math.sin(THREE.MathUtils.degToRad(camera.fov / 2));
  camera.position.copy(sphere.center).add(new THREE.Vector3(Math.sin(p) * Math.sin(t), Math.cos(p), Math.sin(p) * Math.cos(t)).multiplyScalar(r));
  camera.lookAt(sphere.center);
  camera.near = r / 100;
  camera.far = r * 10;
  camera.updateProjectionMatrix();
  return { box, sphere };
}

function lights(scene, box, { warm = true } = {}) {
  scene.add(new THREE.HemisphereLight(0xfff0d8, 0x2a2016, 1.3));
  const key = new THREE.DirectionalLight(0xffe2b8, 2.2);
  const c = box.getCenter(new THREE.Vector3());
  key.position.copy(c).add(new THREE.Vector3(60, 120, 80));
  key.target.position.copy(c);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  const size = box.getSize(new THREE.Vector3()).length();
  Object.assign(key.shadow.camera, { left: -size, right: size, top: size, bottom: -size, near: 1, far: 600 });
  key.shadow.bias = -0.0008;
  key.shadow.normalBias = 0.35;
  scene.add(key, key.target);
  if (warm) {
    const rim = new THREE.DirectionalLight(0x6f8fc4, 0.8);
    rim.position.copy(c).add(new THREE.Vector3(-80, 40, -60));
    scene.add(rim);
  }
}

/** Faint grid at depth 0 marks the valley floor above the tomb. */
function surface(scene, box) {
  const size = box.getSize(new THREE.Vector3());
  const span = Math.ceil(Math.max(size.x, size.z) * 1.4 / 10) * 10;
  const grid = new THREE.GridHelper(span, span / 5, 0xc8952b, 0x6b5a3c);
  grid.position.set(...box.getCenter(new THREE.Vector3()).setY(0.02).toArray());
  grid.material.transparent = true;
  grid.material.opacity = 0.35;
  scene.add(grid);
}

function hero(plan, { w = 2400, h = 1350, theta = 35, phi = 58, heroPad = 0.72 } = {}) {
  const renderer = makeRenderer(w, h);
  renderer.toneMappingExposure = 1.05;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0b0a08);
  const tomb = buildTomb(plan);
  scene.add(tomb);
  const camera = new THREE.PerspectiveCamera(28, w / h, 0.1, 5000);
  const { box } = frame(tomb, camera, { theta, phi, pad: heroPad });
  lights(scene, box);
  surface(scene, box);
  scene.fog = new THREE.Fog(0x0b0a08, camera.position.distanceTo(box.getCenter(new THREE.Vector3())) * 0.9, camera.far * 0.4);
  renderer.render(scene, camera);
  return finish(renderer.domElement, { vignette: 0.55, grain: 0.025, warm: 0.6 });
}

function poster(plan, { w = 1600, h = 1000, theta = 35, phi = 52 } = {}) {
  const renderer = makeRenderer(w, h, { alpha: true });
  renderer.toneMappingExposure = 1.0;
  const scene = new THREE.Scene();
  const tomb = buildTomb(plan);
  scene.add(tomb);
  const camera = new THREE.PerspectiveCamera(30, w / h, 0.1, 5000);
  const { box } = frame(tomb, camera, { theta, phi });
  lights(scene, box, { warm: false });
  renderer.render(scene, camera);
  return renderer.domElement.toDataURL('image/png');
}

function interior(plan, { w = 1800, h = 1100, from, to, fov = 68, shrines = false, lamp }) {
  const renderer = makeRenderer(w, h);
  renderer.toneMappingExposure = 1.0;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x050403);
  scene.add(buildTomb(plan, { ceiling: true, shrines, route: false }));
  scene.add(new THREE.AmbientLight(0x3a2e22, 0.9));
  const torch = new THREE.PointLight(0xffb866, 38, 30, 1.6);
  torch.position.set(...(lamp ?? [from[0] + 0.6, from[1] + 0.3, from[2]]));
  torch.castShadow = true;
  torch.shadow.mapSize.set(2048, 2048);
  torch.shadow.bias = -0.01;
  torch.shadow.normalBias = 0.25;
  const fill = new THREE.PointLight(0x9fb4d8, 12, 25, 1.8);
  fill.position.set(to[0], to[1] + 2, to[2]);
  scene.add(torch, fill);
  const camera = new THREE.PerspectiveCamera(fov, w / h, 0.05, 200);
  camera.position.set(...from);
  camera.lookAt(...to);
  renderer.render(scene, camera);
  return finish(renderer.domElement, { vignette: 0.6, grain: 0.03, warm: 0.4 });
}

async function glb(plan) {
  const scene = new THREE.Scene();
  const tomb = buildTomb(plan);
  tomb.scale.setScalar(MODEL_SCALE);
  tomb.name = plan.title;
  scene.add(tomb);
  return arrayBufferToBase64(await new GLTFExporter().parseAsync(scene, { binary: true }));
}

/** Close cutaway of one space, e.g. the burial chamber with or without its shrines. */
function detail(plan, { space, theta = 35, phi = 48, shrines = false, w = 1800, h = 1200 }) {
  const renderer = makeRenderer(w, h);
  renderer.toneMappingExposure = 1.0;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0b0a08);
  const tomb = buildTomb(plan, { shrines, cut: 0.62, route: false });
  scene.add(tomb);
  const s = plan.spaces.find((x) => x.id === space);
  const focus = new THREE.Box3(new THREE.Vector3(s.x[0], s.floor[0], s.y[0]), new THREE.Vector3(s.x[1], s.floor[0] + s.height * 0.62, s.y[1]));
  const camera = new THREE.PerspectiveCamera(30, w / h, 0.1, 2000);
  frame(tomb, camera, { theta, phi, pad: 0.95, box: focus });
  lights(scene, focus.clone().expandByScalar(6));
  const glow = new THREE.PointLight(0xffc27a, 30, 20, 1.5);
  glow.position.copy(focus.getCenter(new THREE.Vector3())).add(new THREE.Vector3(0, 2.5, 0));
  scene.add(glow);
  renderer.render(scene, camera);
  return finish(renderer.domElement, { vignette: 0.5, grain: 0.025, warm: 0.5 });
}

window.tombJobs = { hero, poster, interior, glb, detail };
