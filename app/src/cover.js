// Vice Cover Studio — cover render engine (v5).
// Draws a GTA-style multi-panel poster cover onto a 2d canvas from a plain
// state object. No network, no libraries: every asset is a file under app/.
// The engine is deliberately data-first: layouts are rect tables, grades are
// per-photo transforms, and all poster furniture is drawn from primitives,
// so the editor can re-render the same state at any size and the exporter
// can re-render it at 1920x1080, 1080x1080 or 1080x1350 unchanged.

export const FONT_TITLE = '"Passion One", "Arial Black", sans-serif';
export const FONT_SCRIPT = '"Yellowtail", cursive';
export const FONT_LABEL = '"Barlow Condensed", "Arial Narrow", sans-serif';
export const FONT_SEAL = '"Anton", "Arial Black", sans-serif';

export const FONT_FILES = [
  { family: 'Passion One', weight: 900, url: 'fonts/PassionOne-Black.ttf' },
  { family: 'Passion One', weight: 700, url: 'fonts/PassionOne-Bold.ttf' },
  { family: 'Passion One', weight: 400, url: 'fonts/PassionOne-Regular.ttf' },
  { family: 'Yellowtail', weight: 400, url: 'fonts/Yellowtail-Regular.woff2' },
  { family: 'Anton', weight: 400, url: 'fonts/Anton-Regular.ttf' },
  { family: 'Barlow Condensed', weight: 400, url: 'fonts/BarlowCondensed-Regular.ttf' },
  { family: 'Barlow Condensed', weight: 600, url: 'fonts/BarlowCondensed-SemiBold.ttf' },
  { family: 'Barlow Condensed', weight: 700, url: 'fonts/BarlowCondensed-Bold.ttf' },
  { family: 'Barlow Condensed', weight: 800, url: 'fonts/BarlowCondensed-ExtraBold.ttf' },
];

let fontsReady = false;
export async function ensureFonts() {
  if (fontsReady) return;
  const loads = [];
  for (const f of FONT_FILES) {
    try {
      const face = new FontFace(f.family, `url(${f.url})`, { weight: String(f.weight) });
      const loaded = await face.load();
      document.fonts.add(loaded);
      loads.push(loaded);
    } catch (e) { /* a missing face falls back to the system stack */ }
  }
  try {
    await Promise.all([
      document.fonts.load('900 100px "Passion One"'),
      document.fonts.load('400 60px "Yellowtail"'),
      document.fonts.load('800 40px "Barlow Condensed"'),
      document.fonts.load('400 40px "Anton"'),
    ]);
  } catch (e) { /* fallbacks are fine */ }
  fontsReady = true;
}

// ---------------------------------------------------------------- scenes
// The default cast: nine original model-made portraits, each with a role, a
// time and a one-line tagline, plus two place scenes and the kit's samples.
// Roles are invented for this studio; no real person is depicted.

export const CAST = [
  { id: 'fixer',    role: 'THE FIXER',    time: '6:12 PM',  line: 'THE MAN WITH THE PLAN',      scene: 'scenes/fixer.jpg',    hero: true },
  { id: 'getaway',  role: 'THE GETAWAY',  time: '11:40 PM', line: 'NEVER CAUGHT',               scene: 'scenes/getaway.jpg' },
  { id: 'crew',     role: 'THE CREW',     time: '5:05 PM',  line: 'LOYAL TO THE END',           scene: 'scenes/crew.jpg' },
  { id: 'angler',   role: 'THE ANGLER',   time: '5:48 AM',  line: 'PATIENCE PAYS',              scene: 'scenes/angler.jpg' },
  { id: 'tourist',  role: 'THE TOURIST',  time: '12:20 PM', line: 'SHE SAW IT ALL',             scene: 'scenes/tourist.jpg' },
  { id: 'lookout',  role: 'THE LOOKOUT',  time: '8:15 PM',  line: 'EYES ON THE HARBOR',         scene: 'scenes/lookout.jpg' },
  { id: 'mechanic', role: 'THE MECHANIC', time: '9:30 PM',  line: 'SHE BUILDS FAST',            scene: 'scenes/mechanic.jpg' },
  { id: 'insider',  role: 'THE INSIDER',  time: '10:02 PM', line: 'SHE KNOWS IT ALL',           scene: 'scenes/insider.jpg' },
  { id: 'courier',  role: 'THE COURIER',  time: '7:45 AM',  line: 'FASTER THAN THE LAW',        scene: 'scenes/courier.jpg' },
  { id: 'coast',    role: 'PALM ROW',     time: '6:40 PM',  line: 'THE ROAD GOES ON',           scene: 'scenes/coast.jpg',     place: true },
  { id: 'neon',     role: 'NEON ROW',     time: '1:15 AM',  line: 'NEVER SLEEPS',               scene: 'scenes/neonstreet.jpg', place: true },
  { id: 'boulevard', role: 'OLD PIER',    time: '5:40 PM',  line: 'ONE MORE CAST',              scene: 'samples/boulevard.jpg', place: true },
  { id: 'pier',     role: 'OCEAN DRIVE',  time: '7:02 PM',  line: 'SALT IN THE AIR',            scene: 'samples/pier.jpg',     place: true },
];

export const HERO_POP_SCENE = 'scenes/hero-pop.jpg';

export function defaultPanels() {
  // Nine cast panels, hero first; each carries its own crop state.
  return CAST.slice(0, 9).map((c) => ({
    scene: c.scene, role: c.role, time: c.time, line: c.line,
    zoom: 1, dx: 0, dy: 0, flip: false, face: false,
  }));
}

export function defaultState() {
  return {
    title: 'VICE ROYALE',
    script: 'chasing the last light',
    quote: 'SUNSET, SMOKE AND STOLEN GOLD',
    quoteSource: 'THE COAST LEDGER',
    tagline: 'EVERY SUNSET HAS A PRICE',
    layout: 'hero-mosaic',
    grade: 'sunset',
    furniture: true,
    goldFrame: true,
    look: { paint: 0.5, gradeAmt: 1, halftone: 0.35, grain: 0.3, glow: 0.3 },
    panels: defaultPanels(),
  };
}

