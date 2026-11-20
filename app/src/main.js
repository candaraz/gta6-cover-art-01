// Vice Royale — Golden Hour Cover Studio (v6): the editor.
// Loads the cast + place photos, keeps the cover state, renders the live
// preview, and exports PNGs in three sizes. Also drives the ?shot= modes
// used for the entry screenshots (cover = poster only, editor = full UI).

import {
  CAST, PLACES, GRADES, GRADE_IDS, LAYOUTS, LAYOUT_IDS,
  loadImage, loadCast, loadPlaces, ensureFonts,
  drawCover, renderCoverCanvas, canvasToBlob,
} from './cover.js';

const params = new URLSearchParams(location.search);
const SHOT = params.get('shot'); // 'cover' | 'editor' | null
const SHOT_W = Number(params.get('w')) || 1280;
const SHOT_H = Number(params.get('h')) || 720;

const $ = (sel) => document.querySelector(sel);
const preview = $('#preview');
const pctx = preview.getContext('2d');

// ---- state -----------------------------------------------------------------

const DEFAULTS = {
  layout: 'hero-mosaic',
  grade: 'twilight',
  title: 'VICE ROYALE',
  script: 'chasing the last light',
  tagline: 'EIGHT FRIENDS  ·  ONE COAST  ·  NO WAY BACK',
  quote: '"THE HOTTEST RIDE OF THE YEAR"',
  gazette: 'GOLDEN MILE GAZETTE',
  vol: 'VOL. 1',
  seal: ['ORIGINAL', 'COVER ART'],
  sealSub: '★★★',
  wanted: true,
  frame: true,
  barcode: '0 18472 85991 8',
  billing: [
    'A VICE ROYALE PICTURE  ·  STARRING YOU AND YOUR CREW',
    'SHOT ON YOUR OWN CAMERA  ·  GRADED BY HAND  ·  NO PHOTO EVER LEAVES YOUR DEVICE',
  ],
  seed: 7,
};

let state = {
  ...DEFAULTS,
  images: {},   // panelKey -> HTMLImageElement
  focus: {},    // panelKey -> { x, y, zoom }
  selected: 'hero',
};

let castImages = {};
let placeImages = {};
let undoStack = [];
let redoStack = [];
let lastPanels = []; // panel rects from the last render (for hit-testing)

// Apply ?shot= / URL overrides (layout, grade, title, script, photo).
function applyUrlOverrides() {
  const pick = (name, list, fallback) => {
    const v = params.get(name);
    return v && list.includes(v) ? v : fallback;
  };
  state.layout = pick('layout', LAYOUT_IDS, state.layout);
  state.grade = pick('grade', GRADE_IDS, state.grade);
  if (params.get('title')) state.title = params.get('title').slice(0, 24);
  if (params.get('script')) state.script = params.get('script').slice(0, 40);
  if (params.get('tagline')) state.tagline = params.get('tagline').slice(0, 60);
  if (params.get('quote')) state.quote = params.get('quote').slice(0, 60);
  if (params.get('gazette')) state.gazette = params.get('gazette').slice(0, 30);
}

function snapshot() {
  return JSON.stringify({
    layout: state.layout, grade: state.grade, title: state.title,
    script: state.script, tagline: state.tagline, quote: state.quote,
    gazette: state.gazette, wanted: state.wanted, frame: state.frame,
    seal: state.seal, images: Object.fromEntries(
      Object.entries(state.images).map(([k, img]) => [k, img.dataset.src || img.src])),
    focus: state.focus,
  });
}

function restore(snap) {
  const d = JSON.parse(snap);
  state.layout = d.layout; state.grade = d.grade; state.title = d.title;
  state.script = d.script; state.tagline = d.tagline; state.quote = d.quote;
  state.gazette = d.gazette; state.wanted = d.wanted; state.frame = d.frame;
  state.seal = d.seal; state.focus = d.focus || {};
  state.images = {};
  for (const [k, src] of Object.entries(d.images || {})) {
    const img = castImages[k] || placeImages[k];
    if (img && (img.dataset.src === src || img.src === src)) state.images[k] = img;
  }
  syncInputs();
  render();
}

