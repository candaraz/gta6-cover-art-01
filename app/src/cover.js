// Vice Royale — Golden Hour Cover Studio (v6)
// A canvas cover engine: hero-close-up mosaic posters from any photos.
// Everything is drawn in code on a 2D canvas — panels, striped gradient
// title, script subtitle, quote band, starburst seal, billing, barcode.
// No network: every font and picture is a file under app/.

export const FONTS = {
  title: '"Passion One", "Anton", sans-serif',
  display: '"Anton", "Passion One", sans-serif',
  script: '"Yellowtail", cursive',
  label: '"Barlow Condensed", sans-serif',
};

export const CAST = [
  { id: 'hero',     src: 'scenes/hero.jpg',     role: 'THE FIXER',  name: 'THE FIXER' },
  { id: 'driver',   src: 'scenes/driver.jpg',   role: 'THE DRIVER',  name: 'THE DRIVER' },
  { id: 'getaway',  src: 'scenes/getaway.jpg',  role: 'THE GETAWAY', name: 'THE GETAWAY' },
  { id: 'mechanic', src: 'scenes/mechanic.jpg', role: 'THE MECHANIC', name: 'THE MECHANIC' },
  { id: 'boss',     src: 'scenes/boss.jpg',     role: 'THE BOSS',    name: 'THE BOSS' },
  { id: 'captain',  src: 'scenes/captain.jpg',  role: 'THE CAPTAIN', name: 'THE CAPTAIN' },
  { id: 'brains',   src: 'scenes/brains.jpg',   role: 'THE BRAINS',  name: 'THE BRAINS' },
  { id: 'rider',    src: 'scenes/rider.jpg',    role: 'THE RIDER',   name: 'THE RIDER' },
  { id: 'lookout',  src: 'scenes/lookout.jpg',  role: 'THE LOOKOUT', name: 'THE LOOKOUT' },
  { id: 'fixer',    src: 'scenes/fixer.jpg',    role: 'THE FIXER',   name: 'THE FIXER' },
];

export const PLACES = [
  { id: 'boulevard', src: 'samples/boulevard.jpg', label: 'BOULEVARD' },
  { id: 'neon',      src: 'samples/neon.jpg',      label: 'NEON ROW' },
  { id: 'pier',      src: 'samples/pier.jpg',      label: 'THE PIER' },
  { id: 'skyline',   src: 'samples/skyline.jpg',   label: 'SKYLINE' },
];

// Ten colour grades. Each is a canvas filter plus a tint overlay drawn
// over the panels (composite 'overlay' / 'soft-light'), so the grade is
// baked into every exported PNG.
export const GRADES = {
  sunset:   { label: 'Sunset',   filter: 'sepia(0.35) saturate(1.7) contrast(1.08) brightness(1.02)', tint: '#ff9a3d', tintAlpha: 0.10, mode: 'overlay' },
  golden:   { label: 'Golden',   filter: 'sepia(0.55) saturate(1.5) contrast(1.05) brightness(1.05)', tint: '#ffc93d', tintAlpha: 0.12, mode: 'soft-light' },
  twilight: { label: 'Twilight', filter: 'sepia(0.15) saturate(1.6) contrast(1.12) brightness(0.97) hue-rotate(-12deg)', tint: '#7b4dff', tintAlpha: 0.14, mode: 'overlay' },
  neon:     { label: 'Neon',     filter: 'saturate(2.1) contrast(1.15) brightness(1.0) hue-rotate(8deg)', tint: '#ff2e88', tintAlpha: 0.10, mode: 'overlay' },
  painted:  { label: 'Painted',  filter: 'saturate(1.9) contrast(1.25) brightness(1.03)', tint: '#ff7a1a', tintAlpha: 0.08, mode: 'soft-light' },
  noir:     { label: 'Noir',     filter: 'grayscale(0.9) contrast(1.35) brightness(0.95)', tint: '#d4a017', tintAlpha: 0.10, mode: 'soft-light' },
  vice:     { label: 'Vice',     filter: 'saturate(1.8) contrast(1.1) hue-rotate(28deg)', tint: '#c400ff', tintAlpha: 0.12, mode: 'overlay' },
  ember:    { label: 'Ember',    filter: 'sepia(0.6) saturate(1.9) contrast(1.12) hue-rotate(-18deg)', tint: '#ff3d00', tintAlpha: 0.12, mode: 'overlay' },
  palm:     { label: 'Palm',     filter: 'saturate(1.6) contrast(1.08) hue-rotate(-32deg)', tint: '#00c2a8', tintAlpha: 0.10, mode: 'overlay' },
  mono:     { label: 'Mono Gold', filter: 'grayscale(1) sepia(0.7) contrast(1.2) brightness(1.02)', tint: '#e8b64c', tintAlpha: 0.10, mode: 'soft-light' },
};

export const GRADE_IDS = Object.keys(GRADES);

// ---- image loading -------------------------------------------------------

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

