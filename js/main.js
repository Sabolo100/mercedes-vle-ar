import * as THREE from 'three';
import { PAINTS, WHEELS, INTERIORS, TEXT, LINKS, JOURNEYS } from './config.js';
import {
  makeCardTexture, makeDotTexture,
  drawSide, drawFront, drawLounge, drawCockpit, drawWheelCard, drawSummary,
} from './textures.js';
import { LookControls } from './look.js';

const $ = (s) => document.querySelector(s);
let lang = 'hu';
const T = () => TEXT[lang];
const pick = (o) => o.name[lang];

// ======================================================================
// Three.js alap
// ======================================================================
const canvas = $('#gl');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setClearColor(0x000000, 0);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(70, 1, 0.05, 500);
scene.add(camera);
const look = new LookControls(camera);

const world = new THREE.Group(); // konfigurátor objektumai
scene.add(world);

function resize() {
  const w = window.innerWidth, h = window.innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);
resize();

// ======================================================================
// Mini tween-motor
// ======================================================================
let time = 0;
const tweens = [];
const ease = {
  linear: (p) => p,
  outCubic: (p) => 1 - Math.pow(1 - p, 3),
  outQuart: (p) => 1 - Math.pow(1 - p, 4),
  inOutCubic: (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2),
  inCubic: (p) => p * p * p,
  outBack: (p) => { const c = 1.7; return 1 + (c + 1) * Math.pow(p - 1, 3) + c * Math.pow(p - 1, 2); },
};
function tween(dur, fn, { delay = 0, e = ease.outCubic } = {}) {
  return new Promise((res) => tweens.push({ t0: time + delay, dur, fn, e, res }));
}
const wait = (s) => tween(s, () => {});
function updateTweens() {
  for (let i = tweens.length - 1; i >= 0; i--) {
    const t = tweens[i];
    if (time < t.t0) continue;
    const p = Math.min(1, (time - t.t0) / t.dur);
    t.fn(t.e(p), p);
    if (p >= 1) { tweens.splice(i, 1); t.res(); }
  }
}

// Futás-azonosító: Vissza / Újrakezdés után a régi async folyamatok csendben kilépnek.
let runId = 0;
class Cancelled extends Error {}
function guard(id) { if (id !== runId) throw new Cancelled(); }

// ======================================================================
// Részecskék (lebegő "por" + kiválasztási szikra)
// ======================================================================
const dotTex = makeDotTexture();
const dust = (() => {
  const n = 500;
  const pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const r = 2 + Math.random() * 10;
    const th = Math.random() * Math.PI * 2;
    const ph = Math.acos(2 * Math.random() - 1);
    pos.set([r * Math.sin(ph) * Math.cos(th), r * Math.cos(ph) * 0.7, r * Math.sin(ph) * Math.sin(th)], i * 3);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const m = new THREE.PointsMaterial({
    size: 0.05, map: dotTex, transparent: true, opacity: 0.55,
    depthWrite: false, blending: THREE.AdditiveBlending, color: 0xcfe6ff,
  });
  const p = new THREE.Points(g, m);
  scene.add(p);
  return p;
})();

function burst(position, color = 0xffffff, count = 60) {
  const pos = new Float32Array(count * 3);
  const vel = [];
  for (let i = 0; i < count; i++) {
    pos.set([position.x, position.y, position.z], i * 3);
    vel.push(new THREE.Vector3().randomDirection().multiplyScalar(0.6 + Math.random() * 1.4));
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const m = new THREE.PointsMaterial({
    size: 0.07, map: dotTex, color, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  });
  const pts = new THREE.Points(g, m);
  world.add(pts);
  const attr = g.getAttribute('position');
  tween(1.1, (e) => {
    for (let i = 0; i < count; i++) {
      attr.setXYZ(i,
        position.x + vel[i].x * e,
        position.y + vel[i].y * e - 0.2 * e * e,
        position.z + vel[i].z * e);
    }
    attr.needsUpdate = true;
    m.opacity = 1 - e;
  }).then(() => { world.remove(pts); g.dispose(); m.dispose(); });

  // táguló gyűrű
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.48, 0.52, 64),
    new THREE.MeshBasicMaterial({ color, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide })
  );
  ring.position.copy(position);
  ring.lookAt(camera.position);
  world.add(ring);
  tween(0.8, (e) => { ring.scale.setScalar(1 + e * 2.2); ring.material.opacity = 1 - e; })
    .then(() => { world.remove(ring); ring.geometry.dispose(); ring.material.dispose(); });
}

