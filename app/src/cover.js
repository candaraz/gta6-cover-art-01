// cover.js — Vice Cover Studio cover renderer.
// Draws a GTA-style multi-panel poster on a 2D canvas: nine photographic
// scenes, five layouts, four colour grades, a 3D gradient title, a pink
// script subtitle, two-line panel captions and poster furniture, all drawn
// in canvas so the app works offline from its own files.

export const TITLE_FONT = '"Passion One", "Anton", sans-serif';
export const SCRIPT_FONT = '"Yellowtail", cursive';
export const LABEL_FONT = '"Barlow Condensed", "Anton", sans-serif';

// The nine scenes the cover draws from. Two are the kit's own sample
// photos (free to use); the other seven are original model-made scenes
// shipped under app/scenes/. Every panel shows a different scene.
export const SCENES = [
  { file: 'samples/boulevard.jpg', place: 'PALM ROW', time: '7:02 PM', tag: 'REDLINE' },
  { file: 'samples/pier.jpg', place: 'OLD PIER', time: '5:40 PM', tag: 'ONE MORE CAST' },
  { file: 'scenes/sportscar.jpg', place: 'OCEAN DRIVE', time: '6:47 PM', tag: 'LAST LIGHT' },
  { file: 'scenes/neonstreet.jpg', place: 'NEON ROW', time: '11:58 PM', tag: 'NO LAST CALL' },
  { file: 'scenes/speedboat.jpg', place: 'BISCAYNE BAY', time: '6:15 PM', tag: 'FULL THROTTLE' },
  { file: 'scenes/skyline.jpg', place: 'THE BAY', time: '7:31 PM', tag: 'LIGHTS ON' },
  { file: 'scenes/heli.jpg', place: 'THE STRIP', time: '6:03 PM', tag: 'EYES IN THE SKY' },
  { file: 'scenes/motorbike.jpg', place: 'NIGHT RIDER', time: '8:20 PM', tag: 'FULL SEND' },
  { file: 'scenes/marina.jpg', place: 'MARINA DEL SOL', time: '7:48 PM', tag: 'NO WITNESSES' },
];

// The four colour grades. Each one is a per-pixel transform applied to a
// panel image before it is drawn, so the grade is baked into the art.
export const GRADES = {
  sunset: { name: 'Sunset', warm: 1.18, sat: 1.22, lift: 0 },
  neon: { name: 'Neon Night', warm: 0.92, sat: 1.3, lift: -8 },
  golden: { name: 'Golden Hour', warm: 1.32, sat: 1.15, lift: 6 },
  ink: { name: 'Poster Ink', warm: 1.0, sat: 1.0, lift: 0, poster: true },
};

// Panel geometry. Every layout returns panel rects as fractions of the
// cover (x, y, w, h in 0..1) plus the hero index. The title is measured
// before the panels are drawn so captions under it can be skipped.
function gridRects(cols, rows, x0, y0, x1, y1, gap) {
  const rects = [];
  const cw = (x1 - x0 - gap * (cols - 1)) / cols;
  const ch = (y1 - y0 - gap * (rows - 1)) / rows;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      rects.push({ x: x0 + c * (cw + gap), y: y0 + r * (ch + gap), w: cw, h: ch, hero: false });
    }
  }
  return rects;
}

export const LAYOUTS = {
  // Nine Grid: a 3x3 wall of nine distinct scenes, hero top-left.
  nine: {
    name: 'Nine Grid',
    panels() {
      const rects = gridRects(3, 3, 0.012, 0.012, 0.988, 0.938, 0.008);
      rects[0].hero = true;
      return rects;
    },
    band: false,
  },
  // Title Band: panels in the top two thirds, title and script in a clean
  // dedicated band below — the lettering never fights the art.
  band: {
    name: 'Title Band',
    panels() {
      const rects = [];
      rects.push({ x: 0.012, y: 0.012, w: 0.315, h: 0.628, hero: true });
      rects.push(...gridRects(2, 3, 0.335, 0.012, 0.988, 0.64, 0.008));
      return rects;
    },
    band: true,
  },
  // Dense Grid: a tall hero on the left and a 2x3 captioned grid on the
  // right — seven panels, the GTA V cover's shape.
  dense: {
    name: 'Dense Grid',
    panels() {
      const rects = [];
      rects.push({ x: 0.012, y: 0.012, w: 0.315, h: 0.926, hero: true });
      rects.push(...gridRects(2, 3, 0.335, 0.012, 0.988, 0.938, 0.008));
      return rects;
    },
    band: false,
  },
  // Hero + Strip: a wide hero on the left and a 2x2 strip on the right.
  hero: {
    name: 'Hero + Strip',
    panels() {
      const rects = [];
      rects.push({ x: 0.012, y: 0.012, w: 0.54, h: 0.926, hero: true });
      rects.push(...gridRects(2, 2, 0.56, 0.012, 0.988, 0.938, 0.008));
      return rects;
    },
    band: false,
  },
  // Full Grid: a full-width hero on top and a four-panel strip below,
  // the key-art shape — hero up high, vignettes underneath.
  full: {
    name: 'Full Grid',
    panels() {
      const rects = [];
      rects.push({ x: 0.012, y: 0.012, w: 0.976, h: 0.585, hero: true });
      rects.push(...gridRects(4, 1, 0.012, 0.605, 0.988, 0.938, 0.008));
      return rects;
    },
    band: false,
  },
};