export async function loadCast() {
  const out = {};
  for (const c of CAST) {
    try { out[c.id] = await loadImage(c.src); } catch (e) { out[c.id] = null; }
  }
  return out;
}

export async function loadPlaces() {
  const out = {};
  for (const p of PLACES) {
    try { out[p.id] = await loadImage(p.src); } catch (e) { out[p.id] = null; }
  }
  return out;
}

export async function ensureFonts() {
  const families = [
    '900 100px "Passion One"', '700 100px "Passion One"', '400 100px "Passion One"',
    '400 100px "Anton"', '400 100px "Yellowtail"',
    '700 40px "Barlow Condensed"', '600 40px "Barlow Condensed"', '400 40px "Barlow Condensed"',
  ];
  try {
    await Promise.all(families.map((f) => document.fonts.load(f)));
    await document.fonts.ready;
  } catch (e) { /* fonts fall back to sans-serif; the cover still draws */ }
}

// ---- small drawing helpers ----------------------------------------------

export function roundRectPath(ctx, x, y, w, h, r) {
  const rr = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

export function starburstPath(ctx, cx, cy, rOuter, rInner, points) {
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? rOuter : rInner;
    const a = (Math.PI * i) / points - Math.PI / 2;
    const x = cx + Math.cos(a) * r;
    const y = cy + Math.sin(a) * r;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

// Cover-fit an image into a rect, biased toward the upper third (the face
// zone) unless the caller gives an explicit focus point (0..1, 0..1).
// focus.zoom (default 1) scales the image inside the frame.
export function drawImageCover(ctx, img, x, y, w, h, focus) {
  if (!img) return;
  const fx = focus ? focus.x : 0.5;
  const fy = focus ? focus.y : 0.32; // faces sit in the upper third
  const zoom = focus && focus.zoom ? focus.zoom : 1;
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  const scale = Math.max(w / iw, h / ih) * zoom;
  const dw = iw * scale;
  const dh = ih * scale;
  const dx = x + (w - dw) * fx;
  const dy = y + (h - dh) * fy;
  ctx.drawImage(img, dx, dy, dw, dh);
}

// A soft dark gradient at the bottom of a panel so a role label stays readable.
export function panelShade(ctx, x, y, w, h) {
  const g = ctx.createLinearGradient(0, y + h * 0.55, 0, y + h);
  g.addColorStop(0, 'rgba(10,4,20,0)');
  g.addColorStop(1, 'rgba(10,4,20,0.72)');
  ctx.fillStyle = g;
  ctx.fillRect(x, y + h * 0.55, w, h * 0.45);
}

// ---- grades ---------------------------------------------------------------

export function applyGradeToContext(ctx, gradeId) {
  const g = GRADES[gradeId] || GRADES.sunset;
  try { ctx.filter = g.filter; } catch (e) { ctx.filter = 'none'; }
  return g;
}

export function clearGradeFromContext(ctx) {
  try { ctx.filter = 'none'; } catch (e) {}
}

export function tintRect(ctx, x, y, w, h, gradeId) {
  const g = GRADES[gradeId] || GRADES.sunset;
  ctx.save();
  ctx.globalCompositeOperation = g.mode;
  ctx.globalAlpha = g.tintAlpha;
  ctx.fillStyle = g.tint;
  ctx.fillRect(x, y, w, h);
  ctx.restore();
}

// ---- panels ---------------------------------------------------------------

// Draw one photo panel: gold frame, graded image, bottom shade, role label.
// opts: { img, label, grade, frame, focus, slant }
export function drawPanel(ctx, rect, opts) {
  const { x, y, w, h } = rect;
  const grade = opts.grade || 'sunset';
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  const g = applyGradeToContext(ctx, grade);
  drawImageCover(ctx, opts.img, x, y, w, h, opts.focus);
  clearGradeFromContext(ctx);
  tintRect(ctx, x, y, w, h, grade);
  // warm sunset wash across the top of every panel
  const wash = ctx.createLinearGradient(0, y, 0, y + h * 0.5);
  wash.addColorStop(0, 'rgba(255,150,60,0.16)');
  wash.addColorStop(1, 'rgba(255,150,60,0)');
  ctx.fillStyle = wash;
  ctx.fillRect(x, y, w, h * 0.5);
  panelShade(ctx, x, y, w, h);
  ctx.restore();

  // gold frame
  ctx.save();
  ctx.strokeStyle = '#f5c542';
  ctx.lineWidth = Math.max(2, w * 0.012);
  ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
  ctx.strokeStyle = 'rgba(245,197,66,0.45)';
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 5, y + 5, w - 10, h - 10);
  ctx.restore();

  // role label: small angled black tab, gold text. The hero's label goes at
  // the TOP of its panel so the title block never covers it. The font is
  // sized from the panel WIDTH (capped) so a tall hero panel does not get
  // a giant label.
  if (opts.label) {
    const fs = Math.max(11, Math.min(w * 0.075, 26));
    ctx.save();
    ctx.font = `700 ${fs}px ${FONTS.label}`;
    const tw = ctx.measureText(opts.label).width;
    const padX = fs * 0.55;
    const padY = fs * 0.28;
    const bw = tw + padX * 2;
    const bh = fs + padY * 2;
    const bx = x + w * 0.045;
    const by = opts.labelTop ? y + h * 0.045 : y + h - bh - h * 0.05;
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.lineTo(bx + bw, by);
    ctx.lineTo(bx + bw - fs * 0.45, by + bh);
    ctx.lineTo(bx, by + bh);
    ctx.closePath();
    ctx.fillStyle = 'rgba(8,4,16,0.92)';
    ctx.fill();
    ctx.fillStyle = '#f5c542';
    ctx.textBaseline = 'middle';
    ctx.fillText(opts.label, bx + padX, by + bh / 2 + 1);
    ctx.restore();
  }
}

// A slanted panel: same as drawPanel but sheared, for the Slanted layout.
export function drawSlantedPanel(ctx, rect, opts, slantPx) {
  const { x, y, w, h } = rect;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x + slantPx, y);
  ctx.lineTo(x + w, y);
  ctx.lineTo(x + w - slantPx, y + h);
  ctx.lineTo(x, y + h);
  ctx.closePath();
  ctx.clip();
  const g = applyGradeToContext(ctx, opts.grade || 'sunset');
  drawImageCover(ctx, opts.img, x, y, w, h, opts.focus);
  clearGradeFromContext(ctx);
  tintRect(ctx, x, y, w, h, opts.grade || 'sunset');
  panelShade(ctx, x, y, w, h);
  ctx.restore();
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x + slantPx, y);
  ctx.lineTo(x + w, y);
  ctx.lineTo(x + w - slantPx, y + h);
  ctx.lineTo(x, y + h);
  ctx.closePath();
  ctx.strokeStyle = '#f5c542';
  ctx.lineWidth = Math.max(2, w * 0.012);
  ctx.stroke();
  ctx.restore();
  if (opts.label) {
    const fs = Math.max(11, Math.min(w * 0.075, 26));
    ctx.save();
    ctx.font = `700 ${fs}px ${FONTS.label}`;
    const tw = ctx.measureText(opts.label).width;
    const padX = fs * 0.55;
    const bh = fs * 1.5;
    const bx = x + w * 0.06;
    const by = opts.labelTop ? y + h * 0.045 : y + h - bh - h * 0.05;
    ctx.fillStyle = 'rgba(8,4,16,0.92)';
    ctx.fillRect(bx, by, tw + padX * 2, bh);
    ctx.fillStyle = '#f5c542';
    ctx.textBaseline = 'middle';
    ctx.fillText(opts.label, bx + padX, by + bh / 2 + 1);
    ctx.restore();
  }
}

