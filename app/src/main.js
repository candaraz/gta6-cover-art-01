// Vice Cover Studio — editor (v5).
// Owns the state, the photo library, the editor UI and the PNG exporter.
// All cover drawing lives in cover.js; this file only wires controls to it.

import {
  CAST, HERO_POP_SCENE, LAYOUTS, LAYOUT_IDS, GRADES, GRADE_IDS,
  defaultState, ensureFonts, renderCover,
} from './cover.js';

const $ = (id) => document.getElementById(id);
const canvas = $('coverCanvas');
const ctx = canvas.getContext('2d');

let state = defaultState();
let images = new Map(); // scene path -> HTMLImageElement
let selected = 0;
let undoStack = [];
let redoStack = [];
let exportSize = '1920x1080';
let renderQueued = false;

const LOOK_LABELS = [
  ['paint', 'Paint'], ['gradeAmt', 'Grade'], ['halftone', 'Halftone'],
  ['grain', 'Grain'], ['glow', 'Glow'],
];

function snapshot() {
  return JSON.stringify(state);
}
function pushUndo() {
  undoStack.push(snapshot());
  if (undoStack.length > 40) undoStack.shift();
  redoStack = [];
}
function restore(json) {
  state = JSON.parse(json);
  syncInputs();
  queueRender();
}

