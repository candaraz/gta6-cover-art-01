// Vice Cover Studio editor: wires the page, the live preview and the PNG export.
// Photos are read on the user's own machine and never uploaded.

import {
  SCENES, LAYOUTS, GRADES, EXPORT_SIZES,
  defaultState, defaultPanels, layoutPanels, layoutPanelCount,
  renderCover, exportCoverPNG, loadCoverFonts, resolvePanelImage, panelAt, coverFit,
} from './cover.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('cover');
const state = defaultState();
const uploads = []; // user photos, as loaded Images (first one is the hero)
const sceneImages = {}; // scene id -> loaded Image
let selectedPanel = 0;
let drag = null;

const $ = (id) => document.getElementById(id);

/** Loads an image from a URL, resolving once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

/** Preview pixel size: full export is heavy for live typing, so preview at a smaller size. */
function previewSize() {
  const size = EXPORT_SIZES.find((s) => s.id === state.size) || EXPORT_SIZES[0];
  const scale = size.w >= size.h ? 960 / size.w : 720 / size.w;
  return { w: Math.round(size.w * scale), h: Math.round(size.h * scale) };
}

function redraw() {
  const shot = new URLSearchParams(location.search).get('shot');
  if (shot !== 'cover') {
    const { w, h } = previewSize();
    canvas.width = w;
    canvas.height = h;
  }
  renderCover(canvas, state, sceneImages, uploads);
  updateSelectedPanelLabel();
}

function updateSelectedPanelLabel() {
  const panels = layoutPanels(state.layout, canvas.width, canvas.height);
  const p = state.panels[selectedPanel];
  const name = p ? panelSourceName(p.source) : '—';
  $('selectedPanel').textContent = `Panel ${selectedPanel + 1} of ${panels.length}: ${name}${p && p.caption ? ` — ${p.caption}` : ''}`;
  const source = $('panelSource');
  if (p) source.value = p.source;
  const caption = $('panelCaption');
  if (p && document.activeElement !== caption) caption.value = p.caption || '';
  const zoom = $('panelZoom');
  if (p) {
    zoom.value = Math.round((p.crop.zoom || 1) * 100);
    $('zoomValue').textContent = `${Math.round((p.crop.zoom || 1) * 100)}%`;
  }
}

function panelSourceName(source) {
  if (source === 'hero') return 'Hero photo';
  if (source.startsWith('photo:')) return `Photo ${Number(source.slice(6)) + 1}`;
  const scene = SCENES.find((s) => s.id === source);
  return scene ? scene.name : source;
}

/** Builds the layout / grade / size buttons and the furniture checkboxes. */
function buildControls() {
  const layoutBox = $('layoutButtons');
  LAYOUTS.forEach((layout) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.dataset.layout = layout.id;
    b.innerHTML = `${layout.name}<small>${layout.blurb}</small>`;
    b.setAttribute('aria-pressed', String(layout.id === state.layout));
    b.addEventListener('click', () => {
      state.layout = layout.id;
      const old = state.panels;
      const fresh = defaultPanels(layout.id);
      state.panels = fresh.map((p, i) => old[i] || p);
      // The hero photo follows the new layout's hero panel, captions and all.
      const heroIdx = layoutPanels(layout.id, 100, 100).findIndex((p) => p.hero);
      const curHero = state.panels.findIndex((p) => p.source === 'hero');
      if (curHero >= 0 && curHero !== heroIdx) {
        const swap = state.panels[heroIdx];
        state.panels[heroIdx] = state.panels[curHero];
        state.panels[curHero] = swap;
      }
      layoutBox.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      selectedPanel = 0;
      redraw();
    });
    layoutBox.appendChild(b);
  });

  const gradeBox = $('gradeButtons');
  GRADES.forEach((grade) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.dataset.grade = grade.id;
    b.innerHTML = `${grade.name}<small>${grade.blurb}</small>`;
    b.setAttribute('aria-pressed', String(grade.id === state.grade));
    b.addEventListener('click', () => {
      state.grade = grade.id;
      gradeBox.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      redraw();
    });
    gradeBox.appendChild(b);
  });

  const sizeBox = $('sizeButtons');
  EXPORT_SIZES.forEach((size) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.dataset.size = size.id;
    b.textContent = size.label;
    b.setAttribute('aria-pressed', String(size.id === state.size));
    b.addEventListener('click', () => {
      state.size = size.id;
      sizeBox.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      redraw();
    });
    sizeBox.appendChild(b);
  });

  const checks = $('furnitureChecks');
  const names = {
    seal: 'Gold seal', vol: 'VOL. 06 pill', ribbon: 'Ribbon', heat: 'HEAT pill',
    quote: 'Press quote', band: 'Palm band', credits: 'Credits line', barcode: 'Barcode',
  };
  Object.keys(names).forEach((key) => {
    const label = document.createElement('label');
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.checked = state.furniture[key];
    input.addEventListener('change', () => {
      state.furniture[key] = input.checked;
      redraw();
    });
    label.append(input, document.createTextNode(names[key]));
    checks.appendChild(label);
  });
  $('furnitureAll').addEventListener('click', () => setFurniture(true));
  $('furnitureNone').addEventListener('click', () => setFurniture(false));

  function setFurniture(on) {
    Object.keys(state.furniture).forEach((k) => { state.furniture[k] = on; });
    checks.querySelectorAll('input').forEach((i) => { i.checked = on; });
    redraw();
  }
}