// ---- poster furniture ------------------------------------------------------

export function drawDoubleFrame(ctx, W, H) {
  const m = Math.round(W * 0.012);
  ctx.save();
  ctx.strokeStyle = '#e8b64c';
  ctx.lineWidth = Math.max(4, W * 0.005);
  ctx.strokeRect(m, m, W - m * 2, H - m * 2);
  ctx.strokeStyle = 'rgba(232,182,76,0.55)';
  ctx.lineWidth = Math.max(1, W * 0.0012);
  ctx.strokeRect(m + 10, m + 10, W - m * 2 - 20, H - m * 2 - 20);
  // corner ornaments
  const c = Math.round(W * 0.02);
  ctx.strokeStyle = '#f5c542';
  ctx.lineWidth = Math.max(3, W * 0.003);
  const corners = [
    [m, m, 1, 1], [W - m, m, -1, 1], [m, H - m, 1, -1], [W - m, H - m, -1, -1],
  ];
  for (const [cx, cy, sx, sy] of corners) {
    ctx.beginPath();
    ctx.moveTo(cx + sx * c, cy);
    ctx.lineTo(cx, cy);
    ctx.lineTo(cx, cy + sy * c);
    ctx.stroke();
  }
  ctx.restore();
}

export function drawQuoteBand(ctx, W, x, y, w, h, quote, gazette) {
  ctx.save();
  ctx.fillStyle = 'rgba(12,5,24,0.85)';
  ctx.fillRect(x, y, w, h);
  const starSize = h * 0.52;
  const starGap = starSize * 0.28;
  let sx = x + w * 0.02;
  const sy = y + h / 2;
  ctx.fillStyle = '#f5c542';
  for (let i = 0; i < 5; i++) {
    drawStar(ctx, sx + starSize / 2, sy, starSize / 2, starSize / 4.4, 5);
    ctx.fill();
    sx += starSize + starGap;
  }
  const qx = sx + w * 0.015;
  const qfs = h * 0.52;
  ctx.font = `700 ${qfs}px ${FONTS.label}`;
  ctx.fillStyle = '#fff3d6';
  ctx.textBaseline = 'middle';
  ctx.fillText(quote, qx, sy + 1);
  const qw = ctx.measureText(quote).width;
  ctx.font = `600 ${h * 0.42}px ${FONTS.label}`;
  ctx.fillStyle = '#d8b25e';
  ctx.fillText('— ' + gazette, qx + qw + w * 0.02, sy + 1);
  ctx.restore();
}

