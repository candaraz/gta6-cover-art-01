// main.js — the Vice Cover Studio editor.
// Three steps from a photo to a PNG: 1 Add photos, 2 Caption, 3 Export.
// The preview canvas draws the cover live; exports render the same cover
// to an offscreen canvas at the post size and download it as a PNG.

import { LAYOUTS, GRADES, STRIPES, DEFAULT_CAST, PLACE_SCENES, defaultState, renderCover, loadImages, scenePath } from './cover.js';
import { runShot, sizePreviewForShot } from './shots.js';

const $ = (id) => document.getElementById(id);
const params = new URLSearchParams(location.search);
const inShot = params.has('shot');

const state = defaultState();
const images = {};
let selected = 0;
let undoStack = [];
let redoStack = [];
let drag = null;

function snapshot() {
  return JSON.stringify(state);
}
function pushUndo() {
  undoStack.push(snapshot());
  if (undoStack.length > 40) undoStack.shift();
  redoStack = [];
  updateUndoButtons();
}
function restore(json) {
  const s = JSON.parse(json);
  Object.assign(state, s);
  state.panels = s.panels;
  state.look = s.look;
  syncControls();
  render();
}
function undo() {
  if (!undoStack.length) return;
  redoStack.push(snapshot());
  restore(undoStack.pop());
  updateUndoButtons();
}
function redo() {
  if (!redoStack.length) return;
  undoStack.push(snapshot());
  restore(redoStack.pop());
  updateUndoButtons();
}
function updateUndoButtons() {
  $('undo').disabled = !undoStack.length;
  $('redo').disabled = !redoStack.length;
}

const SCENES = [
  ...DEFAULT_CAST.map((c) => c.scene),
  ...PLACE_SCENES.map((c) => c.scene),
  'boulevard', 'pier',
];

async function loadAllScenes() {
  const sources = {};
  for (const s of SCENES) sources[s] = s === 'boulevard' || s === 'pier' ? `./samples/${s}.jpg` : scenePath(s);
  const loaded = await loadImages(sources);
  Object.assign(images, loaded);
}

function applyShotParams() {
  // ?shot=cover&layout=hero-three&grade=neon&title=...&script=...&quote=...
  if (params.get('layout')) state.layout = params.get('layout');
  if (params.get('grade')) state.grade = params.get('grade');
  if (params.get('title')) state.title = params.get('title');
  if (params.get('script')) state.script = params.get('script');
  if (params.get('quote')) state.quote = params.get('quote');
  if (params.get('tagline')) state.tagline = params.get('tagline');
  const cast = params.get('cast');
  if (cast) {
    const roles = cast.split(',');
    state.panels = roles.map((r, i) => {
      const found = [...DEFAULT_CAST, ...PLACE_SCENES].find((c) => c.role === r);
      return found ? { ...found, fx: 0.5, fy: 0.32, zoom: 1.0, face: true, src: null } : state.panels[i % state.panels.length];
    });
  }
}

const preview = $('preview');
const pctx = preview.getContext('2d');
let lastRects = [];

function render() {
  const W = preview.width, H = preview.height;
  const out = renderCover(pctx, W, H, state, images, { showSelection: !inShot, selected });
  lastRects = out.rects;
  updatePanelList();
}

function updatePanelList() {
  const list = $('panels');
  if (!list) return;
  list.innerHTML = '';
  state.panels.forEach((p, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'panel-chip' + (i === selected ? ' on' : '');
    b.textContent = `${i + 1} · ${p.role}`;
    b.onclick = () => { selected = i; syncPanelControls(); render(); };
    list.appendChild(b);
  });
}

function syncPanelControls() {
  const p = state.panels[selected];
  if (!p) return;
  $('panel-role').value = p.role;
  $('panel-sub').value = p.sub || '';
  $('panel-zoom').value = Math.round(p.zoom * 100);
  $('panel-fx').value = Math.round(p.fx * 100);
  $('panel-fy').value = Math.round(p.fy * 100);
  $('panel-face').checked = !!p.face;
  $('panel-scene').value = p.scene;
}

function syncControls() {
  $('title').value = state.title;
  $('script').value = state.script;
  $('quote').value = state.quote;
  $('quote-source').value = state.quoteSource;
  $('tagline').value = state.tagline;
  $('billing').value = state.billing;
  $('billing2').value = state.billing2;
  $('furniture').checked = state.furniture !== false;
  document.querySelectorAll('[data-layout]').forEach((b) => b.classList.toggle('on', b.dataset.layout === state.layout));
  document.querySelectorAll('[data-grade]').forEach((b) => b.classList.toggle('on', b.dataset.grade === state.grade));
  $('look-paint').value = state.look.paint;
  $('look-grade').value = state.look.grade;
  $('look-halftone').value = state.look.halftone;
  $('look-grain').value = state.look.grain;
  $('look-glow').value = state.look.glow;
  syncPanelControls();
}