// Loads every scene image once and caches it by file name.
const imageCache = new Map();
export function loadImage(src) {
  if (imageCache.has(src)) return imageCache.get(src);
  const p = new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('cannot load ' + src));
    img.src = src;
  });
  imageCache.set(src, p);
  return p;
}

// Draws an image cover-fit into a rect of an offscreen canvas, honouring
// a per-panel crop (cx, cy in 0..1, the focus point) and zoom.
export function coverFitCanvas(img, w, h, cx, cy, zoom) {
  const c = document.createElement('canvas');
  c.width = Math.max(2, Math.round(w));
  c.height = Math.max(2, Math.round(h));
  const ctx = c.getContext('2d');
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  const s = Math.max(w / iw, h / ih) * (zoom || 1);
  const dw = iw * s;
  const dh = ih * s;
  const dx = w / 2 - dw * (cx == null ? 0.5 : cx);
  const dy = h / 2 - dh * (cy == null ? 0.5 : cy);
  ctx.drawImage(img, dx, dy, dw, dh);
  return c;
}

// Applies one of the four grades to a canvas, in place, pixel by pixel.
// Sunset warms the light and pushes saturation; Neon Night cools the
// shadows and pushes magenta and cyan; Golden Hour warms everything and
// lifts the brights. Poster Ink posterises to four levels a channel and
// then duotones the result pink into purple — the illustrated look.
export function applyGrade(canvas, gradeId) {
  const g = GRADES[gradeId] || GRADES.sunset;
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const data = ctx.getImageData(0, 0, w, h);
  const px = data.data;
  const warm = g.warm;
  const sat = g.sat;
  const lift = g.lift;
  for (let i = 0; i < px.length; i += 4) {
    let r = px[i];
    let gr = px[i + 1];
    let b = px[i + 2];
    if (g.poster) {
      r = Math.round(r / 64) * 64;
      gr = Math.round(gr / 64) * 64;
      b = Math.round(b / 64) * 64;
      const lum = 0.299 * r + 0.587 * gr + 0.114 * b;
      const t = lum / 255;
      r = Math.round(255 * (0.16 + 0.84 * t) * (0.55 + 0.45 * t));
      gr = Math.round(255 * (0.10 + 0.55 * t));
      b = Math.round(255 * (0.32 + 0.45 * t));
    } else {
      const lum = 0.299 * r + 0.587 * gr + 0.114 * b;
      r = lum + (r - lum) * sat;
      gr = lum + (gr - lum) * sat;
      b = lum + (b - lum) * sat;
      r = r * warm + lift;
      gr = gr * (2 - warm) * 0.5 + gr * 0.5 + lift * 0.5;
      b = b * (2 - warm) * 0.6 + b * 0.4 + lift;
    }
    px[i] = r < 0 ? 0 : r > 255 ? 255 : r;
    px[i + 1] = gr < 0 ? 0 : gr > 255 ? 255 : gr;
    px[i + 2] = b < 0 ? 0 : b > 255 ? 255 : b;
  }
  ctx.putImageData(data, 0, 0);
  if (g.poster) drawHalftone(ctx, w, h);
  return canvas;
}