// ---------------------------------------------------------------- layouts
// Every layout is a function of (W, H) returning panel rects in pixels plus
// the title anchor. Rects are {x, y, w, h, tilt} in the cover's own space;
// the top quote band and the bottom band are drawn by the renderer, not by
// the layout, so layouts only place art. tilt is degrees (slanted layouts).

const QB = 0.052; // top quote band height, fraction of H
const BB = 0.078; // bottom band height, fraction of H
const GAP = 0.006; // panel gap, fraction of W

function grid(W, H, cols, rows, x0, y0, x1, y1, gap) {
  const g = gap ?? GAP * W;
  const cw = (x1 - x0 - g * (cols - 1)) / cols;
  const ch = (y1 - y0 - g * (rows - 1)) / rows;
  const out = [];
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++)
      out.push({ x: x0 + c * (cw + g), y: y0 + r * (ch + g), w: cw, h: ch, tilt: 0 });
  return out;
}

export const LAYOUTS = {
  'hero-mosaic': {
    label: 'Hero Mosaic', hero: 0,
    rects(W, H) {
      const top = QB * H, bot = H - BB * H, g = GAP * W;
      const heroW = 0.55 * W;
      const right = grid(W, H, 2, 2, heroW + g, top, W, bot, g);
      return [{ x: 0, y: top, w: heroW, h: bot - top, tilt: 0 }, ...right];
    },
    titleY: (H) => 0.66 * H,
  },
  'hero-three': {
    label: 'Hero + Three', hero: 0,
    rects(W, H) {
      const top = QB * H, bot = H - BB * H, g = GAP * W;
      const heroH = 0.60 * (bot - top);
      const row = grid(W, H, 3, 1, 0, top + heroH + g, W, bot, g);
      return [{ x: 0, y: top, w: W, h: heroH, tilt: 0 }, ...row];
    },
    titleY: (H) => 0.52 * H,
  },
  'diagonal-trio': {
    label: 'Diagonal Trio', hero: 0,
    rects(W, H) {
      const top = QB * H, bot = H - BB * H, g = GAP * W;
      const heroW = 0.60 * W;
      const r = grid(W, H, 1, 2, heroW + g, top + 0.03 * H, W, bot - 0.03 * H, g);
      r[0].tilt = 0; r[1].tilt = 0;
      return [{ x: 0, y: top, w: heroW, h: bot - top, tilt: 0 }, ...r];
    },
    titleY: (H) => 0.60 * H,
  },
  'seven-mosaic': {
    label: 'Seven Mosaic', hero: 0,
    rects(W, H) {
      const top = QB * H, bot = H - BB * H, g = GAP * W;
      const heroW = 0.50 * W;
      const right = grid(W, H, 2, 3, heroW + g, top, W, bot, g);
      return [{ x: 0, y: top, w: heroW, h: bot - top, tilt: 0 }, ...right];
    },
    titleY: (H) => 0.60 * H,
  },
  'pop-out': {
    label: 'Pop-Out Hero', hero: 0, popOut: true,
    rects(W, H) {
      const top = QB * H, bot = H - BB * H, g = GAP * W;
      const heroW = 0.58 * W;
      const right = grid(W, H, 2, 2, heroW + g, top, W, bot, g);
      return [{ x: 0, y: top, w: heroW, h: bot - top, tilt: 0, pop: true }, ...right];
    },
    titleY: (H) => 0.64 * H,
  },
  'slanted': {
    label: 'Slanted Cast', hero: 0, slanted: true,
    rects(W, H) {
      const top = QB * H, bot = H - BB * H, g = GAP * W;
      // A zigzag of six tilted panels in two rows, with a clear middle gap
      // for the title — so no face sits under the title band.
      const topH = 0.328 * H, botY = 0.62 * H, botH = bot - botY;
      return [
        { x: 0.02 * W, y: top, w: 0.38 * W, h: topH, tilt: -4 },
        { x: 0.42 * W, y: top + 0.02 * H, w: 0.28 * W, h: topH * 0.92, tilt: 5 },
        { x: 0.72 * W, y: top, w: 0.26 * W, h: topH * 0.98, tilt: -3 },
        { x: 0.03 * W, y: botY, w: 0.28 * W, h: botH, tilt: 4 },
        { x: 0.35 * W, y: botY + 0.02 * H, w: 0.28 * W, h: botH * 0.93, tilt: -5 },
        { x: 0.65 * W, y: botY, w: 0.32 * W, h: botH, tilt: 3 },
      ];
    },
    titleY: (H) => 0.52 * H,
  },
  'nine-grid': {
    label: 'Nine Grid', hero: 0,
    rects(W, H) {
      const top = QB * H, bot = H - BB * H;
      return grid(W, H, 3, 3, 0, top, W, bot, GAP * W);
    },
    titleY: (H) => 0.58 * H,
  },
  'title-band': {
    label: 'Title Band', hero: -1,
    rects(W, H) {
      const top = QB * H, bot = H * 0.66;
      return grid(W, H, 3, 2, 0, top, W, bot, GAP * W);
    },
    titleY: (H) => 0.76 * H,
  },
};

export const LAYOUT_IDS = Object.keys(LAYOUTS);

// ---------------------------------------------------------------- grades
// A grade is { filter, overlay } applied to each photo before it is drawn:
// filter is a CSS filter string for the fast path; overlay is a per-pixel
// transform id used by the cached graded-photo path (posterize / duotone /
// painted). gradeAmt scales the overlay strength via the look sliders.