function pushUndo() {
  undoStack.push(snapshot());
  if (undoStack.length > 40) undoStack.shift();
  redoStack = [];
}

// ---- rendering ---------------------------------------------------------------

function previewSize() {
  // keep the preview at the aspect of the current export target
  const ratio = preview.width / preview.height;
  return { w: preview.width, h: preview.height, ratio };
}

export function render() {
  const { w, h } = previewSize();
  pctx.clearRect(0, 0, w, h);
  const result = drawCover(pctx, w, h, state);
  lastPanels = result.panels;
  document.title = 'shot-ready';
  document.documentElement.setAttribute('data-shot-ready', '1');
}

function setPreviewAspect(w, h) {
  preview.width = w;
  preview.height = h;
  render();
}

async function exportCover(w, h) {
  const status = $('#export-status');
  if (status) status.textContent = 'Rendering…';
  await ensureFonts();
  const canvas = renderCoverCanvas(w, h, state);
  const blob = await canvasToBlob(canvas);
  const a = document.createElement('a');
  const name = `vice-royale-${state.layout}-${state.grade}-${w}x${h}.png`;
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  if (status) status.textContent = `Saved ${name} (${Math.round(blob.size / 1024)} KB)`;
  return blob;
}

// ---- editor UI ---------------------------------------------------------------

function buildPickers() {
  const lp = $('#layout-picker');
  lp.innerHTML = '';
  for (const id of LAYOUT_IDS) {
    const b = document.createElement('button');
    b.className = 'btn' + (state.layout === id ? ' active' : '');
    b.innerHTML = `${LAYOUTS[id].label}<small>${LAYOUTS[id].hint}</small>`;
    b.onclick = () => { pushUndo(); state.layout = id; buildPickers(); render(); };
    lp.appendChild(b);
  }
  const gp = $('#grade-picker');
  gp.innerHTML = '';
  for (const id of GRADE_IDS) {
    const b = document.createElement('button');
    b.className = 'btn' + (state.grade === id ? ' active' : '');
    b.textContent = GRADES[id].label;
    b.onclick = () => { pushUndo(); state.grade = id; buildPickers(); render(); };
    gp.appendChild(b);
  }
}

function syncInputs() {
  const set = (sel, val) => { const el = $(sel); if (el) el.value = val; };
  set('#in-title', state.title);
  set('#in-script', state.script);
  set('#in-tagline', state.tagline);
  set('#in-quote', state.quote);
  set('#in-gazette', state.gazette);
  set('#in-seal1', state.seal[0]);
  set('#in-seal2', state.seal[1]);
  const w = $('#in-wanted'); if (w) w.checked = state.wanted;
  const f = $('#in-frame'); if (f) f.checked = state.frame;
  const sel = $('#selected-panel');
  if (sel) sel.textContent = 'Selected: ' + selectedLabel();
  buildPickers();
}

function selectedLabel() {
  const c = CAST.find((x) => x.id === state.selected);
  if (c) return `${c.role}${state.selected === 'hero' ? ' (hero)' : ''}`;
  const p = PLACES.find((x) => x.id === state.selected);
  if (p) return p.label;
  return state.selected;
}

function bindInputs() {
  const onText = (sel, key, max) => {
    const el = $(sel);
    if (!el) return;
    el.addEventListener('input', () => {
      state[key] = el.value.slice(0, max);
      render();
    });
    el.addEventListener('change', () => pushUndo());
  };
  onText('#in-title', 'title', 24);
  onText('#in-script', 'script', 40);
  onText('#in-tagline', 'tagline', 60);
  onText('#in-quote', 'quote', 60);
  onText('#in-gazette', 'gazette', 30);
  const s1 = $('#in-seal1'), s2 = $('#in-seal2');
  if (s1) s1.addEventListener('input', () => { state.seal[0] = s1.value.slice(0, 12); render(); });
  if (s2) s2.addEventListener('input', () => { state.seal[1] = s2.value.slice(0, 12); render(); });
  const w = $('#in-wanted');
  if (w) w.addEventListener('change', () => { pushUndo(); state.wanted = w.checked; render(); });
  const f = $('#in-frame');
  if (f) f.addEventListener('change', () => { pushUndo(); state.frame = f.checked; render(); });
  const zoom = $('#zoom');
  if (zoom) {
    zoom.addEventListener('input', () => {
      const cur = state.focus[state.selected] || { x: 0.5, y: 0.32, zoom: 1 };
      state.focus[state.selected] = { ...cur, zoom: Number(zoom.value) };
      render();
    });
    zoom.addEventListener('change', () => pushUndo());
  }
}

