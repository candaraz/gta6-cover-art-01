// main.js — Vice Cover Studio editor.
// Wires the page to the cover renderer: layout and grade pickers, title
// and caption editing, per-panel photo/crop controls, photo upload and
// PNG export in the three post sizes. Photos never leave the machine.

import { SCENES, GRADES, LAYOUTS, loadImage, drawCover, renderCover, defaultState } from './cover.js';
import { runShot } from './shots.js';

export const SIZES = [
  { id: 'wide', label: '1920 × 1080', w: 1920, h: 1080 },
  { id: 'square', label: '1080 × 1080', w: 1080, h: 1080 },
  { id: 'story', label: '1080 × 1350', w: 1080, h: 1350 },
];

// The nine bundled scenes plus any photos the user loads, keyed by the
// path the cover renderer looks up.
const images = {};
const userPhotos = [];
let state = defaultState('nine', 'sunset');
let size = SIZES[0];
let selected = 0;
let dragging = null;
// True while rendering a screenshot (?shot=…): the selection outline is
// an editor-only aid and must never be baked into a shot or an export.
let inShot = false;

const $ = (id) => document.getElementById(id);
const preview = $('preview');
const pctx = preview.getContext('2d');

// Loads the four display fonts, then every bundled scene image.
async function loadAll() {
  await Promise.all([
    document.fonts.load('900 100px "Passion One"'),
    document.fonts.load('100px "Yellowtail"'),
    document.fonts.load('800 40px "Barlow Condensed"'),
    document.fonts.load('700 40px "Barlow Condensed"'),
    document.fonts.load('400 40px "Anton"'),
  ]).catch(() => {});
  await document.fonts.ready.catch(() => {});
  await Promise.all(
    SCENES.map((s) =>
      loadImage(s.file)
        .then((img) => { images[s.file] = img; })
        .catch(() => {}),
    ),
  );
}

// Draws the current state into the preview canvas at half resolution so
// the editor stays fast; exports render at full size.
function render() {
  const scale = 0.5;
  const w = Math.round(size.w * scale);
  const h = Math.round(size.h * scale);
  if (preview.width !== w || preview.height !== h) {
    preview.width = w;
    preview.height = h;
  }
  pctx.clearRect(0, 0, w, h);
  drawCover(pctx, state, images, w, h);
  if (!inShot) highlightSelected();
}

// Outlines the selected panel on the preview so the user sees which one
// the panel controls will change.
function highlightSelected() {
  const layout = LAYOUTS[state.layout] || LAYOUTS.nine;
  const panels = layout.panels();
  const p = panels[selected];
  if (!p) return;
  const w = preview.width;
  const h = preview.height;
  pctx.save();
  pctx.strokeStyle = '#FF2E88';
  pctx.lineWidth = 4;
  pctx.setLineDash([12, 8]);
  pctx.strokeRect(p.x * w + 2, p.y * h + 2, p.w * w - 4, p.h * h - 4);
  pctx.restore();
}

// Builds one row of toggle buttons from a list of {id, name/label}.
function buildRow(el, items, current, onPick) {
  el.innerHTML = '';
  items.forEach((item) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = item.name || item.label;
    b.setAttribute('aria-pressed', item.id === current ? 'true' : 'false');
    b.addEventListener('click', () => {
      onPick(item.id);
      [...el.querySelectorAll('button')].forEach((x) => x.setAttribute('aria-pressed', 'false'));
      b.setAttribute('aria-pressed', 'true');
    });
    el.appendChild(b);
  });
}

function refreshPickers() {
  buildRow($('layouts'), Object.entries(LAYOUTS).map(([id, l]) => ({ id, name: l.name })), state.layout, (id) => {
    state.layout = id;
    const panels = LAYOUTS[id].panels();
    state.panels = panels.map((p, i) => state.panels[i] || { scene: i % SCENES.length, x: 0.5, y: p.hero ? 0.32 : 0.5, zoom: 1 });
    selected = 0;
    syncPanelBox();
    render();
  });
  buildRow($('grades'), Object.entries(GRADES).map(([id, g]) => ({ id, name: g.name })), state.grade, (id) => {
    state.grade = id;
    render();
  });
  buildRow($('sizes'), SIZES, size.id, (id) => {
    size = SIZES.find((s) => s.id === id);
    render();
  });
}

// Fills the panel-photo select with the bundled scenes and user photos.
function refreshPhotoOptions() {
  const sel = $('panelPhoto');
  sel.innerHTML = '';
  SCENES.forEach((s, i) => {
    const o = document.createElement('option');
    o.value = 'scene:' + i;
    o.textContent = s.place + ' — ' + s.file.split('/').pop();
    sel.appendChild(o);
  });
  userPhotos.forEach((p, i) => {
    const o = document.createElement('option');
    o.value = 'user:' + i;
    o.textContent = 'Your photo — ' + p.name;
    sel.appendChild(o);
  });
}

