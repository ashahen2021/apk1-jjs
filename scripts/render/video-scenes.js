/**
 * Vertical (9:16) short-video renders built from the same tomb plans as the
 * site's 3D models. The page renders one frame at a time; scripts/render/video.mjs
 * saves the frames and encodes them with ffmpeg.
 */
import * as THREE from 'three';
import { buildTomb } from './tombs.js';
import { makeRenderer } from './scenes.js';

const W = 1080, H = 1920;
const ease = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const clamp01 = (x) => Math.min(1, Math.max(0, x));
const lerp = (a, b, t) => a + (b - a) * t;
const lerp3 = (a, b, t) => a.map((v, i) => lerp(v, b[i], t));

/** Camera distance so a sphere fits the (narrow) horizontal field of view. */
function fitDistance(radius, camera, pad) {
  const hfov = 2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.aspect);
  return (radius * pad) / Math.sin(hfov / 2);
}
function orbit(camera, center, dist, theta, phi) {
  const t = THREE.MathUtils.degToRad(theta), p = THREE.MathUtils.degToRad(phi);
  camera.position.copy(center).add(new THREE.Vector3(Math.sin(p) * Math.sin(t), Math.cos(p), Math.sin(p) * Math.cos(t)).multiplyScalar(dist));
  camera.lookAt(center);
  camera.near = dist / 100;
  camera.far = dist * 10;
  camera.updateProjectionMatrix();
}

async function loadFonts() {
  const faces = [
    new FontFace('Cinzel', 'url(/node_modules/@fontsource/cinzel/files/cinzel-latin-700-normal.woff2)', { weight: '700' }),
    new FontFace('Inter', 'url(/node_modules/@fontsource/inter/files/inter-latin-500-normal.woff2)', { weight: '500' }),
  ];
  for (const f of faces) document.fonts.add(await f.load());
}