function bindControls() {
  document.querySelectorAll('[data-layout]').forEach((b) => {
    b.onclick = () => { pushUndo(); state.layout = b.dataset.layout; syncControls(); render(); };
  });
  document.querySelectorAll('[data-grade]').forEach((b) => {
    b.onclick = () => { pushUndo(); state.grade = b.dataset.grade; syncControls(); render(); };
  });
  const text = (id, key) => {
    $(id).addEventListener('input', () => { state[key] = $(id).value; render(); });
    $(id).addEventListener('change', () => pushUndo());
  };
  text('title', 'title');
  text('script', 'script');
  text('quote', 'quote');
  text('quote-source', 'quoteSource');
  text('tagline', 'tagline');
  text('billing', 'billing');
  text('billing2', 'billing2');
  $('furniture').addEventListener('change', () => { pushUndo(); state.furniture = $('furniture').checked; render(); });
  const look = (id, key) => {
    $(id).addEventListener('input', () => { state.look[key] = Number($(id).value); render(); });
    $(id).addEventListener('change', () => pushUndo());
  };
  look('look-paint', 'paint');
  look('look-grade', 'grade');
  look('look-halftone', 'halftone');
  look('look-grain', 'grain');
  look('look-glow', 'glow');
  $('undo').onclick = undo;
  $('redo').onclick = redo;
  $('surprise').onclick = () => {
    pushUndo();
    const layouts = LAYOUTS.map((l) => l.id);
    const grades = GRADES.map((g) => g.id);
    state.layout = layouts[Math.floor(Math.random() * layouts.length)];
    state.grade = grades[Math.floor(Math.random() * grades.length)];
    // Shuffle the cast.
    for (let i = state.panels.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [state.panels[i], state.panels[j]] = [state.panels[j], state.panels[i]];
    }
    syncControls();
    render();
  };
  $('auto-layout').onclick = () => {
    pushUndo();
    // Pick the layout that fits the cast best: hero layouts for portraits.
    const heroLayouts = ['hero-mosaic', 'hero-three', 'diagonal-trio', 'seven-mosaic'];
    state.layout = heroLayouts[Math.floor(Math.random() * heroLayouts.length)];
    syncControls();
    render();
  };
}

// ---- per-panel controls ----

function bindPanelControls() {
  const p = () => state.panels[selected];
  $('panel-role').addEventListener('input', () => { p().role = $('panel-role').value; render(); });
  $('panel-role').addEventListener('change', () => pushUndo());
  $('panel-sub').addEventListener('input', () => { p().sub = $('panel-sub').value; render(); });
  $('panel-sub').addEventListener('change', () => pushUndo());
  $('panel-zoom').addEventListener('input', () => { p().zoom = Number($('panel-zoom').value) / 100; render(); });
  $('panel-zoom').addEventListener('change', () => pushUndo());
  $('panel-fx').addEventListener('input', () => { p().fx = Number($('panel-fx').value) / 100; render(); });
  $('panel-fx').addEventListener('change', () => pushUndo());
  $('panel-fy').addEventListener('input', () => { p().fy = Number($('panel-fy').value) / 100; render(); });
  $('panel-fy').addEventListener('change', () => pushUndo());
  $('panel-face').addEventListener('change', () => { pushUndo(); p().face = $('panel-face').checked; render(); });
  $('panel-scene').addEventListener('change', () => {
    pushUndo();
    const scene = $('panel-scene').value;
    const found = [...DEFAULT_CAST, ...PLACE_SCENES].find((c) => c.scene === scene);
    p().scene = scene;
    if (found) { p().role = found.role; p().sub = found.sub; }
    if (scene === 'boulevard') { p().role = 'OCEAN DRIVE'; p().sub = '3:15 PM — THE BOULEVARD'; }
    if (scene === 'pier') { p().role = 'OLD PIER'; p().sub = '5:40 PM — ONE MORE CAST'; }
    syncPanelControls();
    render();
  });
  $('panel-reset').onclick = () => {
    pushUndo();
    const panel = p();
    panel.fx = 0.5; panel.fy = 0.32; panel.zoom = 1.0; panel.face = true;
    syncPanelControls();
    render();
  };
  $('panel-flip').onclick = () => {
    pushUndo();
    p().fx = 1 - p().fx;
    syncPanelControls();
    render();
  };
  $('panel-swap').onclick = () => {
    pushUndo();
    const next = (selected + 1) % state.panels.length;
    [state.panels[selected], state.panels[next]] = [state.panels[next], state.panels[selected]];
    selected = next;
    syncControls();
    render();
  };
  // Drag to reposition the selected panel's photo.
  preview.addEventListener('pointerdown', (e) => {
    const r = preview.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * preview.width;
    const y = ((e.clientY - r.top) / r.height) * preview.height;
    const i = lastRects.findIndex((rc) => x >= rc.x && x < rc.x + rc.w && y >= rc.y && y < rc.y + rc.h);
    if (i >= 0) {
      selected = i;
      syncPanelControls();
      drag = { x, y, fx: state.panels[i].fx, fy: state.panels[i].fy, rect: lastRects[i] };
      preview.setPointerCapture(e.pointerId);
      render();
    }
  });
  preview.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const r = preview.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * preview.width;
    const y = ((e.clientY - r.top) / r.height) * preview.height;
    const panel = state.panels[selected];
    const rc = drag.rect;
    panel.fx = Math.max(0, Math.min(1, drag.fx - (x - drag.x) / rc.w));
    panel.fy = Math.max(0, Math.min(1, drag.fy - (y - drag.y) / rc.h));
    render();
  });
  preview.addEventListener('pointerup', () => {
    if (drag) { pushUndo(); drag = null; }
  });
  // Photo upload: read on this machine, never uploaded.
  $('photo').addEventListener('change', async (e) => {
    const files = [...e.target.files];
    for (const file of files) {
      const url = URL.createObjectURL(file);
      const key = 'user-' + Math.random().toString(36).slice(2, 8);
      const img = new Image();
      await new Promise((resolve) => { img.onload = resolve; img.onerror = resolve; img.src = url; });
      if (!img.naturalWidth) continue;
      images[key] = img;
      pushUndo();
      const panel = state.panels[selected];
      panel.scene = key;
      panel.src = url;
      panel.role = file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ').toUpperCase().slice(0, 18) || 'YOUR PHOTO';
      panel.sub = 'JUST NOW — STRAIGHT FROM YOUR CAMERA';
      selected = (selected + 1) % state.panels.length;
      syncControls();
      render();
    }
    e.target.value = '';
  });
}