export function drawStar(ctx, cx, cy, rOuter, rInner, points) {
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? rOuter : rInner;
    const a = (Math.PI * i) / points - Math.PI / 2;
    const px = cx + Math.cos(a) * r;
    const py = cy + Math.sin(a) * r;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

export function drawVolBox(ctx, x, y, w, h, text) {
  ctx.save();
  ctx.fillStyle = '#f5c542';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = '#7a5a12';
  ctx.lineWidth = Math.max(1, h * 0.06);
  ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
  ctx.fillStyle = '#241505';
  ctx.font = `900 ${h * 0.52}px ${FONTS.display}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x + w / 2, y + h / 2 + 1);
  ctx.restore();
}

export function drawWantedPill(ctx, x, y, w, h) {
  ctx.save();
  roundRectPath(ctx, x, y, w, h, h / 2);
  ctx.fillStyle = '#1c0510';
  ctx.fill();
  ctx.strokeStyle = '#f5c542';
  ctx.lineWidth = Math.max(1.5, h * 0.08);
  ctx.stroke();
  ctx.fillStyle = '#f5c542';
  ctx.font = `900 ${h * 0.52}px ${FONTS.display}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('WANTED ★★★★★', x + w / 2, y + h / 2 + 1);
  ctx.restore();
}

// ---- title block -----------------------------------------------------------

// The big striped title: a vertical gradient with hard stops so the letters
// read as horizontal sunset bands, plus a dark extruded copy behind for
// depth and a pink glow. Returns the title's bounding box.
export function drawStripedTitle(ctx, text, cx, topY, maxW, fontPx, gradeId) {
  const font = `900 ${fontPx}px ${FONTS.title}`;
  ctx.save();
  ctx.font = font;
  let tw = ctx.measureText(text).width;
  let px = fontPx;
  if (tw > maxW) {
    px = Math.floor(fontPx * (maxW / tw));
    ctx.font = `900 ${px}px ${FONTS.title}`;
    tw = ctx.measureText(text).width;
  }
  const x = cx - tw / 2;
  const y = topY;
  const h = px * 1.02;

  // striped sunset gradient: hard stops make horizontal bands
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  const bands = ['#ffe9a3', '#ffb347', '#ff7a3d', '#ff4d6d', '#ff2e88', '#c9184a'];
  const n = bands.length;
  for (let i = 0; i < n; i++) {
    g.addColorStop(i / n, bands[i]);
    g.addColorStop((i + 1) / n - 0.001, bands[i]);
  }
  // extruded copy behind (dark, offset down-right)
  ctx.save();
  ctx.font = `900 ${px}px ${FONTS.title}`;
  ctx.fillStyle = '#3d0a2e';
  ctx.fillText(text, x + px * 0.045, y + h * 0.92 + px * 0.05);
  ctx.restore();
  // glow
  ctx.save();
  ctx.shadowColor = 'rgba(255,46,136,0.75)';
  ctx.shadowBlur = px * 0.22;
  ctx.font = `900 ${px}px ${FONTS.title}`;
  ctx.fillStyle = g;
  ctx.fillText(text, x, y + h * 0.92);
  ctx.restore();
  // crisp dark outline + thin gold inner line
  ctx.save();
  ctx.font = `900 ${px}px ${FONTS.title}`;
  ctx.lineJoin = 'round';
  ctx.strokeStyle = 'rgba(40,6,32,0.9)';
  ctx.lineWidth = Math.max(2, px * 0.035);
  ctx.strokeText(text, x, y + h * 0.92);
  ctx.restore();
  return { x, y, w: tw, h, px };
}

export function drawScriptLine(ctx, text, cx, topY, maxW, fontPx) {
  ctx.save();
  let px = fontPx;
  ctx.font = `${px}px ${FONTS.script}`;
  let tw = ctx.measureText(text).width;
  if (tw > maxW) {
    px = Math.floor(fontPx * (maxW / tw));
    ctx.font = `${px}px ${FONTS.script}`;
    tw = ctx.measureText(text).width;
  }
  const x = cx - tw / 2;
  ctx.translate(cx, topY + px * 0.5);
  ctx.rotate(-0.035);
  ctx.translate(-cx, -(topY + px * 0.5));
  ctx.shadowColor = 'rgba(255,120,200,0.9)';
  ctx.shadowBlur = px * 0.3;
  ctx.fillStyle = '#ff8fd0';
  ctx.font = `${px}px ${FONTS.script}`;
  ctx.fillText(text, x, topY + px * 0.85);
  ctx.restore();
  return { x, y: topY, w: tw, h: px };
}

export function drawTaglineBanner(ctx, cx, y, w, h, text) {
  ctx.save();
  const x = cx - w / 2;
  ctx.fillStyle = 'rgba(8,4,16,0.94)';
  roundRectPath(ctx, x, y, w, h, h * 0.18);
  ctx.fill();
  ctx.strokeStyle = '#f5c542';
  ctx.lineWidth = Math.max(1, h * 0.05);
  ctx.stroke();
  ctx.fillStyle = '#ffe9a3';
  const fs = h * 0.52;
  ctx.font = `700 ${fs}px ${FONTS.label}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, cx, y + h / 2 + 1);
  // pink end triangles
  ctx.fillStyle = '#ff2e88';
  const tri = h * 0.32;
  ctx.beginPath();
  ctx.moveTo(x + 8, y + h / 2 - tri / 2);
  ctx.lineTo(x + 8, y + h / 2 + tri / 2);
  ctx.lineTo(x + 8 + tri * 0.8, y + h / 2);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x + w - 8, y + h / 2 - tri / 2);
  ctx.lineTo(x + w - 8, y + h / 2 + tri / 2);
  ctx.lineTo(x + w - 8 - tri * 0.8, y + h / 2);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// ---- seal, billing, barcode -------------------------------------------------

export function drawStarburstSeal(ctx, cx, cy, r, lines, sub) {
  ctx.save();
  ctx.translate(cx, cy);
  starburstPath(ctx, 0, 0, r, r * 0.86, 18);
  ctx.fillStyle = '#f5c542';
  ctx.fill();
  ctx.strokeStyle = '#8a6a10';
  ctx.lineWidth = Math.max(1.5, r * 0.03);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.68, 0, Math.PI * 2);
  ctx.strokeStyle = '#8a6a10';
  ctx.lineWidth = Math.max(1, r * 0.02);
  ctx.stroke();
  ctx.fillStyle = '#241505';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const fs = r * 0.24;
  ctx.font = `900 ${fs}px ${FONTS.display}`;
  lines.forEach((line, i) => {
    ctx.fillText(line, 0, (i - (lines.length - 1) / 2) * fs * 1.25);
  });
  if (sub) {
    ctx.font = `700 ${r * 0.16}px ${FONTS.label}`;
    ctx.fillText(sub, 0, r * 0.48);
  }
  ctx.restore();
}

export function drawBilling(ctx, cx, y, w, lines) {
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const fs = Math.max(9, w * 0.011);
  ctx.font = `600 ${fs}px ${FONTS.label}`;
  lines.forEach((line, i) => {
    ctx.fillStyle = i === 0 ? '#ffe9a3' : '#e8dcc0';
    ctx.fillText(line, cx, y + i * fs * 1.55);
  });
  ctx.restore();
}

export function drawBarcode(ctx, x, y, w, h, code) {
  ctx.save();
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(x, y, w, h);
  let bx = x + w * 0.04;
  let seed = 1234567;
  const next = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
  ctx.fillStyle = '#111111';
  while (bx < x + w * 0.92) {
    const bw = 1 + next() * w * 0.02;
    if (next() > 0.35) ctx.fillRect(bx, y + h * 0.06, bw, h * 0.62);
    bx += bw + 1 + next() * w * 0.012;
  }
  ctx.fillStyle = '#111111';
  ctx.font = `${Math.max(8, h * 0.16)}px ${FONTS.label}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(code, x + w / 2, y + h * 0.86);
  ctx.restore();
}

export function drawComingSoon(ctx, x, y, fs) {
  ctx.save();
  ctx.fillStyle = '#f5c542';
  ctx.font = `900 ${fs}px ${FONTS.display}`;
  ctx.textBaseline = 'middle';
  let sx = x;
  const text = 'COMING SOON';
  for (const ch of text) {
    ctx.fillText(ch, sx, y);
    sx += ctx.measureText(ch).width + fs * 0.28;
  }
  ctx.restore();
  return sx;
}

// ---- layouts ---------------------------------------------------------------
// Each layout takes the panel area {x, y, w, h} and returns panel rects.
// A panel: { key, x, y, w, h, label, hero, slant }. Keys map to CAST ids in
// order; the hero panel always uses the hero image.

function gapFor(w) { return Math.max(4, Math.round(w * 0.008)); }

function gridPanels(area, cols, rows, keys, labels, heroKey) {
  const g = gapFor(area.w);
  const cw = (area.w - g * (cols - 1)) / cols;
  const ch = (area.h - g * (rows - 1)) / rows;
  const out = [];
  let i = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const key = keys[i];
      out.push({
        key,
        x: area.x + c * (cw + g),
        y: area.y + r * (ch + g),
        w: cw, h: ch,
        label: labels[i] || '',
        hero: key === heroKey,
      });
      i++;
    }
  }
  return out;
}