export const GRADES = {
  sunset:      { label: 'Sunset',      filter: 'saturate(1.25) contrast(1.06) brightness(1.02) sepia(0.22) hue-rotate(-8deg)', overlay: 'warm' },
  neon:        { label: 'Neon Night',  filter: 'saturate(1.45) contrast(1.12) brightness(0.96) hue-rotate(18deg)', overlay: 'cool' },
  golden:      { label: 'Golden Hour', filter: 'saturate(1.3) contrast(1.05) brightness(1.06) sepia(0.35) hue-rotate(-14deg)', overlay: 'gold' },
  'poster-ink':{ label: 'Poster Ink',  filter: 'saturate(1.1) contrast(1.18)', overlay: 'ink' },
  teal:        { label: 'Tropic Teal', filter: 'saturate(1.35) contrast(1.06) hue-rotate(28deg)', overlay: 'teal' },
  heatwave:    { label: 'Heatwave',    filter: 'saturate(1.6) contrast(1.16) brightness(1.0) sepia(0.3) hue-rotate(-22deg)', overlay: 'heat' },
  painted:     { label: 'Painted',     filter: 'saturate(1.35) contrast(1.1)', overlay: 'painted' },
  twilight:    { label: 'Twilight Gold', filter: 'saturate(1.3) contrast(1.1) brightness(0.98) hue-rotate(24deg) sepia(0.15)', overlay: 'dusk' },
};

export const GRADE_IDS = Object.keys(GRADES);

// ---------------------------------------------------------------- helpers

export function fitText(ctx, text, maxW, startPx, font, minPx) {
  // Shrink a font until the text fits maxW; returns the size used.
  let px = startPx;
  ctx.font = font(px);
  while (px > (minPx || 10) && ctx.measureText(text).width > maxW) {
    px -= 2;
    ctx.font = font(px);
  }
  return px;
}

// How wide a centred line in the bottom band may be before it touches the
// gold seal. The seal sits at W*0.86 with radius H*0.024, so a fixed 0.70W
// cap lets a centred line reach 0.85W — past the seal's left edge in
// portrait, where the last cast name slid under the seal and was clipped.
// The safe width is derived from the seal geometry, so it holds at every
// export size: the line's right edge stops a W*0.02 gap short of the seal.
export function billingSafeWidth(W, H) {
  const sealLeft = W * 0.86 - H * 0.024;
  return Math.max(80, 2 * (sealLeft - W * 0.02 - W * 0.5));
}

export function coverRect(img, rect, zoom, dx, dy, face) {
  // Cover-fit an image into rect, with zoom/pan and a face bias (faces sit
  // in the upper third, so the face toggle re-centres the crop there).
  const iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height;
  const s = Math.max(rect.w / iw, rect.h / ih) * (zoom || 1);
  const dw = iw * s, dh = ih * s;
  let cx = rect.x + rect.w / 2 - dw / 2 + (dx || 0) * rect.w * 0.4;
  let cy = rect.y + rect.h / 2 - dh / 2 + (dy || 0) * rect.h * 0.4;
  if (face) cy = rect.y + rect.h * 0.32 - dh * 0.32;
  // Clamp so the image never leaves a gap inside the rect.
  cx = Math.min(rect.x, Math.max(rect.x + rect.w - dw, cx));
  cy = Math.min(rect.y, Math.max(rect.y + rect.h - dh, cy));
  return { x: cx, y: cy, w: dw, h: dh };
}

function mulberry(seed) {
  let t = seed >>> 0;
  return () => {
    t += 0x6D2B79F5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export function noiseCanvas(size, alpha) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  const img = g.createImageData(size, size);
  const rnd = mulberry(1337);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = Math.floor(rnd() * 255);
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
    img.data[i + 3] = Math.floor(alpha * 255 * rnd());
  }
  g.putImageData(img, 0, 0);
  return c;
}

// ---------------------------------------------------------------- grading
// Graded photos are cached per (scene, grade, look.paint) at a capped size
// so a re-render never re-runs the per-pixel pass. The fast grades use the
// CSS filter path; the poster/painted grades run a small per-pixel pass on a
// downscaled copy and cache the result.

const gradeCache = new Map();
const MAX_GRADE_W = 720;

function gradeKey(scene, gradeId, paint) {
  return scene + '|' + gradeId + '|' + Math.round(paint * 10);
}

function posterize(v, levels) {
  return Math.round((v / 255) * (levels - 1)) / (levels - 1) * 255;
}

function edgeMap(srcCtx, w, h) {
  // Sobel luminance edges on a tiny copy; returns a canvas of dark strokes.
  const small = document.createElement('canvas');
  const sw = 160, sh = Math.max(1, Math.round(160 * h / w));
  small.width = sw; small.height = sh;
  const sg = small.getContext('2d');
  sg.drawImage(srcCtx.canvas, 0, 0, sw, sh);
  const src = sg.getImageData(0, 0, sw, sh);
  const out = sg.createImageData(sw, sh);
  const lum = new Float32Array(sw * sh);
  for (let i = 0; i < sw * sh; i++)
    lum[i] = 0.299 * src.data[i * 4] + 0.587 * src.data[i * 4 + 1] + 0.114 * src.data[i * 4 + 2];
  for (let y = 0; y < sh; y++) {
    for (let x = 0; x < sw; x++) {
      const xm = x > 0 ? lum[y * sw + x - 1] : lum[y * sw + x];
      const xp = x < sw - 1 ? lum[y * sw + x + 1] : lum[y * sw + x];
      const ym = y > 0 ? lum[(y - 1) * sw + x] : lum[y * sw + x];
      const yp = y < sh - 1 ? lum[(y + 1) * sw + x] : lum[y * sw + x];
      const e = Math.min(255, Math.abs(xp - xm) + Math.abs(yp - ym));
      const o = (y * sw + x) * 4;
      const ink = e > 26 ? 255 - Math.min(255, (e - 26) * 3) : 255;
      out.data[o] = out.data[o + 1] = out.data[o + 2] = ink;
      out.data[o + 3] = 255;
    }
  }
  sg.putImageData(out, 0, 0);
  return small;
}