function loadImage(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

async function loadLibrary() {
  const paths = new Set();
  for (const c of CAST) paths.add(c.scene);
  paths.add(HERO_POP_SCENE);
  for (const p of paths) {
    const img = await loadImage(p);
    if (img) images.set(p, img);
  }
}

function queueRender() {
  if (renderQueued) return;
  renderQueued = true;
  requestAnimationFrame(async () => {
    renderQueued = false;
    await ensureFonts();
    const W = canvas.width, H = canvas.height;
    await renderCover(ctx, state, W, H, images, { forExport: false });
  });
}

// ---------------------------------------------------------------- pickers

function buildPickers() {
  const lp = $('layoutPicker');
  lp.innerHTML = '';
  for (const id of LAYOUT_IDS) {
    const b = document.createElement('button');
    b.textContent = LAYOUTS[id].label;
    b.dataset.id = id;
    if (id === state.layout) b.classList.add('on');
    b.addEventListener('click', () => {
      if (state.layout === id) return;
      pushUndo();
      state.layout = id;
      // The pop-out layout uses the 3/4 hero shot; other layouts use the portrait.
      if (id === 'pop-out') state.panels[0].scene = HERO_POP_SCENE;
      else if (state.panels[0].scene === HERO_POP_SCENE) state.panels[0].scene = CAST[0].scene;
      syncPickers();
      queueRender();
    });
    lp.appendChild(b);
  }
  const gp = $('gradePicker');
  gp.innerHTML = '';
  for (const id of GRADE_IDS) {
    const b = document.createElement('button');
    b.textContent = GRADES[id].label;
    b.dataset.id = id;
    if (id === state.grade) b.classList.add('on');
    b.addEventListener('click', () => {
      if (state.grade === id) return;
      pushUndo();
      state.grade = id;
      syncPickers();
      queueRender();
    });
    gp.appendChild(b);
  }
}

function syncPickers() {
  for (const b of $('layoutPicker').children) b.classList.toggle('on', b.dataset.id === state.layout);
  for (const b of $('gradePicker').children) b.classList.toggle('on', b.dataset.id === state.grade);
}

function buildSliders() {
  const box = $('lookSliders');
  box.innerHTML = '';
  for (const [key, label] of LOOK_LABELS) {
    const lab = document.createElement('label');
    lab.textContent = label + ' ';
    const out = document.createElement('output');
    out.textContent = Math.round(state.look[key] * 100) + '%';
    const inp = document.createElement('input');
    inp.type = 'range';
    inp.min = key === 'gradeAmt' ? 0 : 0;
    inp.max = key === 'gradeAmt' ? 1.5 : 1;
    inp.step = 0.05;
    inp.value = state.look[key];
    inp.addEventListener('input', () => {
      state.look[key] = Number(inp.value);
      out.textContent = Math.round(state.look[key] * 100) + '%';
      queueRender();
    });
    inp.addEventListener('change', () => pushUndo());
    lab.appendChild(out);
    lab.appendChild(inp);
    box.appendChild(lab);
  }
}

function buildPhotoStrip() {
  const strip = $('photoStrip');
  strip.innerHTML = '';
  const seen = new Set();
  for (const p of state.panels) seen.add(p.scene);
  for (const c of CAST) {
    if (!seen.has(c.scene)) continue;
    const img = images.get(c.scene);
    if (!img) continue;
    const t = document.createElement('img');
    t.src = c.scene;
    t.alt = c.role;
    t.title = c.role;
    t.addEventListener('click', () => {
      pushUndo();
      state.panels[selected].scene = c.scene;
      state.panels[selected].role = c.role;
      state.panels[selected].time = c.time;
      state.panels[selected].line = c.line;
      syncInputs();
      queueRender();
    });
    strip.appendChild(t);
  }
}

function buildSceneSelect() {
  const sel = $('sceneSelect');
  sel.innerHTML = '';
  for (const c of CAST) {
    const o = document.createElement('option');
    o.value = c.scene;
    o.textContent = `${c.role} — ${c.scene.split('/').pop()}`;
    sel.appendChild(o);
  }
  const pop = document.createElement('option');
  pop.value = HERO_POP_SCENE;
  pop.textContent = 'POP-OUT HERO — hero-pop.jpg';
  sel.appendChild(pop);
}

// ---------------------------------------------------------------- inputs

function syncInputs() {
  $('titleInput').value = state.title;
  $('scriptInput').value = state.script;
  $('quoteInput').value = state.quote;
  $('quoteSourceInput').value = state.quoteSource;
  $('taglineInput').value = state.tagline;
  $('furnitureToggle').checked = state.furniture !== false;
  $('goldFrameToggle').checked = state.goldFrame !== false;
  const p = state.panels[selected];
  $('panelName').textContent = p ? p.role : '—';
  $('zoomRange').value = p ? p.zoom : 1;
  $('dxRange').value = p ? p.dx : 0;
  $('dyRange').value = p ? p.dy : 0;
  $('roleInput').value = p ? p.role : '';
  $('timeInput').value = p ? p.time : '';
  $('lineInput').value = p ? p.line : '';
  $('sceneSelect').value = p ? p.scene : '';
  syncPickers();
  buildPhotoStrip();
}

function bindText(id, key) {
  $(id).addEventListener('input', () => {
    state[key] = $(id).value;
    queueRender();
  });
  $(id).addEventListener('change', () => pushUndo());
}

function bindPanelControls() {
  const p = () => state.panels[selected];
  $('zoomRange').addEventListener('input', () => { p().zoom = Number($('zoomRange').value); queueRender(); });
  $('dxRange').addEventListener('input', () => { p().dx = Number($('dxRange').value); queueRender(); });
  $('dyRange').addEventListener('input', () => { p().dy = Number($('dyRange').value); queueRender(); });
  for (const id of ['zoomRange', 'dxRange', 'dyRange'])
    $(id).addEventListener('change', () => pushUndo());
  $('roleInput').addEventListener('input', () => { p().role = $('roleInput').value.toUpperCase(); queueRender(); });
  $('timeInput').addEventListener('input', () => { p().time = $('timeInput').value.toUpperCase(); queueRender(); });
  $('lineInput').addEventListener('input', () => { p().line = $('lineInput').value.toUpperCase(); queueRender(); });
  $('sceneSelect').addEventListener('change', () => {
    pushUndo();
    const c = CAST.find((x) => x.scene === $('sceneSelect').value);
    p().scene = $('sceneSelect').value;
    if (c) { p().role = c.role; p().time = c.time; p().line = c.line; }
    syncInputs();
    queueRender();
  });
  $('faceBtn').addEventListener('click', () => {
    pushUndo();
    p().face = !p().face;
    if (p().face) { p().dy = 0; }
    syncInputs();
    queueRender();
  });
  $('flipBtn').addEventListener('click', () => { pushUndo(); p().flip = !p().flip; queueRender(); });
  $('swapBtn').addEventListener('click', () => {
    pushUndo();
    const n = (selected + 1) % state.panels.length;
    [state.panels[selected], state.panels[n]] = [state.panels[n], state.panels[selected]];
    selected = n;
    syncInputs();
    queueRender();
  });
  $('resetBtn').addEventListener('click', () => {
    pushUndo();
    const c = CAST.find((x) => x.scene === p().scene) || CAST[0];
    Object.assign(p(), { zoom: 1, dx: 0, dy: 0, flip: false, face: false, role: c.role, time: c.time, line: c.line });
    syncInputs();
    queueRender();
  });
  $('furnitureToggle').addEventListener('change', () => { pushUndo(); state.furniture = $('furnitureToggle').checked; queueRender(); });
  $('goldFrameToggle').addEventListener('change', () => { pushUndo(); state.goldFrame = $('goldFrameToggle').checked; queueRender(); });
}

// ---------------------------------------------------------------- canvas interaction

function canvasPoint(e) {
  const r = canvas.getBoundingClientRect();
  const sx = canvas.width / r.width, sy = canvas.height / r.height;
  return { x: (e.clientX - r.left) * sx, y: (e.clientY - r.top) * sy };
}

function panelAt(x, y) {
  // Recompute the current layout rects and find the panel under the point.
  const layout = LAYOUTS[state.layout];
  const rects = layout.rects(canvas.width, canvas.height);
  for (let i = rects.length - 1; i >= 0; i--) {
    const r = rects[i];
    if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) return i;
  }
  return -1;
}