// Gives a panel a scene, swapping with any other panel already showing
// that scene, so the cover never repeats a photo.
function assignScene(panelIndex, sceneIndex) {
  const other = state.panels.findIndex((p, i) => i !== panelIndex && !p.userPhoto && p.scene % SCENES.length === sceneIndex % SCENES.length);
  if (other >= 0) {
    const old = state.panels[panelIndex].scene;
    state.panels[other].scene = old;
    state.panels[other].userPhoto = null;
  }
  state.panels[panelIndex].scene = sceneIndex;
  state.panels[panelIndex].userPhoto = null;
}

// Shows the selected panel's photo, place, tagline and zoom in the box.
function syncPanelBox() {
  const ps = state.panels[selected] || { scene: 0, x: 0.5, y: 0.5, zoom: 1 };
  const scene = SCENES[ps.scene % SCENES.length];
  $('panelPhoto').value = 'scene:' + (ps.scene % SCENES.length);
  $('panelPlace').value = scene.place;
  $('panelTag').value = scene.time + ' — ' + scene.tag;
  $('panelZoom').value = ps.zoom;
  $('panelHint').textContent =
    'Panel ' + (selected + 1) + ' of ' + state.panels.length + ' — ' + scene.place + '. Drag it to reposition the photo.';
}

// ---- panel interaction ----

// Which panel, if any, sits under a point on the preview canvas.
function panelAt(cx, cy) {
  const layout = LAYOUTS[state.layout] || LAYOUTS.nine;
  const panels = layout.panels();
  const w = preview.width;
  const h = preview.height;
  for (let i = panels.length - 1; i >= 0; i--) {
    const p = panels[i];
    if (cx >= p.x * w && cx <= (p.x + p.w) * w && cy >= p.y * h && cy <= (p.y + p.h) * h) return i;
  }
  return -1;
}

function canvasPoint(ev) {
  const r = preview.getBoundingClientRect();
  const x = ((ev.clientX - r.left) / r.width) * preview.width;
  const y = ((ev.clientY - r.top) / r.height) * preview.height;
  return { x, y };
}

preview.addEventListener('pointerdown', (ev) => {
  const { x, y } = canvasPoint(ev);
  const i = panelAt(x, y);
  if (i < 0) return;
  selected = i;
  syncPanelBox();
  const ps = state.panels[i];
  dragging = { x, y, cx: ps.x, cy: ps.y, panel: i };
  preview.setPointerCapture(ev.pointerId);
  render();
});

preview.addEventListener('pointermove', (ev) => {
  if (!dragging) return;
  const { x, y } = canvasPoint(ev);
  const layout = LAYOUTS[state.layout] || LAYOUTS.nine;
  const p = layout.panels()[dragging.panel];
  const ps = state.panels[dragging.panel];
  const pw = p.w * preview.width;
  const ph = p.h * preview.height;
  const span = 1 / (ps.zoom || 1);
  ps.x = Math.min(1, Math.max(0, dragging.cx - ((x - dragging.x) / pw) * span));
  ps.y = Math.min(1, Math.max(0, dragging.cy - ((y - dragging.y) / ph) * span));
  render();
});

preview.addEventListener('pointerup', () => { dragging = null; });

// ---- inputs ----