export function gradedPhoto(img, gradeId, look) {
  const key = gradeKey(img.src || img.currentSrc || '', gradeId, look.paint);
  const hit = gradeCache.get(key);
  if (hit) return hit;
  const iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height;
  const scale = Math.min(1, MAX_GRADE_W / iw);
  const w = Math.max(2, Math.round(iw * scale)), h = Math.max(2, Math.round(ih * scale));
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d');
  const grade = GRADES[gradeId] || GRADES.sunset;
  g.filter = grade.filter;
  g.drawImage(img, 0, 0, w, h);
  g.filter = 'none';
  const ov = grade.overlay;
  if (ov === 'ink' || ov === 'painted' || ov === 'warm' || ov === 'cool' || ov === 'gold' || ov === 'teal' || ov === 'heat' || ov === 'dusk') {
    const data = g.getImageData(0, 0, w, h);
    const d = data.data;
    const levels = ov === 'painted' ? 7 : ov === 'ink' ? 6 : 0;
    for (let i = 0; i < d.length; i += 4) {
      let r = d[i], gg = d[i + 1], b = d[i + 2];
      if (levels) {
        r = posterize(r, levels); gg = posterize(gg, levels); b = posterize(b, levels);
      }
      if (ov === 'warm') { r = Math.min(255, r * 1.08 + 10); b = Math.max(0, b * 0.92 - 6); }
      if (ov === 'cool') { b = Math.min(255, b * 1.12 + 8); r = Math.max(0, r * 0.94 - 4); }
      if (ov === 'gold') { r = Math.min(255, r * 1.1 + 12); gg = Math.min(255, gg * 1.04 + 4); b = Math.max(0, b * 0.86 - 8); }
      if (ov === 'teal') { gg = Math.min(255, gg * 1.1 + 6); b = Math.min(255, b * 1.1 + 6); r = Math.max(0, r * 0.92 - 4); }
      if (ov === 'heat') { r = Math.min(255, r * 1.14 + 14); gg = Math.max(0, gg * 0.94); b = Math.max(0, b * 0.82 - 10); }
      if (ov === 'dusk') { b = Math.min(255, b * 1.14 + 10); r = Math.min(255, r * 1.02 + 4); gg = Math.max(0, gg * 0.96); }
      if (ov === 'ink') {
        // Duotone: pink shadows, cream highlights.
        const l = 0.299 * r + 0.587 * gg + 0.114 * b;
        const t = l / 255;
        r = Math.round(38 + t * 214); gg = Math.round(16 + t * 178); b = Math.round(64 + t * 150);
      }
      if (ov === 'painted') {
        // Flat colour with a warm rim: gentle saturation lift, flat midtones.
        const mx = Math.max(r, gg, b), mn = Math.min(r, gg, b);
        const sat = mx === 0 ? 0 : (mx - mn) / mx;
        const boost = 1 + 0.18 * look.paint;
        r = Math.min(255, r * (1 + sat * 0.18 * boost));
        gg = Math.min(255, gg * (1 + sat * 0.10 * boost));
        b = Math.max(0, b * (1 - sat * 0.05));
      }
      d[i] = r; d[i + 1] = gg; d[i + 2] = b;
    }
    g.putImageData(data, 0, 0);
  }
  if (ov === 'painted' || ov === 'ink') {
    // Ink outlines: draw the edge map over the photo, lightly.
    const edges = edgeMap(g, w, h);
    g.globalAlpha = ov === 'painted' ? 0.10 + 0.12 * look.paint : 0.16;
    g.globalCompositeOperation = 'multiply';
    g.drawImage(edges, 0, 0, w, h);
    g.globalCompositeOperation = 'source-over';
    g.globalAlpha = 1;
  }
  gradeCache.set(key, c);
  return c;
}

// ---------------------------------------------------------------- title

function stripeGradient(ctx, x, y, w, h, gradeId) {
  // Horizontal retro stripes: the banded 80s fill the top entries use.
  const bands = {
    sunset: ['#FFD23F', '#FF9E3D', '#FF5E7A', '#E83E8C'],
    neon: ['#7DF9FF', '#4D7CFE', '#B14BFF', '#FF4BD8'],
    golden: ['#FFF3B0', '#FFD23F', '#F5A623', '#C97B1A'],
    'poster-ink': ['#F5F5F5', '#D9D9D9', '#9A9A9A', '#4A4A4A'],
    teal: ['#A8F0E0', '#4FD1C5', '#2B9FD8', '#1B6FB8'],
    heatwave: ['#FFE259', '#FF7B2F', '#FF3D3D', '#C9184A'],
    painted: ['#FFD23F', '#FF9E3D', '#FF5E7A', '#7C4DFF'],
    twilight: ['#FFD98E', '#E8A54B', '#9B5DE5', '#5A189A'],
  }[gradeId] || ['#FFD23F', '#FF9E3D', '#FF5E7A', '#E83E8C'];
  const grad = ctx.createLinearGradient(0, y, 0, y + h);
  const n = bands.length;
  bands.forEach((col, i) => {
    grad.addColorStop(i / n, col);
    grad.addColorStop((i + 1) / n - 0.001, col);
  });
  return grad;
}

export function drawTitle(ctx, state, W, H, titleY) {
  const title = (state.title || 'VICE ROYALE').toUpperCase();
  const maxW = W * 0.92;
  const startPx = Math.round(H * 0.185);
  const px = fitText(ctx, title, maxW, startPx, (s) => `900 ${s}px ${FONT_TITLE}`, Math.round(H * 0.05));
  const font = (s) => `900 ${s}px ${FONT_TITLE}`;
  const tw = ctx.measureText(title).width;
  const x0 = (W - tw) / 2;
  const y = titleY;
  // 6-step deep-purple extrusion, then the striped fill, then a black outline.
  ctx.save();
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  const steps = 6;
  for (let i = steps; i >= 1; i--) {
    ctx.font = font(px);
    ctx.fillStyle = `rgba(46, 8, 84, ${0.55 + 0.08 * i})`;
    ctx.fillText(title, x0 + i * px * 0.045, y + i * px * 0.055);
  }
  ctx.font = font(px);
  ctx.fillStyle = stripeGradient(ctx, x0, y - px * 0.82, tw, px, state.grade);
  ctx.fillText(title, x0, y);
  ctx.lineWidth = Math.max(2, px * 0.045);
  ctx.strokeStyle = '#12061F';
  ctx.lineJoin = 'round';
  ctx.strokeText(title, x0, y);
  ctx.restore();
  return { x: x0, y, w: tw, h: px, px };
}