// ---- export ----

function exportPNG(w, h) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  renderCover(ctx, w, h, state, images, { showSelection: false });
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
}

function download(blob, name) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}

function bindExport() {
  // Test hook: the shot runner calls this to verify export dimensions.
  window.__viceExport = exportPNG;
  const size = () => document.querySelector('input[name="size"]:checked').value;
  $('export').onclick = async () => {
    const [w, h] = size().split('x').map(Number);
    $('status').textContent = 'Rendering…';
    const blob = await exportPNG(w, h);
    download(blob, `vice-cover-${w}x${h}.png`);
    $('status').textContent = `Exported ${w} × ${h} PNG.`;
  };
  $('export-all').onclick = async () => {
    $('status').textContent = 'Rendering all three…';
    for (const [w, h] of [[1920, 1080], [1080, 1080], [1080, 1350]]) {
      const blob = await exportPNG(w, h);
      download(blob, `vice-cover-${w}x${h}.png`);
      await new Promise((r) => setTimeout(r, 300));
    }
    $('status').textContent = 'Exported all three sizes.';
  };
}

// ---- steps ----

function bindSteps() {
  document.querySelectorAll('[data-step]').forEach((b) => {
    b.onclick = () => {
      document.querySelectorAll('[data-step]').forEach((x) => x.classList.toggle('on', x === b));
      document.querySelectorAll('.step-panel').forEach((p) => p.classList.toggle('on', p.dataset.panel === b.dataset.step));
    };
  });
}

// ---- init ----

async function init() {
  sizePreviewForShot(params.get('shot'), preview);
  // Load the display fonts explicitly: @font-face fonts only load when used,
  // and document.fonts.ready alone does not wait for them, so measureText
  // would use a fallback and the title would overflow once the real font
  // arrived. Load each face at a large size before the first render.
  try {
    await Promise.all([
      document.fonts.load('900 100px "Passion One"'),
      document.fonts.load('400 100px "Yellowtail"'),
      document.fonts.load('800 40px "Barlow Condensed"'),
      document.fonts.load('700 40px "Barlow Condensed"'),
      document.fonts.load('400 40px "Anton"'),
    ]);
  } catch (e) { /* fall back to system fonts if a face fails */ }
  // Build the layout / grade pickers and the scene menu from the data.
  const layoutRow = $('layouts');
  for (const l of LAYOUTS) {
    const b = document.createElement('button');
    b.type = 'button';
    b.dataset.layout = l.id;
    b.textContent = l.name;
    b.title = l.desc;
    layoutRow.appendChild(b);
  }
  const gradeRow = $('grades');
  for (const g of GRADES) {
    const b = document.createElement('button');
    b.type = 'button';
    b.dataset.grade = g.id;
    b.textContent = g.name;
    gradeRow.appendChild(b);
  }
  const sceneSel = $('panel-scene');
  for (const s of SCENES) {
    const o = document.createElement('option');
    o.value = s;
    o.textContent = s;
    sceneSel.appendChild(o);
  }
  applyShotParams();
  await loadAllScenes();
  await document.fonts.ready;
  bindControls();
  bindPanelControls();
  bindExport();
  bindSteps();
  syncControls();
  render();
  document.title = 'Vice Cover Studio — ready';
  if (inShot) runShot(params.get('shot'));
  else window.__shotReady = true;
}

init();