// ======================================================================
// Kártyák
// ======================================================================
const CARD_ASPECT = 340 / 512;
const cardGeo = new THREE.PlaneGeometry(1, CARD_ASPECT);
let cards = [];

function dirFrom(yaw, pitch) {
  return new THREE.Vector3(
    -Math.sin(yaw) * Math.cos(pitch),
    Math.sin(pitch),
    -Math.cos(yaw) * Math.cos(pitch)
  );
}

function makeCard(tex, data = {}) {
  const mat = new THREE.MeshBasicMaterial({
    map: tex, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false,
  });
  const m = new THREE.Mesh(cardGeo, mat);
  m.userData = {
    ...data, base: new THREE.Vector3(), phase: Math.random() * Math.PI * 2,
    float: false, hover: 0, scaleBase: 1, selectable: false,
  };
  world.add(m);
  cards.push(m);
  return m;
}

function removeCard(m) {
  world.remove(m);
  m.material.map?.dispose();
  m.material.dispose();
  cards = cards.filter((c) => c !== m);
}

function clearWorld() {
  [...cards].forEach(removeCard);
  while (world.children.length) {
    const o = world.children.pop();
    o.traverse?.((c) => { c.geometry?.dispose(); (Array.isArray(c.material) ? c.material : [c.material]).forEach((mm) => { mm?.map?.dispose(); mm?.dispose(); }); });
  }
}

/** Kártya repítése célpontba; `from` megadásakor onnan indul és beúszik. */
function flyTo(m, target, { dur = 1.4, delay = 0, from = null, spin = 0, fadeIn = false, scale = 1 } = {}) {
  const ud = m.userData;
  const token = (ud.token = {}); // egy kártyán mindig csak a legutóbbi mozgás fut
  let start, s0, o0;
  ud.float = false;
  if (from) { m.position.copy(from); m.material.opacity = 0; }
  return tween(dur, (e, p) => {
    if (ud.token !== token) return;
    if (!start) { start = m.position.clone(); s0 = ud.scaleBase; o0 = fadeIn ? 0 : m.material.opacity; }
    m.position.lerpVectors(start, target, e);
    m.lookAt(0, 0, 0);
    if (spin) m.rotateZ(spin * (1 - e));
    ud.scaleBase = s0 + (scale - s0) * e;
    m.material.opacity = o0 + (1 - o0) * Math.min(1, p * 3);
  }, { delay, e: ease.outQuart }).then(() => {
    if (ud.token !== token) return;
    ud.base.copy(target);
    ud.float = true;
  });
}

function dissolve(m, delay = 0) {
  const ud = m.userData;
  const token = (ud.token = {});
  ud.selectable = false;
  ud.float = false;
  const start = m.position.clone();
  const out = start.clone().multiplyScalar(1.6);
  const s0 = ud.scaleBase;
  const o0 = m.material.opacity;
  let burstDone = false;
  return tween(0.75, (e) => {
    if (ud.token !== token) return;
    m.position.lerpVectors(start, out, e);
    m.lookAt(0, 0, 0);
    m.rotateZ(e * 1.2);
    ud.scaleBase = s0 * (1 - e * 0.85);
    m.material.opacity = o0 * (1 - e);
    if (!burstDone && e > 0.15) { burstDone = true; if (Math.random() < 0.35) burst(m.position, 0xcfe6ff, 18); }
  }, { delay, e: ease.inCubic }).then(() => removeCard(m));
}

/** Ív a felhasználó előtt: a kártyák az aktuális nézési irány körül, balról jobbra. */
function arcTargets(n, centerYaw, { radius = 3.0, step = 0.44 } = {}) {
  // a felhasználó aktuális nézési magasságában (kicsit korlátozva)
  const y = Math.tan(THREE.MathUtils.clamp(look.pitch(), -0.45, 0.45)) * radius;
  return Array.from({ length: n }, (_, i) => {
    const yaw = centerYaw + (Math.floor(n / 2) - i) * step; // mindig legyen kártya középen
    return dirFrom(yaw, 0).multiplyScalar(radius).setY(y);
  });
}