// ---------------------------------------------------------------- panels

export function drawPanel(ctx, img, panel, rect, gradeId, look, opts) {
  const o = opts || {};
  // Keep the layout rect: the border is drawn in the panel's own (possibly
  // rotated) frame, but the caller needs the upright rect for the label.
  const orig = { x: rect.x, y: rect.y, w: rect.w, h: rect.h, tilt: rect.tilt || 0 };
  ctx.save();
  if (rect.tilt) {
    ctx.translate(rect.x + rect.w / 2, rect.y + rect.h / 2);
    ctx.rotate((rect.tilt * Math.PI) / 180);
    ctx.translate(-rect.w / 2, -rect.h / 2);
    rect = { x: 0, y: 0, w: rect.w, h: rect.h };
  }
  // Clip to the panel, draw the graded photo cover-fit.
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  const graded = gradedPhoto(img, gradeId, look);
  const r = coverRect(graded, rect, panel.zoom, panel.dx, panel.dy, panel.face);
  if (panel.flip) {
    ctx.translate(rect.x + rect.w / 2, 0);
    ctx.scale(-1, 1);
    ctx.translate(-(rect.x + rect.w / 2), 0);
  }
  ctx.drawImage(graded, r.x, r.y, r.w, r.h);
  // Halftone dots over the photo (strongest in Poster Ink / Painted).
  const ht = look.halftone * (gradeId === 'poster-ink' || gradeId === 'painted' ? 1 : 0.35);
  if (ht > 0.03) {
    const step = Math.max(5, rect.w * 0.018);
    ctx.fillStyle = `rgba(20, 6, 32, ${0.10 * ht})`;
    for (let yy = rect.y + step / 2; yy < rect.y + rect.h; yy += step)
      for (let xx = rect.x + step / 2; xx < rect.x + rect.w; xx += step) {
        ctx.beginPath();
        ctx.arc(xx, yy, Math.max(0.6, step * 0.10 * ht), 0, Math.PI * 2);
        ctx.fill();
      }
  }
  // Glow wash.
  if (look.glow > 0.02) {
    const glow = ctx.createRadialGradient(
      rect.x + rect.w / 2, rect.y + rect.h * 0.25, 10,
      rect.x + rect.w / 2, rect.y + rect.h / 2, Math.max(rect.w, rect.h) * 0.75);
    glow.addColorStop(0, `rgba(255, 190, 90, ${0.14 * look.glow})`);
    glow.addColorStop(1, 'rgba(255, 190, 90, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  }
  ctx.restore();
  // Panel border, drawn after restore (so it is not clipped) with the
  // panel's tilt re-applied, so it hugs the photo instead of landing at
  // the cover's corner.
  const otilt = orig.tilt || 0;
  ctx.save();
  ctx.strokeStyle = 'rgba(10, 4, 18, 0.85)';
  ctx.lineWidth = Math.max(2, orig.w * 0.008);
  if (otilt) {
    ctx.translate(orig.x + orig.w / 2, orig.y + orig.h / 2);
    ctx.rotate((otilt * Math.PI) / 180);
    ctx.translate(-orig.w / 2, -orig.h / 2);
    ctx.strokeRect(0, 0, orig.w, orig.h);
  } else {
    ctx.strokeRect(orig.x, orig.y, orig.w, orig.h);
  }
  ctx.restore();
  return orig;
}

export function drawRoleLabel(ctx, panel, rect, skipZones, H) {
  // Two-line caption: big role, smaller "TIME — TAGLINE". The label is sized
  // from the panel's WIDTH (so a wide short panel never gets a giant label),
  // capped at 8.5% of the cover height, clamped inside the panel, and
  // skipped entirely when its box would cross the title band (skipZones:
  // [{y0, y1}] in cover space).
  const pad = Math.max(6, rect.w * 0.02);
  const maxW = rect.w - pad * 2;
  const cap = H ? H * 0.085 : Infinity;
  const rolePx = fitText(ctx, panel.role, maxW, Math.min(rect.w * 0.28, rect.h * 0.14, cap), (s) => `800 ${s}px ${FONT_LABEL}`, 9);
  ctx.font = `800 ${rolePx}px ${FONT_LABEL}`;
  const roleW = ctx.measureText(panel.role).width;
  const sub = `${panel.time} — ${panel.line}`;
  const subPx = Math.max(8, Math.round(rolePx * 0.52));
  const subSize = fitText(ctx, sub, maxW * 0.92, subPx, (s) => `700 ${s}px ${FONT_LABEL}`, 7);
  ctx.font = `700 ${subSize}px ${FONT_LABEL}`;
  const subW = ctx.measureText(sub).width;
  const labelH = rolePx * 1.05 + subSize * 1.5 + pad * 1.1;
  const lx = rect.x, ly = rect.y + rect.h - labelH;
  const lw = Math.max(roleW, subW) + pad * 2;
  if (skipZones) {
    for (const z of skipZones) {
      if (ly < z.y1 && ly + labelH > z.y0) return;
    }
  }
  ctx.save();
  ctx.fillStyle = 'rgba(8, 3, 16, 0.88)';
  ctx.fillRect(lx, ly, lw, labelH);
  ctx.fillStyle = '#FFF7E8';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.font = `800 ${rolePx}px ${FONT_LABEL}`;
  ctx.fillText(panel.role, lx + pad, ly + rolePx * 0.95);
  ctx.fillStyle = '#FFC9A3';
  ctx.font = `700 ${subSize}px ${FONT_LABEL}`;
  ctx.fillText(sub, lx + pad, ly + rolePx * 1.05 + subSize * 1.15);
  ctx.restore();
}

// ---------------------------------------------------------------- furniture

function roundRect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function pill(ctx, text, x, y, h, fg, bg, fontPx) {
  ctx.save();
  ctx.font = `800 ${fontPx}px ${FONT_LABEL}`;
  const w = ctx.measureText(text).width + h * 1.1;
  roundRect(ctx, x, y, w, h, h / 2);
  ctx.fillStyle = bg;
  ctx.fill();
  ctx.fillStyle = fg;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x + w / 2, y + h / 2 + fontPx * 0.04);
  ctx.restore();
  return w;
}

function drawStarburst(ctx, cx, cy, R, text) {
  // Spiky sunburst seal: alternating outer/inner radius, pink fill, black ring.
  ctx.save();
  ctx.translate(cx, cy);
  const spikes = 14;
  ctx.beginPath();
  for (let i = 0; i < spikes * 2; i++) {
    const a = (i / (spikes * 2)) * Math.PI * 2 - Math.PI / 2;
    const r = i % 2 === 0 ? R : R * 0.78;
    const x = Math.cos(a) * r, y = Math.sin(a) * r;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = '#FF2E88';
  ctx.fill();
  ctx.lineWidth = Math.max(2, R * 0.06);
  ctx.strokeStyle = '#12061F';
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 0, R * 0.62, 0, Math.PI * 2);
  ctx.fillStyle = '#FFF3D6';
  ctx.fill();
  ctx.fillStyle = '#12061F';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const lines = text.split('\n');
  const px = R * 0.21;
  ctx.font = `800 ${px}px ${FONT_LABEL}`;
  lines.forEach((ln, i) => ctx.fillText(ln, 0, (i - (lines.length - 1) / 2) * px * 1.15));
  ctx.restore();
}

function drawGoldSeal(ctx, cx, cy, R, lines) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.fillStyle = '#F5B81D';
  ctx.fill();
  ctx.lineWidth = Math.max(2, R * 0.07);
  ctx.strokeStyle = '#7A5200';
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy, R * 0.82, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(122, 82, 0, 0.7)';
  ctx.lineWidth = Math.max(1, R * 0.03);
  ctx.stroke();
  ctx.fillStyle = '#3A2500';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const px = R * 0.24;
  ctx.font = `800 ${px}px ${FONT_LABEL}`;
  lines.forEach((ln, i) => ctx.fillText(ln, cx, cy + (i - (lines.length - 1) / 2) * px * 1.2));
  ctx.restore();
}