// Halftone dots over a posterised panel: a coarse grid of dark dots whose
// size follows the local brightness, the comic-book print look.
export function drawHalftone(ctx, w, h) {
  const step = Math.max(7, Math.round(w / 90));
  ctx.save();
  ctx.fillStyle = 'rgba(26, 11, 46, 0.28)';
  for (let y = step / 2; y < h; y += step) {
    for (let x = step / 2; x < w; x += step) {
      const d = ctx.getImageData(Math.round(x), Math.round(y), 1, 1).data;
      const lum = (0.299 * d[0] + 0.587 * d[1] + 0.114 * d[2]) / 255;
      const rad = (1 - lum) * step * 0.32;
      if (rad > 0.6) {
        ctx.beginPath();
        ctx.arc(x, y, rad, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  ctx.restore();
}

// Returns a graded panel canvas for one scene at one size, cached by
// scene, grade and size so the editor stays fast.
const gradeCache = new Map();
export function gradedPanel(img, gradeId, w, h, crop) {
  const key = img.src + '|' + gradeId + '|' + w + 'x' + h + '|' + (crop ? crop.x + ',' + crop.y + ',' + crop.zoom : '');
  if (gradeCache.has(key)) return gradeCache.get(key);
  const c = coverFitCanvas(img, w, h, crop ? crop.x : 0.5, crop ? crop.y : 0.5, crop ? crop.zoom : 1);
  applyGrade(c, gradeId);
  if (gradeCache.size > 120) gradeCache.clear();
  gradeCache.set(key, c);
  return c;
}

// ---- lettering and furniture ----

function roundRectPath(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// Fits the title to a max width, capping its height, and returns the size.
function titleMetrics(ctx, text, maxW, capH) {
  let size = capH;
  ctx.font = '900 ' + size + 'px ' + TITLE_FONT;
  const w = ctx.measureText(text).width;
  if (w > maxW) size *= maxW / w;
  return Math.max(24, size);
}

// The 3D title: six deep-purple extrusion copies stepping down-right,
// a thick black outline, then the cream-to-orange-to-pink gradient fill.
function drawTitle(ctx, text, cx, baseline, size) {
  ctx.save();
  ctx.font = '900 ' + size + 'px ' + TITLE_FONT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.lineJoin = 'round';
  const steps = 6;
  const dx = size * 0.018;
  const dy = size * 0.024;
  ctx.fillStyle = '#2A0F4D';
  for (let i = steps; i >= 1; i--) ctx.fillText(text, cx + dx * i, baseline + dy * i);
  ctx.lineWidth = size * 0.09;
  ctx.strokeStyle = '#0A0612';
  ctx.strokeText(text, cx, baseline);
  const g = ctx.createLinearGradient(0, baseline - size, 0, baseline);
  g.addColorStop(0, '#FFF3D6');
  g.addColorStop(0.5, '#FF8A3D');
  g.addColorStop(1, '#FF2E88');
  ctx.fillStyle = g;
  ctx.fillText(text, cx, baseline);
  ctx.restore();
}

// The pink brush-script subtitle, on a dark scrim so it reads on any photo.
function drawScript(ctx, text, cx, baseline, size) {
  ctx.save();
  ctx.font = size + 'px ' + SCRIPT_FONT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  const w = ctx.measureText(text).width;
  const pad = size * 0.55;
  roundRectPath(ctx, cx - w / 2 - pad, baseline - size - pad * 0.35, w + pad * 2, size + pad * 0.75, size * 0.4);
  ctx.fillStyle = 'rgba(10, 6, 18, 0.55)';
  ctx.fill();
  ctx.fillStyle = '#FF2E88';
  ctx.shadowColor = '#FF1493';
  ctx.shadowBlur = size * 0.3;
  ctx.fillText(text, cx, baseline);
  ctx.restore();
}

// A two-line black caption label: big place name, smaller time-tagline.
function drawCaption(ctx, place, sub, x, y, u) {
  ctx.save();
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  const pad = 9 * u;
  const fs1 = 26 * u;
  const fs2 = 17 * u;
  ctx.font = '800 ' + fs1 + 'px ' + LABEL_FONT;
  const w1 = ctx.measureText(place).width;
  ctx.font = '700 ' + fs2 + 'px ' + LABEL_FONT;
  const w2 = ctx.measureText(sub).width;
  const bw = Math.max(w1, w2) + pad * 2;
  const bh = fs1 + fs2 + pad * 1.7;
  ctx.fillStyle = 'rgba(10, 6, 18, 0.92)';
  ctx.fillRect(x, y, bw, bh);
  ctx.fillStyle = '#FFF3D6';
  ctx.font = '800 ' + fs1 + 'px ' + LABEL_FONT;
  ctx.fillText(place, x + pad, y + pad * 0.55);
  ctx.fillStyle = '#FFB86B';
  ctx.font = '700 ' + fs2 + 'px ' + LABEL_FONT;
  ctx.fillText(sub, x + pad, y + pad * 0.55 + fs1 + 2 * u);
  ctx.restore();
}

// The gold starburst seal.
function drawSeal(ctx, cx, cy, r, line1, line2) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.beginPath();
  const spikes = 16;
  for (let i = 0; i < spikes * 2; i++) {
    const ang = (i / (spikes * 2)) * Math.PI * 2 - Math.PI / 2;
    const rad = i % 2 === 0 ? r : r * 0.8;
    const x = Math.cos(ang) * rad;
    const y = Math.sin(ang) * rad;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = '#F5B81D';
  ctx.fill();
  ctx.lineWidth = Math.max(2, r * 0.06);
  ctx.strokeStyle = '#8A5A00';
  ctx.stroke();
  ctx.fillStyle = '#3B1C6E';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '800 ' + r * 0.32 + 'px ' + LABEL_FONT;
  ctx.fillText(line1, 0, -r * 0.2);
  ctx.fillText(line2, 0, r * 0.2);
  ctx.restore();
}

// A small rounded pill with centred text.
function drawPill(ctx, text, cx, cy, h, fg, bg) {
  ctx.save();
  ctx.font = '800 ' + h * 0.52 + 'px ' + LABEL_FONT;
  const w = ctx.measureText(text).width + h * 1.1;
  roundRectPath(ctx, cx - w / 2, cy - h / 2, w, h, h / 2);
  ctx.fillStyle = bg;
  ctx.fill();
  ctx.lineWidth = Math.max(2, h * 0.07);
  ctx.strokeStyle = fg;
  ctx.stroke();
  ctx.fillStyle = fg;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, cx, cy + h * 0.03);
  ctx.restore();
}

// The collector's ribbon: a red band with folded ends.
function drawRibbon(ctx, text, cx, cy, h) {
  ctx.save();
  ctx.font = '800 ' + h * 0.5 + 'px ' + LABEL_FONT;
  const w = ctx.measureText(text).width + h * 1.4;
  ctx.fillStyle = '#C8102E';
  ctx.beginPath();
  ctx.moveTo(cx - w / 2, cy - h / 2);
  ctx.lineTo(cx + w / 2, cy - h / 2);
  ctx.lineTo(cx + w / 2 - h * 0.35, cy);
  ctx.lineTo(cx + w / 2, cy + h / 2);
  ctx.lineTo(cx - w / 2, cy + h / 2);
  ctx.lineTo(cx - w / 2 + h * 0.35, cy);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#FFF3D6';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, cx, cy + h * 0.03);
  ctx.restore();
}

// The five-star press quote, drawn in the hero panel on a dark scrim.
function drawQuote(ctx, quote, by, x, y, maxW, u) {
  ctx.save();
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  const starSize = 22 * u;
  const fs = 26 * u;
  const fsBy = 18 * u;
  ctx.font = starSize + 'px ' + LABEL_FONT;
  const stars = '★★★★★';
  const starsW = ctx.measureText(stars).width;
  ctx.font = '700 ' + fs + 'px ' + LABEL_FONT;
  const words = quote.split(' ');
  const lines = [];
  let line = '';
  for (const word of words) {
    const test = line ? line + ' ' + word : word;
    if (ctx.measureText('"' + test + '"').width > maxW && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  const lh = fs * 1.25;
  const bh = starSize + lines.length * lh + fsBy + 22 * u;
  const bw = maxW + 24 * u;
  roundRectPath(ctx, x, y, bw, bh, 8 * u);
  ctx.fillStyle = 'rgba(10, 6, 18, 0.6)';
  ctx.fill();
  ctx.fillStyle = '#FFD34D';
  ctx.font = starSize + 'px ' + LABEL_FONT;
  ctx.fillText(stars, x + 12 * u, y + 8 * u);
  ctx.fillStyle = '#FFF3D6';
  ctx.font = '700 ' + fs + 'px ' + LABEL_FONT;
  lines.forEach((ln, i) => {
    const text = (i === 0 ? '"' : '') + ln + (i === lines.length - 1 ? '"' : '');
    ctx.fillText(text, x + 12 * u, y + 8 * u + starSize + 4 * u + i * lh);
  });
  ctx.fillStyle = '#FFB86B';
  ctx.font = '700 ' + fsBy + 'px ' + LABEL_FONT;
  ctx.fillText('— ' + by, x + 12 * u, y + 8 * u + starSize + 4 * u + lines.length * lh + 4 * u);
  ctx.restore();
}

// A palm silhouette: a curved trunk with five drooping fronds.
function drawPalm(ctx, x, y, s, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 7;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(6, -55, 22, -95);
  ctx.stroke();
  for (let i = 0; i < 5; i++) {
    const a = -Math.PI * (0.12 + i * 0.19);
    const len = 62 - Math.abs(i - 2) * 9;
    const ex = 22 + Math.cos(a) * len;
    const ey = -95 + Math.sin(a) * len * 0.55;
    ctx.beginPath();
    ctx.moveTo(22, -95);
    ctx.quadraticCurveTo(22 + Math.cos(a) * len * 0.5, -95 + Math.sin(a) * len * 0.5 - 14, ex, ey + 16);
    ctx.stroke();
  }
  ctx.restore();
}

// The bottom palm band: silhouettes, the tagline, credits and a barcode.
function drawPalmBand(ctx, W, H, tagline) {
  const bandH = H * 0.062;
  const y0 = H - bandH;
  const g = ctx.createLinearGradient(0, y0, 0, H);
  g.addColorStop(0, '#2A0F4D');
  g.addColorStop(1, '#0A0612');
  ctx.fillStyle = g;
  ctx.fillRect(0, y0, W, bandH);
  ctx.fillStyle = 'rgba(255, 138, 61, 0.9)';
  ctx.fillRect(0, y0, W, Math.max(2, H * 0.004));
  const s = bandH / 110;
  const n = Math.max(3, Math.floor(W / (bandH * 2.6)));
  for (let i = 0; i < n; i++) {
    const x = (W * (i + 0.5)) / n + (i % 2 ? bandH * 0.35 : -bandH * 0.35);
    drawPalm(ctx, x, H - bandH * 0.08, s * (0.85 + (i % 3) * 0.12), '#0A0612');
  }
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '800 ' + bandH * 0.42 + 'px ' + LABEL_FONT;
  ctx.fillStyle = '#FFF3D6';
  const tw = ctx.measureText(tagline).width;
  roundRectPath(ctx, W / 2 - tw / 2 - bandH * 0.5, y0 + bandH * 0.16, tw + bandH, bandH * 0.68, bandH * 0.3);
  ctx.fillStyle = 'rgba(10, 6, 18, 0.55)';
  ctx.fill();
  ctx.fillStyle = '#FFF3D6';
  ctx.fillText(tagline, W / 2, y0 + bandH * 0.52);
  ctx.textAlign = 'left';
  ctx.font = '700 ' + bandH * 0.2 + 'px ' + LABEL_FONT;
  ctx.fillStyle = 'rgba(255, 243, 214, 0.75)';
  ctx.fillText('VICE COVER STUDIO · ALL PHOTOS ORIGINAL · EST. 2026', W * 0.012, y0 + bandH * 0.5);
  ctx.restore();
  const bw = W * 0.045;
  const bh = bandH * 0.62;
  const bx = W * 0.985 - bw;
  const by = y0 + (bandH - bh) / 2;
  ctx.save();
  ctx.fillStyle = '#FFF3D6';
  ctx.fillRect(bx - 4, by - 4, bw + 8, bh + 8);
  ctx.fillStyle = '#0A0612';
  let x = bx;
  let seed = 7;
  while (x < bx + bw - 2) {
    seed = (seed * 37 + 11) % 97;
    const wBar = 1 + (seed % 3) * (bw / 60);
    if (seed % 3 !== 0) ctx.fillRect(x, by, wBar, bh);
    x += wBar + bw / 60;
  }
  ctx.restore();
}

// ---- the cover ----

export function drawCover(ctx, state, images, W, H) {
  const layout = LAYOUTS[state.layout] || LAYOUTS.nine;
  const panels = layout.panels();
  const u = Math.min(W, H) / 1000;
  ctx.fillStyle = '#1A0B2E';
  ctx.fillRect(0, 0, W, H);

  // Measure the title first: captions under its top are skipped, so no
  // caption fragment can peek out from behind the lettering.
  const bandMode = layout.band;
  const titleMaxW = bandMode ? W * 0.6 : W * 0.9;
  const titleCap = H * (bandMode ? 0.11 : 0.2);
  const titleSize = titleMetrics(ctx, state.title, titleMaxW, titleCap);
  const titleBaseline = bandMode ? H * 0.82 : H * 0.8;
  const titleTop = titleBaseline - titleSize;

  // Panels, each graded, bordered and captioned.
  panels.forEach((p, i) => {
    const ps = state.panels[i] || { scene: i % SCENES.length, x: 0.5, y: 0.5, zoom: 1 };
    const scene = SCENES[ps.scene % SCENES.length];
    const img = ps.userPhoto ? images[ps.userPhoto] : images[scene.file];
    const px = p.x * W;
    const py = p.y * H;
    const pw = p.w * W;
    const ph = p.h * H;
    if (img) {
      const graded = gradedPanel(img, state.grade, Math.max(2, Math.round(pw)), Math.max(2, Math.round(ph)), { x: ps.x, y: ps.y, zoom: ps.zoom });
      ctx.drawImage(graded, px, py, pw, ph);
    } else {
      ctx.fillStyle = '#3B1C6E';
      ctx.fillRect(px, py, pw, ph);
    }
    ctx.strokeStyle = 'rgba(255, 243, 214, 0.9)';
    ctx.lineWidth = Math.max(2, 3 * u);
    ctx.strokeRect(px, py, pw, ph);
    if (bandMode || py < titleTop) {
      drawCaption(ctx, scene.place, scene.time + ' — ' + scene.tag, px + 8 * u, py + 8 * u, u);
    }
  });

  // The clean title band.
  if (bandMode) {
    const bg = ctx.createLinearGradient(0, H * 0.66, 0, H * 0.94);
    bg.addColorStop(0, '#3B1C6E');
    bg.addColorStop(1, '#FF2E88');
    ctx.fillStyle = bg;
    ctx.fillRect(0, H * 0.66, W, H * 0.28);
    ctx.fillStyle = 'rgba(255, 138, 61, 0.9)';
    ctx.fillRect(0, H * 0.66, W, Math.max(2, H * 0.004));
  }

  // Title and script, with a guaranteed clear gap between them and the
  // furniture row below.
  drawTitle(ctx, state.title, W / 2, titleBaseline, titleSize);
  const scriptSize = H * 0.055;
  const scriptBaseline = titleBaseline + titleSize * 0.22 + scriptSize;
  drawScript(ctx, state.script, W / 2, scriptBaseline, scriptSize);

  // The palm band goes down before the furniture, so the pills and ribbon
  // paint over the palm fronds instead of under them.
  drawPalmBand(ctx, W, H, state.tagline);

  if (state.furniture) {
    const hero = panels[0];
    const hx = hero.x * W;
    const hy = hero.y * H;
    const hw = hero.w * W;
    const hh = hero.h * H;
    // The press quote lives in the hero, below its caption tab.
    drawQuote(ctx, state.quote, state.quoteBy, hx + 10 * u, hy + hh * 0.42, hw * 0.86, u);
    // Seal top-right, pills and ribbon in one row just above the palm band.
    drawSeal(ctx, W * 0.955, H * 0.075, H * 0.042, 'EST.', '2026');
    drawPill(ctx, 'VOL. 06', W * 0.075, H * 0.918, H * 0.028, '#FFD34D', 'rgba(10, 6, 18, 0.85)');
    drawRibbon(ctx, "COLLECTOR'S EDITION", W * 0.22, H * 0.918, H * 0.028);
    drawPill(ctx, 'HEAT ★★★★★', W * 0.93, H * 0.918, H * 0.028, '#FF2E88', 'rgba(10, 6, 18, 0.85)');
  }
}

// A default state for one layout: each panel takes a different scene in
// order, the hero keeps its face in the upper third.
export function defaultState(layoutId, gradeId) {
  const layout = LAYOUTS[layoutId] || LAYOUTS.nine;
  const panels = layout.panels();
  return {
    layout: layoutId,
    grade: gradeId || 'sunset',
    title: 'VICE ROYALE',
    script: 'chasing the last light',
    quote: 'THE COAST HAS NEVER LOOKED THIS GUILTY.',
    quoteBy: 'THE VICE LEDGER',
    tagline: 'EVERY SUNSET HAS A PRICE',
    furniture: true,
    panels: panels.map((p, i) => ({ scene: i % SCENES.length, x: 0.5, y: p.hero ? 0.32 : 0.5, zoom: 1 })),
  };
}

// Renders a cover to an offscreen canvas at the requested pixel size.
export function renderCover(state, images, w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  drawCover(c.getContext('2d'), state, images, w, h);
  return c;
}