/** A short about KV62: cutaway orbit, push-in to the burial chamber as found, the chamber today, end card. */
async function kv62(plan) {
  await loadFonts();
  const renderer = makeRenderer(W, H);
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0b0a08);
  // Two versions of the tomb: with Carter's shrines (as found) and without (today).
  const found = buildTomb(plan, { shrines: true, route: false, cut: 0.62 });
  const today = buildTomb(plan, { shrines: false, route: false, cut: 0.62 });
  scene.add(found, today);
  const box = new THREE.Box3().setFromObject(found);
  const sphere = box.getBoundingSphere(new THREE.Sphere());
  scene.add(new THREE.HemisphereLight(0xfff0d8, 0x2a2016, 1.3));
  const key = new THREE.DirectionalLight(0xffe2b8, 2.2);
  key.position.copy(sphere.center).add(new THREE.Vector3(60, 120, 80));
  key.target.position.copy(sphere.center);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  const size = box.getSize(new THREE.Vector3()).length();
  Object.assign(key.shadow.camera, { left: -size, right: size, top: size, bottom: -size, near: 1, far: 600 });
  key.shadow.bias = -0.0008;
  key.shadow.normalBias = 0.35;
  scene.add(key, key.target);
  const rim = new THREE.DirectionalLight(0x6f8fc4, 0.8);
  rim.position.copy(sphere.center).add(new THREE.Vector3(-80, 40, -60));
  scene.add(rim);
  const span = Math.ceil((Math.max(box.max.x - box.min.x, box.max.z - box.min.z) * 1.4) / 10) * 10;
  const grid = new THREE.GridHelper(span, span / 5, 0xc8952b, 0x6b5a3c);
  grid.position.set(sphere.center.x, 0.02, sphere.center.z);
  grid.material.transparent = true;
  grid.material.opacity = 0.35;
  scene.add(grid);

  const j = plan.spaces.find((s) => s.id === 'kv62-j');
  const jCenter = new THREE.Vector3((j.x[0] + j.x[1]) / 2, j.floor[0] + j.height * 0.3, (j.y[0] + j.y[1]) / 2);
  const glow = new THREE.PointLight(0xffc27a, 0, 20, 1.5);
  glow.position.copy(jCenter).add(new THREE.Vector3(0, 2.5, 0));
  scene.add(glow);

  const cam = new THREE.PerspectiveCamera(34, W / H, 0.1, 5000);
  // Shift the picture up so the model sits in the top half, clear of the captions.
  cam.setViewOffset(W, H, 0, H * 0.14, W, H);
  const wide = fitDistance(sphere.radius, cam, 0.72);
  const close = fitDistance(Math.max(j.x[1] - j.x[0], j.y[1] - j.y[0]) * 0.72, cam, 1);

  const gl = renderer.domElement;
  const out = document.createElement('canvas');
  out.width = W;
  out.height = H;
  const ctx = out.getContext('2d');

  /** Camera for time t; `which` picks the shrines version. */
  function view(t, which) {
    found.visible = which === 'found';
    today.visible = which === 'today';
    if (t < 7) {
      glow.intensity = 0;
      orbit(cam, sphere.center, wide, lerp(70, 115, t / 7), lerp(40, 46, ease(t / 7)));
    } else if (t < 11) {
      const u = ease((t - 7) / 4);
      glow.intensity = 30 * u;
      orbit(cam, sphere.center.clone().lerp(jCenter, u), lerp(wide, close, u), lerp(115, 150, u), lerp(46, 44, u));
    } else if (t < 18.6) {
      glow.intensity = 30;
      orbit(cam, jCenter, close, lerp(150, 185, (t - 11) / 7.6), 44);
    } else {
      const u = ease(clamp01((t - 18.6) / 1.4));
      glow.intensity = 30 * (1 - u);
      orbit(cam, jCenter.clone().lerp(sphere.center, u), lerp(close, wide * 1.05, u), lerp(185, 200, clamp01((t - 18.6) / 3.4)), lerp(44, 42, u));
    }
    renderer.render(scene, cam);
    return gl;
  }

  function grade() {
    const g = ctx.createRadialGradient(W / 2, H * 0.42, H * 0.28, W / 2, H * 0.45, H * 0.65);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, 'rgba(8,6,3,0.55)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    const band = ctx.createLinearGradient(0, H * 0.56, 0, H * 0.82);
    band.addColorStop(0, 'rgba(5,4,3,0)');
    band.addColorStop(0.5, 'rgba(5,4,3,0.5)');
    band.addColorStop(1, 'rgba(5,4,3,0)');
    ctx.fillStyle = band;
    ctx.fillRect(0, H * 0.56, W, H * 0.26);
  }
  /** Draws wrapped text centred at y (top of the block); returns the block height. */
  function text(str, y, { size = 64, font = 'Cinzel', weight = 700, color = '#f0e4c6', alpha = 1, spacing = 0 } = {}) {
    ctx.save();
    ctx.font = `${weight} ${size}px ${font}`;
    ctx.letterSpacing = `${spacing}px`;
    const words = str.split(' '), lines = [];
    let line = '';
    for (const w of words) {
      const next = line ? `${line} ${w}` : w;
      if (ctx.measureText(next).width > W * 0.8 && line) { lines.push(line); line = w; } else line = next;
    }
    lines.push(line);
    const lh = size * 1.18;
    if (alpha > 0) {
      ctx.globalAlpha = alpha;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.shadowColor = 'rgba(0,0,0,0.85)';
      ctx.shadowBlur = 18;
      ctx.fillStyle = color;
      lines.forEach((l, i) => ctx.fillText(l, W / 2, y + i * lh));
    }
    ctx.restore();
    return lines.length * lh;
  }
  const SUB = { font: 'Inter', weight: 500, color: '#e3b95a' };
  /** A heading with an optional sub-line, stacked from y. */
  function block(y, alpha, head, sub, headSize = 68) {
    if (alpha <= 0) return;
    const h = text(head, y, { size: headSize, alpha, spacing: 2 });
    if (sub) text(sub, y + h + 18, { size: 44, alpha, ...SUB });
  }
  // [start, end, heading, sub]. Facts as stated on the site's KV62 page.
  const CAPTIONS = [
    [3.2, 6.8, 'Found almost intact', 'Howard Carter · 1922'],
    [7.0, 10.6, 'Hidden for over 3,000 years', 'under debris from a later tomb'],
    [10.9, 14.4, 'More than 5,000 objects', 'packed into four small rooms'],
    [14.8, 18.4, 'The burial chamber today', 'the quartzite sarcophagus alone in the painted room'],
  ];
  const fade = (t, a, b) => clamp01(Math.min((t - a) / 0.4, (b - t) / 0.4));
  const Y = H * 0.62;

  function frame(t) {
    ctx.globalAlpha = 1;
    if (t < 14.4) ctx.drawImage(view(t, 'found'), 0, 0);
    else if (t < 15.2) {
      ctx.drawImage(view(t, 'found'), 0, 0);
      ctx.globalAlpha = ease((t - 14.4) / 0.8);
      ctx.drawImage(view(t, 'today'), 0, 0);
    } else ctx.drawImage(view(t, 'today'), 0, 0);
    ctx.globalAlpha = 1;
    grade();

    block(Y, t < 3.2 ? clamp01(Math.min(t / 0.6, (3.2 - t) / 0.4)) : 0, "TUTANKHAMUN'S TOMB", 'KV62 · Valley of the Kings', 84);
    for (const [a, b, head, sub] of CAPTIONS) block(Y, fade(t, a, b), head, sub);
    if (t >= 19.2) block(Y, clamp01((t - 19.2) / 0.5), 'Explore it in 3D', 'neokemetai.online', 78);
    // Honest label on a small dark pill, kept clear of the platforms' top bar.
    ctx.save();
    ctx.font = '500 30px Inter';
    const lw = ctx.measureText('3D reconstruction · NeoKemetAI').width + 48;
    ctx.fillStyle = 'rgba(8,6,3,0.62)';
    ctx.beginPath();
    ctx.roundRect((W - lw) / 2, H * 0.17 - 10, lw, 56, 28);
    ctx.fill();
    ctx.restore();
    text('3D reconstruction · NeoKemetAI', H * 0.17, { size: 30, font: 'Inter', weight: 500, color: '#d8cba8', alpha: 0.9 });
    return out.toDataURL('image/jpeg', 0.92);
  }

  return { frame };
}

let current;
window.videoJobs = {
  async setup(name, plan) { current = await ({ kv62 })[name](plan); return true; },
  frame(t) { return current.frame(t); },
};