function drawPalmBand(ctx, W, H, bandY, bandH, gradeId) {
  // Sunset gradient + palm silhouettes along the bottom band.
  const g = ctx.createLinearGradient(0, bandY, 0, bandY + bandH);
  if (gradeId === 'neon' || gradeId === 'poster-ink') {
    g.addColorStop(0, '#2B0A4D'); g.addColorStop(0.55, '#7A1E6B'); g.addColorStop(1, '#FF2E88');
  } else if (gradeId === 'teal') {
    g.addColorStop(0, '#062A2E'); g.addColorStop(0.55, '#0E6B6B'); g.addColorStop(1, '#FF9E3D');
  } else {
    g.addColorStop(0, '#FF7B2F'); g.addColorStop(0.55, '#FF5E7A'); g.addColorStop(1, '#7A1E6B');
  }
  ctx.save();
  ctx.fillStyle = g;
  ctx.fillRect(0, bandY, W, bandH);
  // Palm fronds: simple silhouettes that stay INSIDE the band, never
  // reaching the panels or role labels above it.
  ctx.fillStyle = 'rgba(16, 4, 26, 0.9)';
  const palms = [0.06, 0.22, 0.47, 0.68, 0.86, 0.97];
  for (const fx of palms) {
    const px = fx * W, py = bandY + bandH * 0.55;
    const S = bandH * 0.85;
    ctx.save();
    ctx.translate(px, py);
    for (let i = 0; i < 6; i++) {
      const a = -Math.PI / 2 + (i - 2.5) * 0.42;
      ctx.save();
      ctx.rotate(a);
      ctx.beginPath();
      ctx.ellipse(S * 0.42, 0, S * 0.42, S * 0.07, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    ctx.fillRect(-S * 0.02, 0, S * 0.04, bandH * 0.45);
    ctx.restore();
  }
  ctx.restore();
}

function drawBarcode(ctx, x, y, w, h) {
  ctx.save();
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(x - 4, y - 4, w + 8, h + 8);
  ctx.fillStyle = '#111111';
  let xx = x;
  let seed = 7;
  while (xx < x + w) {
    seed = (seed * 37 + 11) % 97;
    const bw = 1 + (seed % 4) * (w / 260);
    if (seed % 3 !== 0) ctx.fillRect(xx, y, bw, h);
    xx += bw + (w / 260);
  }
  ctx.restore();
}

// ---------------------------------------------------------------- render

export async function renderCover(ctx, state, W, H, images, opts) {
  // images: Map scenePath -> HTMLImageElement (already loaded). opts:
  // { forExport: true } hides the editor selection outline (never drawn
  // here anyway) and forces the full furniture set.
  const o = opts || {};
  const layout = LAYOUTS[state.layout] || LAYOUTS['hero-mosaic'];
  const look = state.look || { paint: 0.5, gradeAmt: 1, halftone: 0.35, grain: 0.3, glow: 0.3 };
  const gradeId = state.grade || 'sunset';
  const showFurniture = state.furniture !== false;

  ctx.save();
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#12061F';
  ctx.fillRect(0, 0, W, H);

  const topBandH = QB * H;
  const botBandY = H - BB * H;

  // --- panels
  const rects = layout.rects(W, H);
  const heroIdx = layout.hero >= 0 ? layout.hero : 0;
  const titleY = layout.titleY(H);
  const panels = state.panels || [];
  const drawn = [];
  for (let i = 0; i < rects.length; i++) {
    const panel = panels[i % panels.length];
    const img = images.get(panel.scene) || images.get(CAST[0].scene);
    if (!img) continue;
    const rect = rects[i];
    const isHero = i === heroIdx;
    // Pop-Out: the hero photo is drawn larger than its panel, breaking the
    // top and right borders and overlapping the title band. Its role label
    // is sized from the ORIGINAL frame, never the popped rect.
    if (layout.popOut && isHero) {
      const popRect = {
        x: rect.x - W * 0.015, y: rect.y - H * 0.012,
        w: rect.w * 1.05, h: rect.h * 1.05, tilt: 0,
      };
      const popImg = images.get(HERO_POP_SCENE) || img;
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.55)';
      ctx.shadowBlur = H * 0.02;
      ctx.shadowOffsetY = H * 0.006;
      drawPanel(ctx, popImg, panel, popRect, gradeId, look, o);
      ctx.restore();
      // The panel frame is drawn only where the photo does not break it:
      // a thin dark line along the bottom and left edges.
      ctx.save();
      ctx.strokeStyle = 'rgba(10,4,18,0.9)';
      ctx.lineWidth = Math.max(2, W * 0.004);
      ctx.beginPath();
      ctx.moveTo(popRect.x, popRect.y + popRect.h);
      ctx.lineTo(popRect.x + popRect.w, popRect.y + popRect.h);
      ctx.moveTo(popRect.x, popRect.y);
      ctx.lineTo(popRect.x, popRect.y + popRect.h);
      ctx.stroke();
      ctx.restore();
      drawn.push({ panel, rect: popRect, labelRect: rect, pop: true });
      continue;
    }
    drawPanel(ctx, img, panel, rect, gradeId, look, o);
    // Labels use the layout rect (upright), never the drawn rect: a slanted
    // panel's drawn rect is in rotated local coordinates.
    drawn.push({ panel, rect, labelRect: rect, pop: false });
  }
  // Role labels after all panels, so a slanted panel's label stays upright.
  // Skip any label whose box crosses the title + script band, so no fragment
  // peeks out from behind the title or its scrim.
  const titlePxEst = fitText(ctx, (state.title || 'VICE ROYALE').toUpperCase(), W * 0.92, Math.round(H * 0.185), (s) => `900 ${s}px ${FONT_TITLE}`, Math.round(H * 0.05));
  const scriptPxEst = Math.max(14, Math.round(H * 0.058));
  const titleZone = { y0: titleY - titlePxEst * 0.82, y1: titleY + scriptPxEst * 1.35 };
  for (const d of drawn) drawRoleLabel(ctx, d.panel, d.labelRect, [titleZone], H);

  // --- grain over the whole art area
  if (look.grain > 0.02) {
    const noise = noiseCanvas(128, 0.5);
    const pat = ctx.createPattern(noise, 'repeat');
    ctx.save();
    ctx.globalAlpha = 0.16 * look.grain;
    ctx.fillStyle = pat;
    ctx.fillRect(0, topBandH, W, botBandY - topBandH);
    ctx.restore();
  }

  // --- top quote band
  ctx.save();
  ctx.fillStyle = '#12061F';
  ctx.fillRect(0, 0, W, topBandH);
  const qPx = Math.max(11, Math.round(topBandH * 0.52));
  ctx.font = `800 ${qPx}px ${FONT_LABEL}`;
  const starW = ctx.measureText('★★★★★  ').width;
  const quoteText = `"${state.quote}" — ${state.quoteSource}`;
  const qMax = W * 0.78;
  const qSize = fitText(ctx, quoteText, qMax, qPx, (s) => `800 ${s}px ${FONT_LABEL}`, 10);
  ctx.fillStyle = '#FFD23F';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.font = `800 ${qSize}px ${FONT_LABEL}`;
  ctx.fillText('★★★★★', W * 0.02, topBandH / 2);
  ctx.fillStyle = '#FFF7E8';
  ctx.fillText(quoteText, W * 0.02 + starW, topBandH / 2);
  ctx.restore();

  // --- title + script (drawn over the art, GTA style)
  const titleInfo = drawTitle(ctx, state, W, H, titleY);
  const scriptPx = Math.max(14, Math.round(H * 0.058));
  ctx.save();
  ctx.font = `${scriptPx}px ${FONT_SCRIPT}`;
  const sw = ctx.measureText(state.script).width;
  const sx = (W - sw) / 2;
  const sy = titleY + scriptPx * 0.95;
  ctx.fillStyle = 'rgba(10, 4, 18, 0.55)';
  ctx.fillRect(sx - scriptPx * 0.5, sy - scriptPx * 1.05, sw + scriptPx, scriptPx * 1.35);
  ctx.fillStyle = '#FF4D9D';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(state.script, sx, sy);
  ctx.restore();

  if (!showFurniture) { ctx.restore(); return { title: titleInfo }; }

  // --- furniture: pills, ribbon, seals
  const pillH = Math.max(18, Math.round(H * 0.032));
  const pillPx = Math.max(11, Math.round(pillH * 0.55));
  // VOL pill, top-right inside the quote band.
  ctx.save();
  ctx.font = `800 ${Math.round(pillH * 0.38)}px ${FONT_LABEL}`;
  const volText = 'VOL. 06';
  const volW = ctx.measureText(volText).width + pillH * 0.64 * 1.1;
  roundRect(ctx, W - W * 0.02 - volW, topBandH * 0.18, volW, pillH * 0.64, pillH * 0.32);
  ctx.fillStyle = '#FFD23F';
  ctx.fill();
  ctx.fillStyle = '#12061F';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(volText, W - W * 0.02 - volW / 2, topBandH * 0.18 + pillH * 0.32 + 1);
  ctx.restore();
  // WANTED pill, top-right over the art.
  const wanted = 'WANTED ★★★★★';
  ctx.save();
  ctx.font = `800 ${pillPx}px ${FONT_LABEL}`;
  const wantedW = ctx.measureText(wanted).width + pillH * 1.1;
  roundRect(ctx, W - wantedW - W * 0.015, topBandH + H * 0.012, wantedW, pillH, pillH / 2);
  ctx.fillStyle = '#1B0B2E';
  ctx.fill();
  ctx.strokeStyle = '#FFD23F';
  ctx.lineWidth = Math.max(1.5, pillH * 0.06);
  ctx.stroke();
  ctx.fillStyle = '#FFD23F';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(wanted, W - wantedW - W * 0.015 + wantedW / 2, topBandH + H * 0.012 + pillH / 2 + pillPx * 0.04);
  ctx.restore();
  // COLLECTOR'S EDITION ribbon, top-left over the art.
  ctx.save();
  ctx.translate(W * 0.02, topBandH + H * 0.02);
  ctx.rotate(-0.06);
  ctx.fillStyle = '#FF2E88';
  const ribH = pillH * 0.9;
  ctx.font = `800 ${Math.round(ribH * 0.5)}px ${FONT_LABEL}`;
  const ribText = "COLLECTOR'S EDITION";
  const ribW = ctx.measureText(ribText).width + ribH * 1.2;
  ctx.fillRect(0, 0, ribW, ribH);
  ctx.beginPath();
  ctx.moveTo(ribW, 0); ctx.lineTo(ribW + ribH * 0.5, ribH / 2); ctx.lineTo(ribW, ribH);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#FFF7E8';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(ribText, ribH * 0.6, ribH / 2 + 1);
  ctx.restore();
  // HEAT pill under the ribbon.
  pill(ctx, 'HEAT ★★★★★', W * 0.02, topBandH + H * 0.02 + pillH, pillH * 0.85, '#FFF7E8', '#FF2E88', Math.round(pillH * 0.5));
  // Gold EST. 2026 seal, top-right corner over the art (below WANTED).
  drawGoldSeal(ctx, W - W * 0.055, topBandH + H * 0.10 + pillH, H * 0.042, ['EST.', '2026']);
  // Starburst ORIGINAL COVER ART seal, overlapping the panels top-right —
  // placed on the seam between the hero and the right panels, clear of
  // every layout's faces and role labels.
  drawStarburst(ctx, W * 0.70, topBandH + H * 0.11, H * 0.042, 'ORIGINAL\nCOVER ART');

  // --- bottom band: palm gradient, COMING SOON, billing, seal, barcode
  drawPalmBand(ctx, W, H, botBandY, BB * H, gradeId);
  ctx.save();
  ctx.textBaseline = 'middle';
  const tagPx = Math.max(12, Math.round(BB * H * 0.32));
  ctx.font = `800 ${tagPx}px ${FONT_LABEL}`;
  ctx.fillStyle = '#FFF7E8';
  ctx.textAlign = 'left';
  ctx.fillText('COMING SOON', W * 0.02, botBandY + BB * H * 0.38);
  ctx.fillStyle = '#FFE9A8';
  ctx.font = `800 ${Math.round(tagPx * 0.95)}px ${FONT_LABEL}`;
  ctx.textAlign = 'center';
  ctx.fillText(state.tagline, W * 0.5, botBandY + BB * H * 0.30);
  // Billing lists the cast roles, fitted to the safe width so it never
  // reaches the seal or barcode on the right. If even the minimum size
  // cannot fit the whole cast on one line, the billing wraps to two lines
  // at a " · " boundary instead of clipping a name.
  const castNames = (state.panels || []).slice(0, 5).map((p) => p.role).join(' · ');
  const billing = `A VICE ROYALE PICTURE · STARRING ${castNames}`;
  const billing2 = 'MADE FROM YOUR OWN PHOTOS · GRADED BY HAND';
  const safeW = billingSafeWidth(W, H);
  const bPx = fitText(ctx, billing, safeW, Math.max(9, Math.round(BB * H * 0.22)), (s) => `600 ${s}px ${FONT_LABEL}`, 8);
  ctx.font = `600 ${bPx}px ${FONT_LABEL}`;
  if (ctx.measureText(billing).width <= safeW) {
    ctx.fillStyle = '#FFE9A8';
    ctx.fillText(billing, W * 0.5, botBandY + BB * H * 0.62);
    ctx.fillStyle = 'rgba(255, 233, 168, 0.8)';
    ctx.fillText(billing2, W * 0.5, botBandY + BB * H * 0.85);
  } else {
    const parts = billing.split(' · ');
    let line1 = parts[0];
    let rest = parts.slice(1);
    for (let i = 1; i < parts.length; i++) {
      const joined = `${line1} · ${parts[i]}`;
      if (ctx.measureText(joined).width <= safeW) { line1 = joined; rest = parts.slice(i + 1); }
      else break;
    }
    const line2 = rest.join(' · ');
    const bPx2 = fitText(ctx, line2, safeW, bPx, (s) => `600 ${s}px ${FONT_LABEL}`, 8);
    ctx.font = `600 ${bPx2}px ${FONT_LABEL}`;
    ctx.fillStyle = '#FFE9A8';
    ctx.fillText(line1, W * 0.5, botBandY + BB * H * 0.52);
    ctx.fillText(line2, W * 0.5, botBandY + BB * H * 0.70);
    ctx.font = `600 ${Math.max(8, Math.round(bPx2 * 0.85))}px ${FONT_LABEL}`;
    ctx.fillStyle = 'rgba(255, 233, 168, 0.8)';
    ctx.fillText(billing2, W * 0.5, botBandY + BB * H * 0.88);
  }
  ctx.restore();
  drawGoldSeal(ctx, W * 0.86, botBandY + BB * H * 0.5, H * 0.024, ['ORIGINAL', 'COVER ART']);
  drawBarcode(ctx, W * 0.93, botBandY + BB * H * 0.22, W * 0.05, BB * H * 0.56);

  // --- thin gold frame around the whole cover
  if (state.goldFrame !== false) {
    ctx.save();
    ctx.strokeStyle = '#F5B81D';
    ctx.lineWidth = Math.max(2, W * 0.003);
    ctx.strokeRect(W * 0.004, topBandH * 0.12, W * 0.992, H * 0.996 - topBandH * 0.12);
    ctx.restore();
  }

  ctx.restore();
  return { title: titleInfo };
}