let drag = null;
canvas.addEventListener('pointerdown', (e) => {
  const pt = canvasPoint(e);
  const i = panelAt(pt.x, pt.y);
  if (i < 0) return;
  selected = i;
  syncInputs();
  const p = state.panels[selected];
  drag = { x: pt.x, y: pt.y, dx: p.dx, dy: p.dy, moved: false };
  canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener('pointermove', (e) => {
  if (!drag) return;
  const pt = canvasPoint(e);
  const p = state.panels[selected];
  const nx = drag.dx + (pt.x - drag.x) / (canvas.width * 0.4);
  const ny = drag.dy + (pt.y - drag.y) / (canvas.height * 0.4);
  if (Math.abs(nx - p.dx) > 0.01 || Math.abs(ny - p.dy) > 0.01) drag.moved = true;
  p.dx = Math.max(-1, Math.min(1, nx));
  p.dy = Math.max(-1, Math.min(1, ny));
  syncInputs();
  queueRender();
});
canvas.addEventListener('pointerup', () => {
  if (drag && drag.moved) pushUndo();
  drag = null;
});
canvas.addEventListener('dblclick', (e) => {
  const pt = canvasPoint(e);
  const i = panelAt(pt.x, pt.y);
  if (i < 0) return;
  pushUndo();
  selected = i;
  const p = state.panels[selected];
  Object.assign(p, { zoom: 1, dx: 0, dy: 0, flip: false, face: false });
  syncInputs();
  queueRender();
});
canvas.addEventListener('wheel', (e) => {
  const pt = canvasPoint(e);
  const i = panelAt(pt.x, pt.y);
  if (i < 0) return;
  e.preventDefault();
  pushUndo();
  selected = i;
  const p = state.panels[selected];
  p.zoom = Math.max(1, Math.min(2.4, p.zoom - Math.sign(e.deltaY) * 0.08));
  syncInputs();
  queueRender();
}, { passive: false });

// ---------------------------------------------------------------- export

async function exportPNG(w, h, filename) {
  await ensureFonts();
  const off = document.createElement('canvas');
  off.width = w; off.height = h;
  const g = off.getContext('2d');
  await renderCover(g, state, w, h, images, { forExport: true });
  const url = off.toDataURL('image/png');
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  return { w, h };
}

function slug(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'cover';
}

$('exportBtn').addEventListener('click', async () => {
  const [w, h] = exportSize.split('x').map(Number);
  await exportPNG(w, h, `${slug(state.title)}-${w}x${h}.png`);
});
$('exportAllBtn').addEventListener('click', async () => {
  for (const [w, h] of [[1920, 1080], [1080, 1080], [1080, 1350]]) {
    // eslint-disable-next-line no-await-in-loop
    await exportPNG(w, h, `${slug(state.title)}-${w}x${h}.png`);
  }
});
for (const b of document.querySelectorAll('.size')) {
  b.addEventListener('click', () => {
    exportSize = b.dataset.size;
    for (const x of document.querySelectorAll('.size')) x.classList.toggle('on', x === b);
    const [w, h] = exportSize.split('x').map(Number);
    canvas.width = w; canvas.height = h;
    queueRender();
  });
}

// ---------------------------------------------------------------- undo / redo / surprise / auto

$('undoBtn').addEventListener('click', () => {
  if (!undoStack.length) return;
  redoStack.push(snapshot());
  restore(undoStack.pop());
});
$('redoBtn').addEventListener('click', () => {
  if (!redoStack.length) return;
  undoStack.push(snapshot());
  restore(redoStack.pop());
});
$('surpriseBtn').addEventListener('click', () => {
  pushUndo();
  const layouts = LAYOUT_IDS;
  const grades = GRADE_IDS;
  state.layout = layouts[Math.floor(Math.random() * layouts.length)];
  state.grade = grades[Math.floor(Math.random() * grades.length)];
  const titles = [
    ['VICE ROYALE', 'chasing the last light'],
    ['PALM ROYALE', 'run the night'],
    ['MIDNIGHT VICE', "after dark, everything's for sale"],
    ['GOLDEN COAST', 'one last summer'],
    ['NEON HARBOR', 'the city never sleeps'],
  ];
  const t = titles[Math.floor(Math.random() * titles.length)];
  state.title = t[0]; state.script = t[1];
  if (state.layout === 'pop-out') state.panels[0].scene = HERO_POP_SCENE;
  syncInputs();
  queueRender();
});
$('autoBtn').addEventListener('click', () => {
  pushUndo();
  // Pick a hero layout that fits the photo count: few photos -> big hero.
  state.layout = state.panels.length <= 5 ? 'hero-three' : 'hero-mosaic';
  syncInputs();
  queueRender();
});

$('fileInput').addEventListener('change', async (e) => {
  const files = [...e.target.files];
  for (const f of files) {
    // eslint-disable-next-line no-await-in-loop
    const url = URL.createObjectURL(f);
    const img = await loadImage(url);
    if (!img) continue;
    const key = 'user:' + f.name;
    images.set(key, img);
    pushUndo();
    // Fill the first panel, or append a new one if room.
    const target = state.panels.find((p) => p.scene.startsWith('user:')) || state.panels[0];
    target.scene = key;
    target.role = f.name.replace(/\.[^.]+$/, '').toUpperCase().slice(0, 18) || 'YOUR PHOTO';
    target.time = '';
    target.line = 'YOUR PHOTO';
  }
  buildSceneSelect();
  syncInputs();
  queueRender();
  e.target.value = '';
});

// ---------------------------------------------------------------- shot mode
// ?shot=cover renders a cover at the canvas size (used by shots.js to take
// the exported-cover screenshots); ?shot=editor leaves the editor as-is.
// ?layout=, ?grade=, ?title=, ?script=, ?photo= override the state.

async function applyShotParams() {
  const q = new URLSearchParams(location.search);
  if (!q.has('shot')) return false;
  if (q.get('shot') === 'cover') document.body.classList.add('shot-cover');
  if (q.get('layout')) state.layout = q.get('layout');
  if (q.get('grade')) state.grade = q.get('grade');
  if (q.get('title')) state.title = q.get('title');
  if (q.get('script')) state.script = q.get('script');
  if (q.get('quote')) state.quote = q.get('quote');
  if (q.get('tagline')) state.tagline = q.get('tagline');
  if (q.get('w')) canvas.width = Number(q.get('w'));
  if (q.get('h')) canvas.height = Number(q.get('h'));
  if (state.layout === 'pop-out') state.panels[0].scene = HERO_POP_SCENE;
  return true;
}

// ---------------------------------------------------------------- init

async function init() {
  buildPickers();
  buildSliders();
  buildSceneSelect();
  bindText('titleInput', 'title');
  bindText('scriptInput', 'script');
  bindText('quoteInput', 'quote');
  bindText('quoteSourceInput', 'quoteSource');
  bindText('taglineInput', 'tagline');
  bindPanelControls();
  await loadLibrary();
  const shot = await applyShotParams();
  syncInputs();
  await ensureFonts();
  await renderCover(ctx, state, canvas.width, canvas.height, images, { forExport: !!shot });
  document.body.dataset.ready = '1';
  queueRender();
}

init();