export const LAYOUTS = {
  'hero-mosaic': {
    label: 'Hero Mosaic', hint: 'Hero close-up, eight cast panels around it',
    panels(area) {
      const g = gapFor(area.w);
      const heroW = area.w * 0.34;
      const sideW = (area.w - heroW - g * 2) / 2;
      const heroX = area.x + sideW + g;
      const keys = ['driver', 'getaway', 'mechanic', 'boss', 'captain', 'brains', 'rider', 'lookout'];
      const labels = ['THE DRIVER', 'THE GETAWAY', 'THE MECHANIC', 'THE BOSS', 'THE CAPTAIN', 'THE BRAINS', 'THE RIDER', 'THE LOOKOUT'];
      const out = [{ key: 'hero', x: heroX, y: area.y, w: heroW, h: area.h, label: 'THE FIXER', hero: true }];
      // left 2x2
      const left = { x: area.x, y: area.y, w: sideW, h: area.h };
      const right = { x: heroX + heroW + g, y: area.y, w: sideW, h: area.h };
      out.push(...gridPanels(left, 2, 2, keys.slice(0, 4), labels.slice(0, 4)));
      out.push(...gridPanels(right, 2, 2, keys.slice(4, 8), labels.slice(4, 8)));
      return out;
    },
  },
  'hero-left': {
    label: 'Hero Left', hint: 'Hero on the left, four panels on the right',
    panels(area) {
      const g = gapFor(area.w);
      const heroW = area.w * 0.52;
      const out = [{ key: 'hero', x: area.x, y: area.y, w: heroW, h: area.h, label: 'THE FIXER', hero: true }];
      const right = { x: area.x + heroW + g, y: area.y, w: area.w - heroW - g, h: area.h };
      out.push(...gridPanels(right, 2, 2, ['driver', 'getaway', 'mechanic', 'boss'], ['THE DRIVER', 'THE GETAWAY', 'THE MECHANIC', 'THE BOSS']));
      return out;
    },
  },
  'hero-right': {
    label: 'Hero Right', hint: 'Hero on the right, four panels on the left',
    panels(area) {
      const g = gapFor(area.w);
      const heroW = area.w * 0.52;
      const out = [{ key: 'hero', x: area.x + area.w - heroW, y: area.y, w: heroW, h: area.h, label: 'THE FIXER', hero: true }];
      const left = { x: area.x, y: area.y, w: area.w - heroW - g, h: area.h };
      out.push(...gridPanels(left, 2, 2, ['driver', 'getaway', 'mechanic', 'boss'], ['THE DRIVER', 'THE GETAWAY', 'THE MECHANIC', 'THE BOSS']));
      return out;
    },
  },
  'nine-grid': {
    label: 'Nine Grid', hint: 'Three by three, hero in the middle',
    panels(area) {
      return gridPanels(area, 3, 3,
        ['driver', 'getaway', 'mechanic', 'boss', 'hero', 'captain', 'brains', 'rider', 'lookout'],
        ['THE DRIVER', 'THE GETAWAY', 'THE MECHANIC', 'THE BOSS', 'THE FIXER', 'THE CAPTAIN', 'THE BRAINS', 'THE RIDER', 'THE LOOKOUT'],
        'hero');
    },
  },
  'diagonal-trio': {
    label: 'Diagonal Trio', hint: 'One hero, two diagonal panels',
    panels(area) {
      const g = gapFor(area.w);
      const hw = area.w * 0.56, hh = area.h * 0.72;
      const hx = area.x + (area.w - hw) / 2, hy = area.y + (area.h - hh) / 2;
      const sw = area.w * 0.26, sh = area.h * 0.3;
      return [
        { key: 'driver', x: area.x, y: area.y, w: sw, h: sh, label: 'THE DRIVER' },
        { key: 'hero', x: hx, y: hy, w: hw, h: hh, label: 'THE FIXER', hero: true },
        { key: 'boss', x: area.x + area.w - sw, y: area.y + area.h - sh, w: sw, h: sh, label: 'THE BOSS' },
      ];
    },
  },
  'seven-mosaic': {
    label: 'Seven Mosaic', hint: 'Hero tall in the middle, three a side',
    panels(area) {
      const g = gapFor(area.w);
      const heroW = area.w * 0.36;
      const sideW = (area.w - heroW - g * 2) / 2;
      const heroX = area.x + sideW + g;
      const out = [{ key: 'hero', x: heroX, y: area.y, w: heroW, h: area.h, label: 'THE FIXER', hero: true }];
      const left = { x: area.x, y: area.y, w: sideW, h: area.h };
      const right = { x: heroX + heroW + g, y: area.y, w: sideW, h: area.h };
      out.push(...gridPanels(left, 1, 3, ['driver', 'mechanic', 'rider'], ['THE DRIVER', 'THE MECHANIC', 'THE RIDER']));
      out.push(...gridPanels(right, 1, 3, ['getaway', 'boss', 'lookout'], ['THE GETAWAY', 'THE BOSS', 'THE LOOKOUT']));
      return out;
    },
  },
  'pop-out': {
    label: 'Pop-Out', hint: 'Hero breaks its frame and overlaps the title',
    panels(area) {
      const g = gapFor(area.w);
      const heroW = area.w * 0.42;
      const heroX = area.x + (area.w - heroW) / 2;
      // The hero stays inside the panel area (no lift above the quote band)
      // and overlaps the title block below; three panels a side fill the
      // space so there is no empty void.
      const out = [{ key: 'hero', x: heroX, y: area.y, w: heroW, h: area.h, label: 'THE FIXER', hero: true, popout: true }];
      const sideW = (area.w - heroW) / 2 - g;
      const left = { x: area.x, y: area.y, w: sideW, h: area.h };
      const right = { x: heroX + heroW + g, y: area.y, w: sideW, h: area.h };
      out.push(...gridPanels(left, 1, 3, ['driver', 'mechanic', 'rider'], ['THE DRIVER', 'THE MECHANIC', 'THE RIDER']));
      out.push(...gridPanels(right, 1, 3, ['getaway', 'boss', 'lookout'], ['THE GETAWAY', 'THE BOSS', 'THE LOOKOUT']));
      return out;
    },
  },
  'slanted': {
    label: 'Slanted', hint: 'Zigzag panels with slanted edges',
    panels(area) {
      const g = gapFor(area.w);
      const keys = ['driver', 'getaway', 'mechanic', 'hero', 'boss', 'captain'];
      const labels = ['THE DRIVER', 'THE GETAWAY', 'THE MECHANIC', 'THE FIXER', 'THE BOSS', 'THE CAPTAIN'];
      const panels = gridPanels(area, 3, 2, keys, labels, 'hero');
      for (const p of panels) p.slant = Math.max(6, p.w * 0.09);
      return panels;
    },
  },
  'title-band': {
    label: 'Title Band', hint: 'Big title band on top, hero below',
    panels(area) {
      const g = gapFor(area.w);
      const heroH = area.h * 0.58;
      const out = [{ key: 'hero', x: area.x, y: area.y, w: area.w, h: heroH, label: 'THE FIXER', hero: true }];
      const bottom = { x: area.x, y: area.y + heroH + g, w: area.w, h: area.h - heroH - g };
      out.push(...gridPanels(bottom, 3, 1, ['driver', 'boss', 'lookout'], ['THE DRIVER', 'THE BOSS', 'THE LOOKOUT']));
      return out;
    },
  },
  'full-bleed': {
    label: 'Full Bleed', hint: 'One photo fills the poster, title on top',
    panels(area) {
      const g = gapFor(area.w);
      const sw = area.w * 0.24, sh = area.h * 0.3;
      return [
        { key: 'hero', x: area.x, y: area.y, w: area.w, h: area.h, label: '', hero: true, bleed: true },
        { key: 'driver', x: area.x + g, y: area.y + area.h - sh - g, w: sw, h: sh, label: 'THE DRIVER' },
        { key: 'boss', x: area.x + area.w - sw - g, y: area.y + area.h - sh - g, w: sw, h: sh, label: 'THE BOSS' },
      ];
    },
  },
};