function updateCards() {
  const fwd = new THREE.Vector3();
  camera.getWorldDirection(fwd);
  const tmp = new THREE.Vector3();
  let best = null, bestAng = 0.22;
  for (const m of cards) {
    const ud = m.userData;
    if (ud.float) {
      m.position.copy(ud.base);
      m.position.y += Math.sin(time * 0.9 + ud.phase) * 0.035;
      m.lookAt(0, 0, 0);
    }
    if (ud.selectable) {
      const ang = tmp.copy(m.position).normalize().angleTo(fwd);
      if (ang < bestAng) { bestAng = ang; best = m; }
    }
  }
  for (const m of cards) {
    const ud = m.userData;
    const target = m === best ? 1 : 0;
    ud.hover += (target - ud.hover) * 0.15;
    m.scale.setScalar(ud.scaleBase * (1 + 0.14 * ud.hover));
  }
  focused = best;
  $('#reticle').classList.toggle('focus', !!best);
}
let focused = null;

// ======================================================================
// Textúra-gyártók
// ======================================================================
const tex = {
  side: (paint, wheel, label, sub, w, h) =>
    makeCardTexture({ draw: (c, W, H) => drawSide(c, W, H, paint.color, wheel), img: paint.img, label, sub, w, h }),
  front: (paint, wheel, label, w, h) =>
    makeCardTexture({ draw: (c, W, H) => drawFront(c, W, H, paint.color, wheel), img: paint.imgFront, label, w, h }),
  lounge: (it, label, sub, w, h) =>
    makeCardTexture({ draw: (c, W, H) => drawLounge(c, W, H, it), img: it.img, label, sub, w, h }),
  cockpit: (it, label, w, h) =>
    makeCardTexture({ draw: (c, W, H) => drawCockpit(c, W, H, it), img: it.imgFront, label, w, h }),
  wheel: (wh, paint, label, sub, w, h) =>
    makeCardTexture({ draw: (c, W, H) => drawWheelCard(c, W, H, wh, paint?.color), img: wh.img, label, sub, w, h }),
};
const rand = (a, b) => a + Math.random() * (b - a);
const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

// ======================================================================
// UI segédek
// ======================================================================
function show(id) {
  document.querySelectorAll('.screen').forEach((s) => s.classList.toggle('active', `#${s.id}` === id));
}
function applyI18n() {
  document.documentElement.lang = lang;
  document.querySelectorAll('[data-t]').forEach((el) => { el.textContent = T()[el.dataset.t]; });
  $('#cta').textContent = T().cta;
  $('#cta').href = LINKS.official;
  $('#btnSkip').textContent = T().skip;
  buildVideoList();
}
function setPrompt(title, text, { skip = false } = {}) {
  const p = $('#prompt');
  if (!title) { p.hidden = true; return; }
  $('#promptTitle').textContent = title;
  $('#promptText').textContent = text || '';
  $('#btnSkip').hidden = !skip;
  p.hidden = false;
  p.style.animation = 'none'; void p.offsetWidth; p.style.animation = '';
}
function setStep(i, n) { $('#stepLabel').textContent = i ? T().step(i, n) : ''; }
function addChip(label, color) {
  const c = document.createElement('span');
  c.className = 'chip';
  c.innerHTML = `<i style="background:${color}"></i>`;
  c.append(label);
  $('#chips').append(c);
}
let toastTimer;
function toast(msg, ms = 3500) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), ms);
}

// Várakozás koppintásos kiválasztásra / "Tovább" gombra
let pendingSelect = null;
let pendingSkip = null;
function waitSelect() { return new Promise((res) => { pendingSelect = res; }); }
function waitSkipOr(seconds) {
  return Promise.race([wait(seconds), new Promise((res) => { pendingSkip = res; })]);
}
$('#btnSkip').addEventListener('click', () => { pendingSkip?.(); pendingSkip = null; });