function wireInputs() {
  $('title').addEventListener('input', (ev) => { state.title = ev.target.value.toUpperCase() || 'VICE ROYALE'; render(); });
  $('script').addEventListener('input', (ev) => { state.script = ev.target.value || 'chasing the last light'; render(); });
  $('quote').addEventListener('input', (ev) => { state.quote = ev.target.value || 'THE COAST HAS NEVER LOOKED THIS GUILTY.'; render(); });
  $('tagline').addEventListener('input', (ev) => { state.tagline = ev.target.value.toUpperCase() || 'EVERY SUNSET HAS A PRICE'; render(); });
  $('furniture').addEventListener('change', (ev) => { state.furniture = ev.target.checked; render(); });

  $('panelPhoto').addEventListener('change', (ev) => {
    const ps = state.panels[selected];
    const [kind, idx] = ev.target.value.split(':');
    if (kind === 'user') {
      const photo = userPhotos[Number(idx)];
      ps.userPhoto = photo ? photo.url : null;
      ps.scene = 0;
    } else {
      assignScene(selected, Number(idx));
    }
    syncPanelBox();
    render();
  });
  $('panelPlace').addEventListener('input', (ev) => {
    const scene = SCENES[state.panels[selected].scene % SCENES.length];
    scene.place = ev.target.value.toUpperCase() || scene.place;
    render();
  });
  $('panelTag').addEventListener('input', (ev) => {
    const scene = SCENES[state.panels[selected].scene % SCENES.length];
    const parts = ev.target.value.split('—');
    scene.time = (parts[0] || '').trim();
    scene.tag = (parts[1] || '').trim().toUpperCase();
    render();
  });
  $('panelZoom').addEventListener('input', (ev) => {
    state.panels[selected].zoom = Number(ev.target.value);
    render();
  });

  // Photo upload: read on this machine, never sent anywhere.
  $('photo').addEventListener('change', (ev) => {
    const files = [...ev.target.files];
    if (!files.length) return;
    let loaded = 0;
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        userPhotos.push({ name: file.name, url: reader.result });
        const img = new Image();
        img.onload = () => {
          images[reader.result] = img;
          loaded++;
          if (loaded === files.length) {
            refreshPhotoOptions();
            const hero = state.panels[0];
            hero.userPhoto = userPhotos[userPhotos.length - 1].url;
            $('panelPhoto').value = 'user:' + (userPhotos.length - 1);
            selected = 0;
            syncPanelBox();
            render();
            $('status').textContent = files.length + ' photo' + (files.length > 1 ? 's' : '') + ' loaded — on your machine only.';
          }
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  });

  $('surprise').addEventListener('click', () => {
    const layouts = Object.keys(LAYOUTS);
    const grades = Object.keys(GRADES);
    const titles = [
      ['VICE ROYALE', 'chasing the last light'],
      ['PALM ROYALE', 'run the night'],
      ['MIDNIGHT VICE', "after dark, everything's for sale"],
      ['NEON TIDE', 'six nights in paradise'],
      ['SUNSET HEIST', 'one coast, no rules'],
    ];
    const pick = titles[Math.floor(Math.random() * titles.length)];
    state.layout = layouts[Math.floor(Math.random() * layouts.length)];
    state.grade = grades[Math.floor(Math.random() * grades.length)];
    state.title = pick[0];
    state.script = pick[1];
    $('title').value = pick[0];
    $('script').value = pick[1];
    const panels = LAYOUTS[state.layout].panels();
    state.panels = panels.map((p, i) => state.panels[i] || { scene: i % SCENES.length, x: 0.5, y: p.hero ? 0.32 : 0.5, zoom: 1 });
    selected = 0;
    refreshPickers();
    syncPanelBox();
    render();
  });

  $('export').addEventListener('click', () => {
    $('status').textContent = 'Exporting ' + size.label + '…';
    const canvas = renderCover(state, images, size.w, size.h);
    canvas.toBlob((blob) => {
      if (!blob) {
        $('status').textContent = 'Export failed — try again.';
        return;
      }
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'vice-cover-' + size.w + 'x' + size.h + '.png';
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 5000);
      $('status').textContent = 'Exported ' + size.label + ' PNG (' + Math.round(blob.size / 1024) + ' KiB).';
    }, 'image/png');
  });
}

// ---- boot ----

async function init() {
  refreshPickers();
  refreshPhotoOptions();
  wireInputs();
  syncPanelBox();
  await loadAll();
  const query = new URLSearchParams(location.search);
  inShot = query.has('shot');
  if (query.has('shot')) {
    const layoutId = query.get('layout');
    if (layoutId && LAYOUTS[layoutId]) {
      state.layout = layoutId;
      const panels = LAYOUTS[layoutId].panels();
      state.panels = panels.map((p, i) => state.panels[i] || { scene: i % SCENES.length, x: 0.5, y: p.hero ? 0.32 : 0.5, zoom: 1 });
    }
    const gradeId = query.get('grade');
    if (gradeId && GRADES[gradeId]) state.grade = gradeId;
    const sizeId = query.get('size');
    if (sizeId) {
      const found = SIZES.find((s) => s.id === sizeId);
      if (found) size = found;
    }
    refreshPickers();
    syncPanelBox();
    await runShot(query.get('shot'), query, async (file, caption) => {
      state.title = (caption || 'VICE ROYALE').toUpperCase();
      $('title').value = state.title;
      const script = query.get('script');
      if (script) {
        state.script = script;
        $('script').value = script;
      }
      const img = await loadImage(file);
      images[file] = img;
      const hero = state.panels[0];
      const sceneIndex = SCENES.findIndex((s) => s.file === file);
      if (sceneIndex >= 0) assignScene(0, sceneIndex);
      render();
    });
  }
  render();
}

init();