/** Rebuilds the panel-source dropdown for the selected panel. */
function buildPanelSourceOptions() {
  const select = $('panelSource');
  select.innerHTML = '';
  const add = (value, label) => {
    const o = document.createElement('option');
    o.value = value;
    o.textContent = label;
    select.appendChild(o);
  };
  add('hero', 'Hero photo');
  uploads.forEach((img, i) => add(`photo:${i}`, `Photo ${i + 1}`));
  SCENES.forEach((s) => add(s.id, `Scene: ${s.name}`));
  select.value = state.panels[selectedPanel] ? state.panels[selectedPanel].source : 'hero';
  select.onchange = () => {
    const p = state.panels[selectedPanel];
    if (!p) return;
    p.source = select.value;
    const scene = SCENES.find((s) => s.id === select.value);
    if (scene) p.caption = scene.caption;
    redraw();
  };
}

/** Rebuilds the photo thumbnails: uploads first, then the six scenes. */
function buildThumbs() {
  const box = $('thumbs');
  box.innerHTML = '';
  uploads.forEach((img, i) => {
    const t = document.createElement('img');
    t.src = img.src;
    t.alt = `Photo ${i + 1}`;
    t.title = `Photo ${i + 1} — click to fill the selected panel`;
    if (state.panels[selectedPanel] && state.panels[selectedPanel].source === `photo:${i}`) t.classList.add('active');
    t.addEventListener('click', () => {
      const p = state.panels[selectedPanel];
      if (p) p.source = `photo:${i}`;
      buildPanelSourceOptions();
      buildThumbs();
      redraw();
    });
    box.appendChild(t);
  });
  SCENES.forEach((s) => {
    const t = document.createElement('img');
    t.src = s.file;
    t.alt = s.name;
    t.title = `${s.name} — click to fill the selected panel`;
    t.classList.add('scene');
    if (state.panels[selectedPanel] && state.panels[selectedPanel].source === s.id) t.classList.add('active');
    t.addEventListener('click', () => {
      const p = state.panels[selectedPanel];
      if (p) {
        p.source = s.id;
        p.caption = s.caption;
      }
      buildPanelSourceOptions();
      buildThumbs();
      redraw();
    });
    box.appendChild(t);
  });
}

/** Canvas position from a pointer event, in canvas pixels. */
function canvasPoint(e) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (e.clientX - rect.left) * (canvas.width / rect.width),
    y: (e.clientY - rect.top) * (canvas.height / rect.height),
  };
}