// ======================================================================
// Érintés: húzás = körbenézés / kocka forgatása, koppintás = kiválasztás
// ======================================================================
const raycaster = new THREE.Raycaster();
let down = null;
canvas.addEventListener('pointerdown', (e) => {
  down = { x: e.clientX, y: e.clientY, lx: e.clientX, ly: e.clientY, drag: false };
  if (journey && journey.video.paused) journey.video.play().catch(() => {});
  canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener('pointermove', (e) => {
  if (!down) return;
  const dx = e.clientX - down.lx, dy = e.clientY - down.ly;
  down.lx = e.clientX; down.ly = e.clientY;
  if (!down.drag && Math.hypot(e.clientX - down.x, e.clientY - down.y) > 8) down.drag = true;
  if (!down.drag) return;
  if (cube) { cubeSpin.vx = dx * 0.01; cubeSpin.vy = dy * 0.01; cubeSpin.touch = time; rotateCube(dx * 0.01, dy * 0.01); }
  else look.drag(dx, dy);
});
canvas.addEventListener('pointerup', (e) => {
  if (down && !down.drag) tap(e.clientX, e.clientY);
  down = null;
});
canvas.addEventListener('pointercancel', () => { down = null; });

function tap(x, y) {
  if (!pendingSelect) return;
  const ndc = new THREE.Vector2((x / window.innerWidth) * 2 - 1, -(y / window.innerHeight) * 2 + 1);
  raycaster.setFromCamera(ndc, camera);
  const hits = raycaster.intersectObjects(cards.filter((c) => c.userData.selectable), false);
  const target = hits[0]?.object || focused;
  if (target) choose(target);
}

function choose(m) {
  const res = pendingSelect;
  pendingSelect = null;
  cards.forEach((c) => { c.userData.selectable = false; });
  burst(m.position, 0x9fdcff, 80);
  const others = cards.filter((c) => c !== m);
  others.forEach((c, i) => dissolve(c, i * 0.05));
  // kiválasztott kártya: felvillan, majd "beúszik" a felső sávba
  const ud = m.userData;
  ud.token = {};
  ud.float = false;
  const start = m.position.clone();
  tween(0.35, (e) => { ud.scaleBase = 1 + 0.25 * Math.sin(e * Math.PI); }).then(() => {
    const fwd = new THREE.Vector3(); camera.getWorldDirection(fwd);
    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(camera.quaternion);
    const end = fwd.multiplyScalar(1.2).add(up.multiplyScalar(0.55));
    return tween(0.7, (e) => {
      m.position.lerpVectors(start, end, e);
      m.lookAt(camera.position);
      ud.scaleBase = 1 - 0.8 * e;
      m.material.opacity = 1 - e;
    }, { e: ease.inOutCubic });
  }).then(() => removeCard(m));
  setTimeout(() => res(ud.option), 650);
}

// ======================================================================
// OPCIÓ 1 – Konfigurátor
// ======================================================================
const choice = { paint: null, wheel: null, interior: null };

async function runConfigurator() {
  const id = ++runId;
  Object.assign(choice, { paint: null, wheel: null, interior: null });
  $('#chips').innerHTML = '';
  setStep(0);
  $('#hud').hidden = false;
  $('#reticle').hidden = false;
  $('#final').hidden = true;

  try {
    // --- 1. Képfelhő: minden irányból érkező kártyák -----------------------
    setPrompt(T().introTitle, T().introHint, { skip: true });
    spawnCloud();
    await waitSkipOr(10); guard(id);

    // --- 2. Fényezés -------------------------------------------------------
    setPrompt(null);
    const keep = cards.filter((c) => c.userData.kind === 'paint');
    cards.filter((c) => !keep.includes(c)).forEach((c, i) => dissolve(c, Math.random() * 0.6));
    await wait(0.5); guard(id);
    const yaw = look.yaw();
    const targets = arcTargets(keep.length, yaw);
    // ív sorrendje a fényezések sorrendjében
    keep.sort((a, b) => PAINTS.indexOf(a.userData.option) - PAINTS.indexOf(b.userData.option));
    keep.forEach((c, i) => {
      const p = c.userData.option;
      c.material.map.dispose();
      c.material.map = tex.side(p, WHEELS[0], pick(p));
      flyTo(c, targets[i], { dur: 1.6, delay: i * 0.08, spin: 0 });
    });
    await wait(1.5); guard(id);
    setStep(1, 3);
    setPrompt(T().pickPaint, T().pickHint);
    keep.forEach((c) => { c.userData.selectable = true; });
    choice.paint = await waitSelect(); guard(id);
    addChip(pick(choice.paint), choice.paint.color);

    // --- 3. Felni ----------------------------------------------------------
    setPrompt(null);
    await wait(0.5); guard(id);
    await presentOptions(id, WHEELS.map((w) => ({
      option: w,
      tex: tex.wheel(w, choice.paint, pick(w), `${w.size}"`),
    })));
    setStep(2, 3);
    setPrompt(T().pickWheel, T().pickHint);
    choice.wheel = await waitSelect(); guard(id);
    addChip(`${choice.wheel.size}" ${pick(choice.wheel)}`, choice.wheel.rim);

    // --- 4. Belső tér ------------------------------------------------------
    setPrompt(null);
    await wait(0.5); guard(id);
    await presentOptions(id, INTERIORS.map((it) => ({
      option: it,
      tex: tex.lounge(it, pick(it)),
    })));
    setStep(3, 3);
    setPrompt(T().pickInterior, T().pickHint);
    choice.interior = await waitSelect(); guard(id);
    addChip(pick(choice.interior), choice.interior.color);

    // --- 5. Kocka ----------------------------------------------------------
    setPrompt(null);
    setStep(0);
    await wait(0.6); guard(id);
    $('#reticle').hidden = true;
    await buildCube(id);
    $('#final').hidden = false;
  } catch (err) {
    if (!(err instanceof Cancelled)) throw err;
  }
}

function spawnCloud() {
  const items = [];
  PAINTS.forEach((p, i) => {
    items.push({ kind: 'paint', option: p, t: tex.side(p, WHEELS[i % WHEELS.length]) });
    items.push({ kind: 'deco', t: tex.front(p, WHEELS[i % WHEELS.length]) });
    items.push({ kind: 'deco', t: tex.side(p, WHEELS[(i + 2) % WHEELS.length]) });
  });
  INTERIORS.forEach((it) => {
    items.push({ kind: 'deco', t: tex.lounge(it) });
    items.push({ kind: 'deco', t: tex.cockpit(it) });
  });
  WHEELS.forEach((w, i) => items.push({ kind: 'deco', t: tex.wheel(w, PAINTS[(i * 2) % PAINTS.length]) }));
  shuffle(items);

  const golden = Math.PI * (3 - Math.sqrt(5));
  const yaw0 = look.yaw();
  items.forEach((it, i) => {
    const n = items.length;
    const yaw = yaw0 + i * golden;
    const pitch = THREE.MathUtils.lerp(-0.5, 0.62, (i + 0.5) / n);
    const target = dirFrom(yaw, pitch).multiplyScalar(rand(3.3, 4.2));
    // a "messzeségből", kicsit oldalról érkezik
    const from = dirFrom(yaw + rand(-0.8, 0.8), pitch + rand(-0.5, 0.5)).multiplyScalar(rand(22, 32));
    const m = makeCard(it.t, { kind: it.kind, option: it.option });
    flyTo(m, target, { from, dur: rand(2.4, 3.4), delay: rand(0, 1.8), spin: rand(-4, 4), fadeIn: true });
  });
}

async function presentOptions(id, list) {
  const yaw = look.yaw();
  const targets = arcTargets(list.length, yaw);
  const ms = list.map((o, i) => {
    const m = makeCard(o.tex, { option: o.option });
    const from = dirFrom(yaw + rand(-2.5, 2.5), rand(-0.9, 0.9)).multiplyScalar(rand(18, 26));
    flyTo(m, targets[i], { from, dur: 2.0, delay: i * 0.12, spin: rand(-3, 3), fadeIn: true });
    return m;
  });
  await wait(1.6 + list.length * 0.12); guard(id);
  ms.forEach((m) => { m.userData.selectable = true; });
}

// ---------- Kocka ----------
let cube = null;
const cubeSpin = { vx: 0, vy: 0, touch: -10 };
let halo = null;

function rotateCube(dx, dy) {
  const up = new THREE.Vector3(0, 1, 0);
  const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
  cube.rotateOnWorldAxis(up, dx);
  cube.rotateOnWorldAxis(right, dy);
}

async function buildCube(id) {
  const S = 512;
  const { paint, wheel, interior } = choice;
  const faces = [
    tex.front(paint, wheel, pick(paint), S, S),                       // +X
    tex.lounge(interior, pick(interior), null, S, S),                 // -X
    tex.wheel(wheel, paint, `${wheel.size}" ${pick(wheel)}`, null, S, S), // +Y
    tex.cockpit(interior, null, S, S),                                // -Y
    tex.side(paint, wheel, T().yourVle, pick(paint), S, S),           // +Z (felhasználó felé)
    makeCardTexture({                                                 // -Z összegzés
      w: S, h: S,
      draw: (c, W, H) => drawSummary(c, W, H, {
        title: T().yourVle,
        paint: paint.color,
        interior,
        rows: [
          [T().paint, pick(paint), paint.color],
          [T().wheel, `${wheel.size}" ${pick(wheel)}`, wheel.rim],
          [T().interior, pick(interior), interior.color],
        ],
      }),
    }),
  ];
  const mats = faces.map((t) => new THREE.MeshBasicMaterial({ map: t, transparent: true, opacity: 0 }));
  cube = new THREE.Mesh(new THREE.BoxGeometry(1.25, 1.25, 1.25), mats);
  const yaw = look.yaw();
  // álló telefonon is férjen el forgatás közben (kb. a képszélesség fele), és üljön a panel fölött
  const hfov = 2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.aspect);
  const dist = Math.max(2.6, (1.25 * 1.9) / (2 * Math.tan(hfov / 2)));
  const pos = dirFrom(yaw, 0).multiplyScalar(dist)
    .setY(Math.tan(THREE.MathUtils.clamp(look.pitch(), -0.45, 0.45) + 0.12) * dist);
  cube.position.copy(pos);
  cube.lookAt(0, 0, 0);
  world.add(cube);

  // fényudvar a kocka mögött
  halo = new THREE.Sprite(new THREE.SpriteMaterial({
    map: dotTex, color: interior.ambient, transparent: true, opacity: 0,
    depthWrite: false, blending: THREE.AdditiveBlending,
  }));
  halo.position.copy(pos.clone().multiplyScalar(1.15));
  halo.scale.setScalar(4);
  world.add(halo);

  burst(pos, 0xffffff, 120);
  const q0 = cube.quaternion.clone();
  await tween(1.4, (e, p) => {
    cube.scale.setScalar(Math.max(0.001, e));
    cube.quaternion.copy(q0);
    cube.rotateY((1 - e) * Math.PI * 2);
    mats.forEach((m) => { m.opacity = Math.min(1, p * 2.5); });
    halo.material.opacity = 0.55 * p;
  }, { e: ease.outBack });
  guard(id);
  mats.forEach((m) => { m.transparent = false; m.needsUpdate = true; });
  cubeSpin.touch = time;
}

function updateCube(dt) {
  if (!cube || cube.scale.x < 0.99) return;
  const idle = time - cubeSpin.touch > 2.5;
  if (!down) {
    cubeSpin.vx *= 0.94; cubeSpin.vy *= 0.94;
    rotateCube(cubeSpin.vx, cubeSpin.vy);
  }
  if (idle) cube.rotateOnWorldAxis(new THREE.Vector3(0, 1, 0), dt * 0.35);
  if (halo) halo.material.opacity = 0.45 + Math.sin(time * 1.5) * 0.1;
}

// ======================================================================
// OPCIÓ 2 – Virtuális utazás
// ======================================================================
let journey = null;
let journeyIndex = 0;

function buildVideoList() {
  const list = $('#videoList');
  list.innerHTML = '';
  JOURNEYS.forEach((j, i) => {
    const b = document.createElement('button');
    b.className = 'video-card';
    b.style.backgroundImage = `url("${j.poster}")`;
    b.innerHTML = '<span><strong></strong><small></small></span>';
    b.querySelector('strong').textContent = pick(j);
    b.querySelector('small').textContent = j.sub[lang];
    b.addEventListener('click', () => { show(null); look.recenter(); runJourney(i); });
    list.append(b);
  });
}

async function runJourney(index = 0) {
  const id = ++runId;
  const cfg = JOURNEYS[index];
  journeyIndex = index;
  $('#hud').hidden = false;
  $('#reticle').hidden = true;
  $('#journeyBar').hidden = false;
  $('#journeyPlace').textContent = pick(cfg);
  $('#btnSwitch').hidden = JOURNEYS.length < 2;
  setStep(0);
  $('#chips').innerHTML = '';
  setPrompt(T().journeyTitle, T().journeyHint);
  setTimeout(() => { if (id === runId) setPrompt(null); }, 3500);

  const video = document.createElement('video');
  const src = new URLSearchParams(location.search).get('video') || cfg.src; // ?video=… teszthez
  Object.assign(video, { crossOrigin: 'anonymous', loop: true, muted: true, playsInline: true, preload: 'auto' });
  video.setAttribute('playsinline', '');
  video.setAttribute('webkit-playsinline', '');
  // DOM-ban tartjuk (láthatatlanul) – egyes mobilböngészők különben nem dekódolják a képkockákat
  video.style.cssText = 'position:fixed;width:1px;height:1px;opacity:0;pointer-events:none;';
  document.body.append(video);
  video.src = src;
  // a lejátszást a böngésző néha csak koppintásra engedi – ezért a betöltést figyeljük, nem a play()-t
  const ok = await new Promise((res) => {
    video.addEventListener('loadedmetadata', () => res(true), { once: true });
    video.addEventListener('error', () => res(false), { once: true });
  });
  video.play().catch((e) => console.warn('360 video:', e.message));
  if (id !== runId) { video.pause(); video.remove(); return; }
  if (!ok) { video.remove(); toast(T().videoFail, 5000); return; }

  journey = { video, group: new THREE.Group() };
  scene.add(journey.group);
  updateSoundBtn();

  // 360° gömb – a videót belülről nézzük
  const vt = new THREE.VideoTexture(video);
  vt.colorSpace = THREE.SRGBColorSpace;
  const geo = new THREE.SphereGeometry(50, 64, 40);
  geo.scale(-1, 1, 1);
  const sphere = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: vt, transparent: true, opacity: 0, depthWrite: false }));
  // SphereGeometry-n a textúra közepe a −X irányba esik → −90° fordítással kerül előre (−Z)
  sphere.rotation.y = THREE.MathUtils.degToRad(-90 + cfg.yawOffsetDeg);
  sphere.renderOrder = -1;
  journey.group.add(sphere);

  const cabin = cfg.cabin ? buildCabin() : new THREE.Group();
  journey.group.add(cabin);
  journey.group.rotation.y = look.yaw(); // a menetirány oda essen, amerre most néz
  dust.visible = false;

  // "portál" belépés: a gömb kívülről összehúzódik ránk, közben előtűnik
  sphere.scale.setScalar(4);
  await tween(2.2, (e) => {
    sphere.material.opacity = e;
    sphere.scale.setScalar(4 - 3 * e);
    cabin.traverse((o) => { if (o.material) o.material.opacity = e * (o.userData.alpha ?? 1); });
  }, { e: ease.inOutCubic });
  if (id === runId) { sphere.material.transparent = false; sphere.material.needsUpdate = true; }
}