export const LAYOUT_IDS = Object.keys(LAYOUTS);

// ---- the cover ----------------------------------------------------------------

// state: {
//   layout, grade, title, script, tagline, quote, gazette, vol, billing[2],
//   images: { panelKey: HTMLImageElement }, focus: { panelKey: {x,y} },
//   seal: [line1, line2], sealSub, wanted: bool, barcode: string,
//   seed: number (for grain)
// }
export function drawCover(ctx, W, H, state) {
  const layoutId = LAYOUTS[state.layout] ? state.layout : 'hero-mosaic';
  const gradeId = GRADES[state.grade] ? state.grade : 'sunset';
  const m = Math.max(6, Math.round(W * 0.012));

  // deep violet-purple poster ground
  ctx.save();
  ctx.fillStyle = '#160a24';
  ctx.fillRect(0, 0, W, H);
  const ground = ctx.createLinearGradient(0, 0, 0, H);
  ground.addColorStop(0, '#2a1040');
  ground.addColorStop(0.5, '#160a24');
  ground.addColorStop(1, '#0d0518');
  ctx.fillStyle = ground;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();

  const innerX = m + 10, innerY = m + 10;
  const innerW = W - (m + 10) * 2, innerH = H - (m + 10) * 2;

  // top quote band
  const bandH = Math.round(H * 0.045);
  drawQuoteBand(ctx, W, innerX, innerY, innerW, bandH,
    state.quote || '"THE HOTTEST RIDE OF THE YEAR"', state.gazette || 'GOLDEN MILE GAZETTE');
  // VOL box at the top right, over the band
  const volW = Math.round(W * 0.075), volH = bandH;
  drawVolBox(ctx, innerX + innerW - volW, innerY, volW, volH, state.vol || 'VOL. 1');

  // bottom billing band
  const billH = Math.round(H * 0.085);
  const billY = innerY + innerH - billH;
  drawComingSoon(ctx, innerX, billY + billH * 0.32, Math.round(H * 0.028));
  const bcW = Math.round(W * 0.085), bcH = Math.round(billH * 0.72);
  drawBarcode(ctx, innerX + innerW - bcW, billY + billH * 0.12, bcW, bcH, state.barcode || '0 18472 85991 8');
  drawBilling(ctx, W / 2, billY + billH * 0.3, innerW * 0.62, state.billing || [
    'A VICE ROYALE PICTURE  ·  STARRING YOU AND YOUR CREW',
    'SHOT ON YOUR OWN CAMERA  ·  GRADED BY HAND  ·  NO PHOTO EVER LEAVES YOUR DEVICE',
  ]);

  // panel area between the bands
  const panelArea = {
    x: innerX,
    y: innerY + bandH + Math.round(H * 0.012),
    w: innerW,
    h: billY - (innerY + bandH + Math.round(H * 0.012)) - Math.round(H * 0.012),
  };

  const panels = LAYOUTS[layoutId].panels(panelArea);
  const isBleed = layoutId === 'full-bleed';

  // draw panels (bleed hero first, as the background)
  const ordered = isBleed
    ? [...panels].sort((a, b) => (a.bleed ? -1 : 1) - (b.bleed ? -1 : 1))
    : panels;
  for (const p of ordered) {
    const img = state.images ? state.images[p.key] : null;
    if (!img) continue;
    if (p.slant) {
      drawSlantedPanel(ctx, p, { img, label: p.label, grade: gradeId, focus: state.focus ? state.focus[p.key] : null, labelTop: !!p.hero }, p.slant);
    } else {
      drawPanel(ctx, p, { img, label: p.label, grade: gradeId, focus: state.focus ? state.focus[p.key] : null, labelTop: !!p.hero });
    }
  }

  // title block: anchored from the BOTTOM of the panel area so the tagline
  // banner always clears the bottom-row role labels, and sized so the
  // whole block fits between the hero's chin and those labels.
  const labelReserve = Math.round(H * 0.05);
  const bannerH = Math.round(H * 0.032);
  const bannerBottom = panelArea.y + panelArea.h - labelReserve;
  const bannerY = bannerBottom - bannerH;
  const scriptPx = Math.round(W * 0.032);
  const scriptY = bannerY - scriptPx - Math.round(H * 0.012);
  const titlePx = Math.round(Math.min(W * 0.08, panelArea.h * 0.22));
  const titleH = titlePx * 1.02;
  const titleY = scriptY - titleH - Math.round(H * 0.008);
  const titleBox = drawStripedTitle(ctx, state.title || 'VICE ROYALE', W / 2,
    titleY, innerW * 0.94, titlePx, gradeId);
  drawScriptLine(ctx, state.script || 'chasing the last light', W / 2,
    scriptY, innerW * 0.8, scriptPx);
  const bannerW = Math.min(innerW * 0.72, ctx.measureText(state.tagline || '').width + 200);
  drawTaglineBanner(ctx, W / 2, bannerY, bannerW, bannerH,
    state.tagline || 'EIGHT FRIENDS  ·  ONE COAST  ·  NO WAY BACK');

  // WANTED pill top-left over the panels
  if (state.wanted !== false) {
    const pw = Math.round(W * 0.16), ph = Math.round(H * 0.032);
    drawWantedPill(ctx, innerX + W * 0.015, panelArea.y + H * 0.012, pw, ph);
  }

  // gold starburst seal, tucked inside the right frame edge, clear of the
  // role labels
  const sealR = Math.round(W * 0.042);
  drawStarburstSeal(ctx, innerX + innerW - sealR * 0.7, panelArea.y + panelArea.h * 0.5,
    sealR, state.seal || ['ORIGINAL', 'COVER ART'], state.sealSub || '★★★');

  // vignette + grain for a film-poster finish
  const vig = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.42, W / 2, H / 2, Math.max(W, H) * 0.75);
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, 'rgba(8,2,16,0.42)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, W, H);
  grain(ctx, W, H, state.seed || 7);

  drawDoubleFrame(ctx, W, H);
  return { panels, titleBox };
}

function grain(ctx, W, H, seed) {
  let s = seed * 9301 + 49297;
  const next = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
  ctx.save();
  ctx.globalAlpha = 0.05;
  ctx.fillStyle = '#ffffff';
  const n = Math.round((W * H) / 9000);
  for (let i = 0; i < n; i++) {
    const x = next() * W, y = next() * H;
    ctx.fillRect(x, y, 1.4, 1.4);
  }
  ctx.restore();
}

// Render a cover to an offscreen canvas at exactly W x H and return it.
export function renderCoverCanvas(W, H, state) {
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  drawCover(ctx, W, H, state);
  return canvas;
}

export function canvasToBlob(canvas) {
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
}