function bindCanvas() {
  canvas.addEventListener('pointerdown', (e) => {
    const pt = canvasPoint(e);
    const panels = layoutPanels(state.layout, canvas.width, canvas.height);
    const hit = panelAt(panels, pt.x, pt.y);
    if (hit < 0) return;
    selectedPanel = hit;
    canvas.setPointerCapture(e.pointerId);
    drag = { last: pt, panel: panels[hit] };
    buildPanelSourceOptions();
    buildThumbs();
    updateSelectedPanelLabel();
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const pt = canvasPoint(e);
    const p = state.panels[selectedPanel];
    if (!p) return;
    const img = resolvePanelImage(p, uploads, sceneImages);
    if (!img) return;
    const fit = coverFit(img, drag.panel, p.crop);
    p.crop.x -= (pt.x - drag.last.x) / fit.dw;
    p.crop.y -= (pt.y - drag.last.y) / fit.dh;
    drag.last = pt;
    redraw();
  });
  const endDrag = () => { drag = null; };
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);
  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const pt = canvasPoint(e);
    const panels = layoutPanels(state.layout, canvas.width, canvas.height);
    const hit = panelAt(panels, pt.x, pt.y);
    const p = state.panels[hit < 0 ? selectedPanel : hit];
    if (!p) return;
    p.crop.zoom = Math.min(2.5, Math.max(1, (p.crop.zoom || 1) * Math.exp(-e.deltaY * 0.0012)));
    if (hit >= 0) selectedPanel = hit;
    redraw();
  }, { passive: false });
}

function bindInputs() {
  $('photo').addEventListener('change', async (e) => {
    const files = [...e.target.files];
    for (const file of files) {
      try {
        uploads.push(await loadImage(URL.createObjectURL(file)));
      } catch {
        $('status').textContent = `Could not read ${file.name}.`;
      }
    }
    e.target.value = '';
    buildPanelSourceOptions();
    buildThumbs();
    redraw();
  });
  $('useSample').addEventListener('click', async () => {
    if (!uploads.includes(sceneImages.boulevard)) uploads.unshift(sceneImages.boulevard);
    buildPanelSourceOptions();
    buildThumbs();
    redraw();
  });
  $('clearPhotos').addEventListener('click', () => {
    uploads.length = 0;
    state.panels.forEach((p) => {
      if (p.source.startsWith('photo:')) p.source = 'hero';
    });
    buildPanelSourceOptions();
    buildThumbs();
    redraw();
  });
  $('panelCaption').addEventListener('input', (e) => {
    const p = state.panels[selectedPanel];
    if (p) p.caption = e.target.value;
    redraw();
  });
  $('panelZoom').addEventListener('input', (e) => {
    const p = state.panels[selectedPanel];
    if (!p) return;
    p.crop.zoom = Number(e.target.value) / 100;
    $('zoomValue').textContent = `${e.target.value}%`;
    redraw();
  });
  $('resetCrop').addEventListener('click', () => {
    const p = state.panels[selectedPanel];
    if (!p) return;
    p.crop = { x: 0.5, y: 0.35, zoom: 1 };
    redraw();
  });
  const bindText = (id, key) => {
    $(id).addEventListener('input', (e) => {
      state[key] = e.target.value;
      redraw();
    });
  };
  bindText('title', 'title');
  bindText('script', 'script');
  bindText('quote', 'quote');
  bindText('quotePaper', 'quotePaper');
  bindText('band', 'band');
  $('export').addEventListener('click', async () => {
    const btn = $('export');
    btn.disabled = true;
    $('status').textContent = 'Rendering your cover…';
    try {
      const blob = await exportCoverPNG(state, sceneImages, uploads, state.size);
      const size = EXPORT_SIZES.find((s) => s.id === state.size) || EXPORT_SIZES[0];
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `vice-cover-${state.size}.png`;
      a.click();
      $('status').textContent = `Saved vice-cover-${state.size}.png — ${size.w} × ${size.h}.`;
      setTimeout(() => URL.revokeObjectURL(a.href), 10000);
    } catch {
      $('status').textContent = 'Export failed — try another photo.';
    }
    btn.disabled = false;
  });
}

/** Boots the editor: fonts, scenes, controls, then the first paint (or a shot scene). */
async function boot() {
  buildControls();
  buildPanelSourceOptions();
  bindCanvas();
  bindInputs();
  await loadCoverFonts();
  for (const scene of SCENES) {
    try {
      sceneImages[scene.id] = await loadImage(scene.file);
    } catch {
      // A missing scene just leaves its panels empty.
    }
  }
  buildThumbs();
  const shot = new URLSearchParams(location.search).get('shot');
  if (shot) {
    await runShot(shot, new URLSearchParams(location.search), {
      state, sceneImages, uploads, canvas,
      setPhoto: (img) => { uploads.unshift(img); },
      redraw,
      ready: () => { window.__shotReady = true; },
    });
  } else {
    redraw();
  }
}

boot();