$('#btnSwitch').addEventListener('click', () => {
  const next = (journeyIndex + 1) % JOURNEYS.length;
  resetAll();
  look.recenter();
  runJourney(next);
});

/** Egyszerű utastér-keret (műszerfal, oszlopok, tető), hogy a szélvédőn át "nézzünk ki". */
function buildCabin() {
  const g = new THREE.Group();
  const dark = () => new THREE.MeshBasicMaterial({ color: 0x08090b, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false });
  const add = (mesh, alpha = 1) => { mesh.userData.alpha = alpha; g.add(mesh); return mesh; };

  // alsó öv (műszerfal + ajtók), elöl a -Z irány
  add(new THREE.Mesh(new THREE.CylinderGeometry(2.1, 1.9, 1.4, 64, 1, true), dark()), 0.97).position.y = -1.45;
  // ambient fénycsík a műszerfal tetején (elöl ~150°)
  const span = THREE.MathUtils.degToRad(150);
  add(new THREE.Mesh(
    new THREE.CylinderGeometry(2.08, 2.08, 0.025, 64, 1, true, Math.PI - span / 2, span),
    new THREE.MeshBasicMaterial({ color: 0x4cc3ff, transparent: true, opacity: 0, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false })
  ), 0.9).position.y = -0.76;
  // tető
  add(new THREE.Mesh(new THREE.CylinderGeometry(1.7, 2.0, 0.9, 64, 1, true), dark()), 0.97).position.y = 1.65;
  const roof = add(new THREE.Mesh(new THREE.CircleGeometry(1.72, 64), dark()), 0.97);
  roof.rotation.x = Math.PI / 2; roof.position.y = 2.1;

  // oszlopok (A, B, C) a műszerfal tetejétől a tetőig
  const pillar = (yawDeg, w = 0.16) => {
    const yaw = THREE.MathUtils.degToRad(yawDeg);
    const a = dirFrom(yaw, 0).multiplyScalar(2.08).setY(-0.75);
    const b = dirFrom(yaw, 0).multiplyScalar(1.72).setY(1.22);
    const len = a.distanceTo(b);
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, len, 0.06), dark());
    m.position.copy(a).add(b).multiplyScalar(0.5);
    m.lookAt(0, m.position.y, 0);
    m.rotateX(Math.asin((2.08 - 1.72) / len)); // teteje befelé dől
    return add(m, 0.97);
  };
  [-42, 42].forEach((d) => pillar(d, 0.2));
  [-110, 110].forEach((d) => pillar(d, 0.28));
  [-160, 160].forEach((d) => pillar(d, 0.34));
  return g;
}