// ---- panel picking, dragging, zooming ---------------------------------------

function panelAt(clientX, clientY) {
  const rect = preview.getBoundingClientRect();
  const x = (clientX - rect.left) * (preview.width / rect.width);
  const y = (clientY - rect.top) * (preview.height / rect.height);
  // topmost last: iterate from the end (hero is drawn first, others after)
  for (let i = lastPanels.length - 1; i >= 0; i--) {
    const p = lastPanels[i];
    if (x >= p.x && x <= p.x + p.w && y >= p.y && y <= p.y + p.h) return p;
  }
  return null;
}

let drag = null;

function bindCanvas() {
  preview.addEventListener('pointerdown', (e) => {
    const p = panelAt(e.clientX, e.clientY);
    if (!p) return;
    state.selected = p.key;
    const cur = state.focus[p.key] || { x: 0.5, y: 0.32, zoom: 1 };
    const zoomEl = $('#zoom');
    if (zoomEl) zoomEl.value = String(cur.zoom);
    const sel = $('#selected-panel');
    if (sel) sel.textContent = 'Selected: ' + selectedLabel();
    drag = { key: p.key, startX: e.clientX, startY: e.clientY, focus: { ...cur } };
    preview.setPointerCapture(e.pointerId);
    render();
  });
  preview.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const rect = preview.getBoundingClientRect();
    const dx = (e.clientX - drag.startX) * (preview.width / rect.width);
    const dy = (e.clientY - drag.startY) * (preview.height / rect.height);
    const p = lastPanels.find((x) => x.key === drag.key);
    if (!p) return;
    const nx = Math.min(1, Math.max(0, drag.focus.x + dx / p.w));
    const ny = Math.min(1, Math.max(0, drag.focus.y + dy / p.h));
    state.focus[drag.key] = { ...drag.focus, x: nx, y: ny };
    render();
  });
  preview.addEventListener('pointerup', () => {
    if (drag) { pushUndo(); drag = null; }
  });
  preview.addEventListener('wheel', (e) => {
    e.preventDefault();
    const cur = state.focus[state.selected] || { x: 0.5, y: 0.32, zoom: 1 };
    const z = Math.min(2.5, Math.max(1, cur.zoom * (e.deltaY < 0 ? 1.08 : 0.92)));
    state.focus[state.selected] = { ...cur, zoom: z };
    const zoomEl = $('#zoom');
    if (zoomEl) zoomEl.value = String(z);
    render();
  }, { passive: false });
}

// ---- photos -------------------------------------------------------------------

function assignCastPhotos() {
  state.images = {};
  for (const c of CAST) {
    if (castImages[c.id]) state.images[c.id] = castImages[c.id];
  }
  // The hero is a tight close-up: bias the crop to the very top so the
  // chin sits above the title block instead of under it.
  state.focus = { hero: { x: 0.5, y: 0.0, zoom: 1 } };
}

function assignPlacePhotos() {
  // places become the side panels; the hero stays the hero portrait
  state.images = { hero: castImages.hero };
  const keys = ['driver', 'getaway', 'mechanic', 'boss', 'captain', 'brains', 'rider', 'lookout'];
  const placeKeys = ['boulevard', 'neon', 'pier', 'skyline'];
  keys.forEach((k, i) => {
    const pk = placeKeys[i % placeKeys.length];
    if (placeImages[pk]) state.images[k] = placeImages[pk];
  });
  state.focus = {};
}