function updateSoundBtn() {
  $('#btnSound').textContent = !journey || journey.video.muted ? T().sound : T().soundOff;
}
$('#btnSound').addEventListener('click', () => {
  if (!journey) return;
  journey.video.muted = !journey.video.muted;
  journey.video.play();
  updateSoundBtn();
});

function stopJourney() {
  if (!journey) return;
  journey.video.pause();
  journey.video.removeAttribute('src');
  journey.video.load();
  journey.group.traverse((o) => { o.geometry?.dispose(); o.material?.map?.dispose(); o.material?.dispose(); });
  scene.remove(journey.group);
  journey.video.remove();
  dust.visible = true;
  journey = null;
}

// ======================================================================
// Navigáció
// ======================================================================
function resetAll() {
  runId++;
  tweens.length = 0;
  pendingSelect = null; pendingSkip = null;
  stopJourney();
  clearWorld();
  cube = null; halo = null;
  ['#hud', '#reticle', '#prompt', '#final', '#journeyBar'].forEach((s) => { $(s).hidden = true; });
}

async function startCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
      audio: false,
    });
    const cam = $('#cam');
    cam.srcObject = stream;
    await cam.play();
    document.body.classList.add('cam-on');
  } catch {
    document.body.classList.add('cam-off');
    toast(T().camFail);
  }
}

document.querySelectorAll('[data-lang]').forEach((b) => b.addEventListener('click', () => {
  lang = b.dataset.lang;
  applyI18n();
  // Mindkét engedélykérés a koppintás (felhasználói gesztus) alatt indul
  LookControls.requestPermission().then(() => look.connect());
  startCamera();
  show('#modes');
}));

document.querySelectorAll('[data-mode]').forEach((b) => b.addEventListener('click', () => {
  show(null);
  look.recenter();
  if (b.dataset.mode === 'config') runConfigurator();
  else if (JOURNEYS.length > 1) show('#videos');
  else runJourney(0);
}));

$('#btnBack').addEventListener('click', () => {
  const wasJourney = !!journey || !$('#journeyBar').hidden;
  resetAll();
  show(wasJourney && JOURNEYS.length > 1 ? '#videos' : '#modes');
});
$('#btnVideosBack').addEventListener('click', () => show('#modes'));
$('#btnRestart').addEventListener('click', () => { resetAll(); show(null); look.recenter(); runConfigurator(); });
$('#btnRecenter').addEventListener('click', () => {
  look.recenter();
  if (journey) journey.group.rotation.y = 0;
});

// ======================================================================
// Render ciklus
// ======================================================================
const clock = new THREE.Clock();
renderer.setAnimationLoop(() => {
  const dt = Math.min(clock.getDelta(), 0.1);
  time += dt;
  look.update();
  updateCards();
  updateTweens();
  updateCube(dt);
  dust.rotation.y += dt * 0.02;
  renderer.render(scene, camera);
});

// Fejlesztéshez: ?lang=hu&mode=config közvetlen indítás (asztali böngészőben egérrel húzva)
const qs = new URLSearchParams(location.search);
if (qs.get('lang')) {
  lang = qs.get('lang') === 'en' ? 'en' : 'hu';
  applyI18n();
  look.connect();
  if (qs.get('cam') !== '0') startCamera(); else document.body.classList.add('cam-off');
  show('#modes');
  if (qs.get('mode')) { show(null); qs.get('mode') === 'journey' ? runJourney(Number(qs.get('v')) || 0) : runConfigurator(); }
}