function bindPhotos() {
  const input = $('#photo-input');
  if (input) {
    input.addEventListener('change', () => {
      const file = input.files && input.files[0];
      if (!file) return;
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        pushUndo();
        img.dataset.src = 'upload:' + file.name;
        state.images[state.selected] = img;
        state.focus[state.selected] = { x: 0.5, y: 0.32, zoom: 1 };
        render();
      };
      img.src = url;
      input.value = '';
    });
  }
  const reset = $('#btn-reset-cast');
  if (reset) reset.addEventListener('click', () => { pushUndo(); assignCastPhotos(); render(); });
  const samples = $('#btn-samples');
  if (samples) samples.addEventListener('click', () => { pushUndo(); assignPlacePhotos(); render(); });
}

// ---- export, undo/redo, auto, surprise ---------------------------------------

function bindActions() {
  document.querySelectorAll('[data-export]').forEach((b) => {
    b.addEventListener('click', () => {
      const [w, h] = b.dataset.export.split('x').map(Number);
      exportCover(w, h);
    });
  });
  const undo = $('#btn-undo');
  if (undo) undo.addEventListener('click', () => {
    if (!undoStack.length) return;
    redoStack.push(snapshot());
    restore(undoStack.pop());
  });
  const redo = $('#btn-redo');
  if (redo) redo.addEventListener('click', () => {
    if (!redoStack.length) return;
    undoStack.push(snapshot());
    restore(redoStack.pop());
  });
  const auto = $('#btn-auto');
  if (auto) auto.addEventListener('click', () => {
    pushUndo();
    // pick the layout whose panel count best matches the loaded photos
    const n = Object.keys(state.images).length;
    const byCount = LAYOUT_IDS.filter((id) => {
      const area = { x: 0, y: 0, w: 1000, h: 700 };
      return LAYOUTS[id].panels(area).length <= n;
    });
    state.layout = byCount.length ? byCount[byCount.length - 1] : 'hero-mosaic';
    buildPickers();
    render();
  });
  const surprise = $('#btn-surprise');
  if (surprise) surprise.addEventListener('click', () => {
    pushUndo();
    const rnd = (arr) => arr[Math.floor(Math.random() * arr.length)];
    state.layout = rnd(LAYOUT_IDS);
    state.grade = rnd(GRADE_IDS);
    // shuffle which cast photo sits in each side panel
    const keys = ['driver', 'getaway', 'mechanic', 'boss', 'captain', 'brains', 'rider', 'lookout'];
    const pool = keys.map((k) => castImages[k]).filter(Boolean);
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    keys.forEach((k, i) => { if (pool[i]) state.images[k] = pool[i]; });
    state.seed = Math.floor(Math.random() * 1000);
    buildPickers();
    render();
  });
}

// ---- shot mode (for the entry screenshots) ------------------------------------
// ?shot=cover renders just the poster (no editor chrome).
// ?shot=editor renders the full editor UI at the requested size.

async function runShotMode() {
  document.body.classList.add('shot');
  applyUrlOverrides();
  await ensureFonts();
  castImages = await loadCast();
  placeImages = await loadPlaces();
  assignCastPhotos();
  // a ?shot=cover photo override: use a place photo as the hero's backdrop
  const photo = params.get('photo');
  if (photo && placeImages[photo]) {
    state.images.hero = placeImages[photo];
  }
  setPreviewAspect(SHOT_W, SHOT_H);
  render();
}

// ---- init ----------------------------------------------------------------------

async function init() {
  applyUrlOverrides();
  if (SHOT === 'cover') {
    await runShotMode();
    return;
  }
  await ensureFonts();
  castImages = await loadCast();
  placeImages = await loadPlaces();
  assignCastPhotos();
  if (SHOT === 'editor') setPreviewAspect(SHOT_W, SHOT_H);
  else setPreviewAspect(1280, 720);
  buildPickers();
  bindInputs();
  bindCanvas();
  bindPhotos();
  bindActions();
  syncInputs();
  render();
}

init().catch((err) => {
  console.error(err);
  const status = $('#export-status');
  if (status) status.textContent = 'Could not load photos: ' + err.message;
});
