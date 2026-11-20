// cover.js — renders a GTA-style multi-panel cover onto a canvas.
// The cover is a hero-centric poster: one big hero face, a cast of smaller
// panels around it, a striped 3D title, a pink script line, a top quote band
// and a bottom billing band. Everything is drawn in fractions of the cover
// size so the same code renders 1920x1080, 1080x1080 and 1080x1350.

export const LAYOUTS = [
  { id: 'hero-mosaic', name: 'Hero Mosaic', desc: 'Big hero left, four cast panels right' },
  { id: 'hero-three', name: 'Hero + Three', desc: 'Big hero on top, three cast panels below' },
  { id: 'diagonal-trio', name: 'Diagonal Trio', desc: 'Hero with two panels on a diagonal' },
  { id: 'seven-mosaic', name: 'Seven Mosaic', desc: 'Hero left, six cast panels right' },
  { id: 'nine-grid', name: 'Nine Grid', desc: 'Nine equal panels, 3 by 3' },
  { id: 'title-band', name: 'Title Band', desc: 'Panels on top, title in a clean band' },
];

export const GRADES = [
  { id: 'sunset', name: 'Sunset', filter: 'saturate(1.35) contrast(1.08) sepia(0.15)', tint: 'rgba(255,110,40,0.10)', tintMode: 'screen' },
  { id: 'neon', name: 'Neon Night', filter: 'saturate(1.55) contrast(1.12) hue-rotate(-18deg)', tint: 'rgba(180,40,255,0.10)', tintMode: 'screen' },
  { id: 'golden', name: 'Golden Hour', filter: 'saturate(1.30) contrast(1.05) sepia(0.32)', tint: 'rgba(255,190,60,0.14)', tintMode: 'screen' },
  { id: 'ink', name: 'Poster Ink', filter: 'saturate(0.35) contrast(1.55) brightness(1.02)', tint: 'rgba(255,45,136,0.10)', tintMode: 'screen' },
  { id: 'teal', name: 'Tropic Teal', filter: 'saturate(1.30) contrast(1.08) hue-rotate(24deg)', tint: 'rgba(0,190,180,0.10)', tintMode: 'screen' },
  { id: 'heatwave', name: 'Heatwave', filter: 'saturate(1.50) contrast(1.10) sepia(0.25)', tint: 'rgba(255,60,20,0.12)', tintMode: 'screen' },
];

export const STRIPES = {
  sunset: ['#FFD23F', '#FF9E2C', '#FF5E3A', '#FF2E88', '#C724B1'],
  neon: ['#00F0FF', '#7B5CFF', '#FF2E88', '#FF5E3A', '#FFD23F'],
  golden: ['#FFF3B0', '#FFD23F', '#FF9E2C', '#C97B2D', '#8A5A2B'],
  ink: ['#FFFFFF', '#E8E8E8', '#B8B8B8', '#5A5A5A', '#1A1A1A'],
  teal: ['#A8FFF0', '#2DE1C2', '#0EA5A5', '#2563EB', '#7B5CFF'],
  heatwave: ['#FFE45E', '#FFB03A', '#FF5E3A', '#E11D48', '#7F1D1D'],
};

export const DEFAULT_CAST = [
  { scene: 'fixer', role: 'THE FIXER', sub: '6:12 PM — THE MAN WITH THE PLAN' },
  { scene: 'getaway', role: 'THE GETAWAY', sub: '11:40 PM — NEVER CAUGHT, NEVER LATE' },
  { scene: 'crew', role: 'THE CREW', sub: '5:05 PM — LOYAL TO THE LAST SUNSET' },
  { scene: 'angler', role: 'THE ANGLER', sub: '5:48 AM — PATIENCE IS A WEAPON' },
  { scene: 'tourist', role: 'THE TOURIST', sub: '12:20 PM — SHE SAW EVERYTHING' },
  { scene: 'lookout', role: 'THE LOOKOUT', sub: '8:15 PM — EYES ON THE HARBOR' },
  { scene: 'mechanic', role: 'THE MECHANIC', sub: '9:30 PM — SHE BUILDS THE ESCAPE' },
  { scene: 'insider', role: 'THE INSIDER', sub: '10:05 PM — HE KNOWS THE SAFE CODE' },
  { scene: 'courier', role: 'THE COURIER', sub: '7:02 PM — THE PACKAGE ALWAYS ARRIVES' },
];

export const PLACE_SCENES = [
  { scene: 'coast', role: 'THE COAST', sub: '4:44 PM — WHERE IT ALL BEGAN' },
  { scene: 'neonstreet', role: 'NEON ROW', sub: '1:12 AM — THE CITY NEVER SLEEPS' },
];

export function defaultState() {
  return {
    layout: 'hero-mosaic',
    grade: 'sunset',
    title: 'VICE ROYALE',
    script: 'chasing the last light',
    quote: 'SUNSET, SMOKE AND STOLEN GOLD',
    quoteSource: 'THE COAST LEDGER',
    tagline: 'EVERY SUNSET HAS A PRICE',
    billing: 'A VICE ROYALE PICTURE · STARRING YOU',
    billing2: 'MADE FROM YOUR OWN PHOTOS · GRADED BY HAND',
    furniture: true,
    look: { paint: 50, grade: 50, halftone: 0, grain: 30, glow: 40 },
    panels: DEFAULT_CAST.slice(0, 9).map((c) => ({
      ...c, fx: 0.5, fy: 0.32, zoom: 1.0, face: true, src: null,
    })),
  };
}

// Panel rectangles as fractions of the panel area, plus which index is the hero.
// The panel area is the cover minus the top quote band and the bottom band.
export function panelRects(layout, count) {
  const r = (x, y, w, h) => ({ x, y, w, h });
  switch (layout) {
    case 'hero-mosaic':
      return { rects: [r(0, 0, 0.55, 1), r(0.55, 0, 0.225, 0.5), r(0.775, 0, 0.225, 0.5), r(0.55, 0.5, 0.225, 0.5), r(0.775, 0.5, 0.225, 0.5)], hero: 0 };
    case 'hero-three':
      return { rects: [r(0, 0, 1, 0.62), r(0, 0.62, 0.333, 0.38), r(0.333, 0.62, 0.334, 0.38), r(0.667, 0.62, 0.333, 0.38)], hero: 0 };
    case 'diagonal-trio':
      return { rects: [r(0, 0, 0.62, 1), r(0.62, 0, 0.38, 0.55), r(0.62, 0.55, 0.38, 0.45)], hero: 0 };
    case 'seven-mosaic': {
      const rects = [r(0, 0, 0.5, 1)];
      for (let i = 0; i < 6; i++) rects.push(r(0.5 + (i % 2) * 0.25, Math.floor(i / 2) * 0.333, 0.25, 0.334));
      return { rects, hero: 0 };
    }
    case 'nine-grid': {
      const rects = [];
      for (let i = 0; i < 9; i++) rects.push(r((i % 3) / 3, Math.floor(i / 3) / 3, 1 / 3, 1 / 3));
      return { rects, hero: 0 };
    }
    case 'title-band': {
      const rects = [];
      for (let i = 0; i < Math.min(count, 6); i++) rects.push(r((i % 3) / 3, Math.floor(i / 3) * 0.5, 1 / 3, 0.5));
      return { rects, hero: 0, band: true };
    }
    default:
      return { rects: [r(0, 0, 1, 1)], hero: 0 };
  }
}

function coverFit(img, rw, rh, fx, fy, zoom) {
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  const s = Math.max(rw / iw, rh / ih) * zoom;
  const dw = iw * s, dh = ih * s;
  const dx = (rw - dw) * fx, dy = (rh - dh) * fy;
  return { dx, dy, dw, dh };
}

function gradeOf(id) {
  return GRADES.find((g) => g.id === id) || GRADES[0];
}

function drawPanelImage(ctx, img, rect, panel, grade, look) {
  const { x, y, w, h } = rect;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  // Grade filter: paint slider pushes saturation, grade slider pushes the tint.
  const g = gradeOf(grade);
  const paint = (look.paint - 50) / 50;
  const sat = Math.max(0.4, 1 + paint * 0.5);
  ctx.filter = g.filter.replace(/saturate\([\d.]+\)/, `saturate(${Math.min(2.2, parseFloat(g.filter.match(/saturate\(([\d.]+)\)/)[1]) * sat).toFixed(2)})`);
  const fy = panel.face ? Math.min(panel.fy, 0.32) : panel.fy;
  const fit = coverFit(img, w, h, panel.fx, fy, panel.zoom);
  ctx.drawImage(img, x + fit.dx, y + fit.dy, fit.dw, fit.dh);
  ctx.filter = 'none';
  // Grade tint.
  ctx.globalCompositeOperation = g.tintMode;
  ctx.globalAlpha = 0.4 + (look.grade / 100) * 0.8;
  ctx.fillStyle = g.tint;
  ctx.fillRect(x, y, w, h);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
  // Poster Ink: a light duotone wash + halftone dots (kept light so the
  // faces stay readable — a heavy multiply turns the panels black).
  if (grade === 'ink') {
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = 'rgba(120,20,90,0.14)';
    ctx.fillRect(x, y, w, h);
    ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = 'rgba(255,120,180,0.10)';
    ctx.fillRect(x, y, w, h);
    ctx.globalCompositeOperation = 'source-over';
    const dot = Math.max(5, w / 90);
    ctx.fillStyle = 'rgba(20,0,40,0.16)';
    for (let yy = y + dot; yy < y + h; yy += dot * 2) {
      for (let xx = x + dot; xx < x + w; xx += dot * 2) ctx.fillRect(xx, yy, dot * 0.55, dot * 0.55);
    }
  }
  if (look.halftone > 0) {
    const dot = Math.max(4, w / 110);
    ctx.fillStyle = `rgba(0,0,0,${(look.halftone / 100) * 0.22})`;
    for (let yy = y + dot; yy < y + h; yy += dot * 2) {
      for (let xx = x + dot; xx < x + w; xx += dot * 2) ctx.fillRect(xx, yy, dot * 0.5, dot * 0.5);
    }
  }
  // Glow: a soft warm wash at the panel's top.
  if (look.glow > 0) {
    const grad = ctx.createLinearGradient(x, y, x, y + h * 0.5);
    grad.addColorStop(0, `rgba(255,180,90,${(look.glow / 100) * 0.16})`);
    grad.addColorStop(1, 'rgba(255,180,90,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(x, y, w, h * 0.5);
  }
  // Grain.
  if (look.grain > 0) {
    const n = Math.floor((w * h) / 9000) * (look.grain / 30);
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    for (let i = 0; i < n; i++) ctx.fillRect(x + Math.random() * w, y + Math.random() * h, 1.4, 1.4);
    ctx.fillStyle = 'rgba(0,0,0,0.05)';
    for (let i = 0; i < n; i++) ctx.fillRect(x + Math.random() * w, y + Math.random() * h, 1.4, 1.4);
  }
  ctx.restore();
}

function fitFont(ctx, text, font, maxW, start) {
  let size = start;
  ctx.font = font(size);
  while (size > 12 && ctx.measureText(text).width > maxW) {
    size -= 2;
    ctx.font = font(size);
  }
  return size;
}

function drawStripedTitle(ctx, text, cx, top, maxW, grade, H) {
  // Measure on the offscreen context itself, so the size that fits the
  // offscreen canvas is the size that is drawn (measuring on the main
  // context with a different font loaded would overflow the canvas).
  const stripes = STRIPES[grade] || STRIPES.sunset;
  let size = Math.round(H * 0.17);
  const off = document.createElement('canvas');
  const o = off.getContext('2d');
  const setFont = (s) => { o.font = `900 ${s}px "Passion One", sans-serif`; };
  setFont(size);
  while (size > 24 && o.measureText(text).width > maxW) {
    size -= 4;
    setFont(size);
  }
  off.width = Math.ceil(Math.min(maxW, o.measureText(text).width + size * 0.3));
  off.height = Math.ceil(size * 1.3);
  setFont(size);
  o.textAlign = 'center';
  o.textBaseline = 'alphabetic';
  const tx = off.width / 2, ty = size * 1.02;
  // 3D extrusion: layered copies stepping down-right in deep purple.
  o.fillStyle = '#2A0A4A';
  for (let i = 6; i >= 1; i--) o.fillText(text, tx + i * size * 0.028, ty + i * size * 0.028);
  // Main fill in white, then thin retro stripes clipped to it.
  o.fillStyle = '#FFFFFF';
  o.fillText(text, tx, ty);
  o.globalCompositeOperation = 'source-atop';
  const bands = stripes.length * 2;
  const band = off.height / bands;
  for (let i = 0; i < bands; i++) {
    o.fillStyle = stripes[i % stripes.length];
    o.fillRect(0, i * band, off.width, band + 1);
  }
  o.globalCompositeOperation = 'source-over';
  // Thick black outline.
  o.lineWidth = Math.max(3, size * 0.045);
  o.strokeStyle = '#14081F';
  o.lineJoin = 'round';
  o.strokeText(text, tx, ty);
  ctx.drawImage(off, cx - off.width / 2, top);
  return { size, height: off.height, width: off.width };
}

function drawRoleLabel(ctx, panel, rect, titleTop, titleBottom, H) {
  const pad = Math.max(8, H * 0.012);
  const labelH = H * 0.075;
  const lx = rect.x + pad, ly = rect.y + rect.h - labelH - pad;
  // Skip a label that would sit inside the title band — the title draws
  // over the panels, so a label there would collide with it (or be covered).
  if (ly < titleBottom && ly + labelH > titleTop) return;
  // Set the role font BEFORE measuring, so the box fits the text.
  const roleSize = fitFont(ctx, panel.role, (s) => `800 ${s}px "Barlow Condensed", sans-serif`, rect.w - pad * 2, Math.round(H * 0.032));
  ctx.font = `800 ${roleSize}px "Barlow Condensed", sans-serif`;
  const roleW = ctx.measureText(panel.role).width;
  const subSize = Math.max(10, Math.round(H * 0.016));
  ctx.font = `600 ${subSize}px "Barlow Condensed", sans-serif`;
  const subW = ctx.measureText(panel.sub || '').width;
  const boxW = Math.min(Math.max(roleW, subW) + pad * 1.6, rect.w - pad);
  ctx.save();
  ctx.fillStyle = 'rgba(10,4,18,0.88)';
  ctx.fillRect(lx - pad * 0.5, ly - pad * 0.4, boxW, labelH);
  ctx.fillStyle = '#FFFFFF';
  ctx.font = `800 ${roleSize}px "Barlow Condensed", sans-serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(panel.role, lx, ly + roleSize * 0.95, boxW - pad);
  ctx.fillStyle = '#FFC9A3';
  ctx.font = `600 ${subSize}px "Barlow Condensed", sans-serif`;
  ctx.fillText(panel.sub || '', lx, ly + roleSize + subSize * 1.15, boxW - pad);
  ctx.restore();
}

function drawPalmBand(ctx, x, y, w, h) {
  // Sunset gradient + bold palm silhouettes. The palm is drawn in absolute
  // pixels from its size S (no extra scale on top of it — scaling a palm
  // drawn at band height by the band height again made giant dark bars).
  const grad = ctx.createLinearGradient(x, y, x, y + h);
  grad.addColorStop(0, '#FF9E2C');
  grad.addColorStop(0.5, '#FF5E3A');
  grad.addColorStop(1, '#C724B1');
  ctx.fillStyle = grad;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = 'rgba(20,4,30,0.80)';
  const palm = (px, py, S, flip) => {
    ctx.save();
    ctx.translate(px, py);
    if (flip) ctx.scale(-1, 1);
    // Trunk: a thick curve leaning slightly, height S.
    ctx.beginPath();
    ctx.moveTo(-S * 0.03, 0);
    ctx.quadraticCurveTo(S * 0.02, -S * 0.45, S * 0.10, -S * 0.80);
    ctx.lineTo(S * 0.16, -S * 0.78);
    ctx.quadraticCurveTo(S * 0.08, -S * 0.42, S * 0.05, 0);
    ctx.closePath();
    ctx.fill();
    // Fronds: wide arcs fanning from the crown, drooping at the tips.
    const cx = S * 0.13, cy = -S * 0.80;
    for (let i = 0; i < 7; i++) {
      const a = (-0.15 - i * 0.28) * Math.PI;
      const len = S * (0.55 + (i % 3) * 0.08);
      const ex = cx + Math.cos(a) * len;
      const ey = cy + Math.sin(a) * len * 0.7 + S * 0.18;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.quadraticCurveTo(cx + Math.cos(a) * len * 0.55, cy + Math.sin(a) * len * 0.45 - S * 0.06, ex, ey);
      ctx.quadraticCurveTo(cx + Math.cos(a) * len * 0.5, cy + Math.sin(a) * len * 0.5 + S * 0.10, cx, cy);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  };
  palm(x + w * 0.05, y + h, h * 0.95, false);
  palm(x + w * 0.95, y + h, h * 0.85, true);
  palm(x + w * 0.5, y + h, h * 0.6, false);
}

function drawBarcode(ctx, x, y, w, h) {
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(x - 4, y - 4, w + 8, h + 8);
  ctx.fillStyle = '#111111';
  let bx = x;
  let seed = 7;
  while (bx < x + w - 3) {
    seed = (seed * 16807) % 2147483647;
    const bw = 1 + (seed % 4);
    if (seed % 3 !== 0) ctx.fillRect(bx, y, bw, h);
    bx += bw + 1 + (seed % 2);
  }
}

function drawSeal(ctx, cx, cy, r, label) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(-0.12);
  ctx.fillStyle = '#FFD23F';
  ctx.strokeStyle = '#8A5A2B';
  ctx.lineWidth = Math.max(2, r * 0.08);
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.78, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = '#5A2A00';
  ctx.font = `800 ${Math.round(r * 0.34)}px "Barlow Condensed", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const words = label.split(' ');
  ctx.fillText(words[0] || '', 0, -r * 0.22);
  ctx.fillText(words.slice(1).join(' ') || '', 0, r * 0.22);
  ctx.restore();
}

function drawPill(ctx, text, x, y, h, bg, fg) {
  ctx.font = `800 ${Math.round(h * 0.52)}px "Barlow Condensed", sans-serif`;
  const w = ctx.measureText(text).width + h * 1.1;
  ctx.fillStyle = bg;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, h / 2);
  ctx.fill();
  ctx.fillStyle = fg;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x + w / 2, y + h / 2 + 1);
  return w;
}

// ---- the cover itself ----

export function renderCover(ctx, W, H, state, images, opts = {}) {
  const showSelection = !!opts.showSelection;
  const selected = opts.selected ?? -1;
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#1A0B2E';
  ctx.fillRect(0, 0, W, H);

  const quoteH = Math.round(H * 0.055);
  const bottomH = Math.round(H * 0.085);
  const panelTop = quoteH;
  const panelH = H - quoteH - bottomH;
  const panelArea = { x: 0, y: panelTop, w: W, h: panelH };

  const layout = panelRects(state.layout, state.panels.length);
  const rects = layout.rects.map((r) => ({
    x: panelArea.x + r.x * panelArea.w,
    y: panelArea.y + r.y * panelArea.h,
    w: r.w * panelArea.w,
    h: r.h * panelArea.h,
  }));

  // Panels.
  rects.forEach((rect, i) => {
    const panel = state.panels[i % state.panels.length];
    const img = images[panel.scene];
    if (!img) return;
    drawPanelImage(ctx, img, rect, panel, state.grade, state.look);
    // Thin dark gutters between panels.
    ctx.strokeStyle = 'rgba(10,4,18,0.9)';
    ctx.lineWidth = Math.max(2, H * 0.004);
    ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
  });

  // Title placement: over the panels, lower third of the panel area — but
  // for 3-row layouts the title sits higher (0.36) so it clears the middle
  // row's role labels instead of covering them.
  const titleMaxW = W * 0.92;
  const threeRow = state.layout === 'seven-mosaic' || state.layout === 'nine-grid';
  const titleTop = panelTop + panelH * (layout.band ? 0.02 : threeRow ? 0.36 : 0.52);
  const title = drawStripedTitle(ctx, state.title, W / 2, titleTop, titleMaxW, state.grade, H);
  const titleBottom = titleTop + title.height;

  // Script on a dark scrim, overlapping the title's bottom.
  const scriptSize = Math.round(H * 0.058);
  ctx.font = `${scriptSize}px "Yellowtail", cursive`;
  const scriptW = ctx.measureText(state.script).width;
  const scrimY = titleBottom - scriptSize * 0.35;
  ctx.fillStyle = 'rgba(10,4,18,0.55)';
  ctx.fillRect(W / 2 - scriptW / 2 - H * 0.02, scrimY, scriptW + H * 0.04, scriptSize * 1.35);
  ctx.fillStyle = '#FF2E88';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(state.script, W / 2, scrimY + scriptSize * 1.02);

  // Role labels (skipped where they would collide with the title band).
  if (state.furniture !== false) {
    rects.forEach((rect, i) => {
      const panel = state.panels[i % state.panels.length];
      drawRoleLabel(ctx, panel, rect, titleTop, titleBottom, H);
    });
  }

  // Top quote band.
  ctx.fillStyle = '#12081F';
  ctx.fillRect(0, 0, W, quoteH);
  const qSize = Math.round(quoteH * 0.42);
  const stars = '★★★★★';
  ctx.font = `800 ${qSize}px "Barlow Condensed", sans-serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#FFD23F';
  const starW = ctx.measureText(stars).width;
  ctx.fillText(stars, W * 0.02, quoteH / 2 + 1);
  // Quote shrunk to fit the space left of the VOL. pill.
  const volW = state.furniture !== false ? Math.round(W * 0.075) : 0;
  const quoteText = `"${state.quote}" — ${state.quoteSource}`;
  let qs = qSize;
  ctx.font = `800 ${qs}px "Barlow Condensed", sans-serif`;
  const quoteMax = W - W * 0.02 - starW - W * 0.015 - volW - W * 0.03;
  while (qs > 10 && ctx.measureText(quoteText).width > quoteMax) {
    qs -= 1;
    ctx.font = `800 ${qs}px "Barlow Condensed", sans-serif`;
  }
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText(quoteText, W * 0.02 + starW + W * 0.015, quoteH / 2 + 1, quoteMax);
  // VOL. pill top-right, right-aligned inside the band.
  if (state.furniture !== false) {
    const pillH = quoteH * 0.64;
    ctx.font = `800 ${Math.round(pillH * 0.52)}px "Barlow Condensed", sans-serif`;
    const pillW = ctx.measureText('VOL. 06').width + pillH * 1.1;
    drawPill(ctx, 'VOL. 06', W - pillW - W * 0.015, quoteH * 0.18, pillH, '#FFD23F', '#5A2A00');
  }

  // Bottom band: palms + COMING SOON + billing + barcode + seal.
  const by = H - bottomH;
  drawPalmBand(ctx, 0, by, W, bottomH);
  // Darken the band a touch so the billing reads.
  ctx.fillStyle = 'rgba(10,4,18,0.25)';
  ctx.fillRect(0, by, W, bottomH);
  const csSize = Math.round(bottomH * 0.34);
  ctx.font = `${csSize}px "Anton", sans-serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText('COMING SOON', W * 0.02, by + bottomH * 0.32);
  ctx.font = `700 ${Math.round(bottomH * 0.20)}px "Barlow Condensed", sans-serif`;
  ctx.fillStyle = '#FFE9C9';
  ctx.textAlign = 'center';
  ctx.fillText(state.billing, W / 2, by + bottomH * 0.38);
  ctx.fillText(state.billing2, W / 2, by + bottomH * 0.68);
  ctx.font = `800 ${Math.round(bottomH * 0.22)}px "Barlow Condensed", sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillStyle = '#FFD23F';
  ctx.fillText(state.tagline, W / 2, by + bottomH * 0.16);
  drawBarcode(ctx, W * 0.90, by + bottomH * 0.22, W * 0.07, bottomH * 0.5);
  if (state.furniture !== false) {
    drawSeal(ctx, W * 0.815, by + bottomH * 0.5, bottomH * 0.42, 'ORIGINAL COVER ART');
  }

  // Furniture: seal, ribbon, HEAT pill.
  if (state.furniture !== false) {
    // Gold EST. 2026 seal, top-right of the panel area, kept inside the canvas.
    const sealR = Math.min(W, H) * 0.036;
    drawSeal(ctx, W - sealR - W * 0.015, panelTop + panelH * 0.10, sealR, 'EST. 2026');
    // COLLECTOR'S EDITION ribbon, top-left diagonal.
    ctx.save();
    ctx.translate(W * 0.02, panelTop + panelH * 0.06);
    ctx.rotate(-0.06);
    ctx.fillStyle = '#C724B1';
    ctx.fillRect(0, 0, W * 0.16, H * 0.028);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `800 ${Math.round(H * 0.016)}px "Barlow Condensed", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText("COLLECTOR'S EDITION", W * 0.08, H * 0.014);
    ctx.restore();
    // HEAT pill, top-left below the ribbon — the bottom corners hold the
    // role labels, so the pill lives at the top where nothing else sits.
    drawPill(ctx, 'HEAT ★★★★★', W * 0.02, panelTop + panelH * 0.10, H * 0.032, '#FF2E88', '#FFFFFF');
  }

  // Editor selection outline: ONLY in the interactive editor, never in an
  // export or a screenshot. The caller passes showSelection only for the
  // live preview canvas.
  if (showSelection && selected >= 0 && rects[selected]) {
    const r = rects[selected];
    ctx.save();
    ctx.strokeStyle = '#FF2E88';
    ctx.lineWidth = Math.max(3, H * 0.006);
    ctx.setLineDash([12, 8]);
    ctx.strokeRect(r.x + 2, r.y + 2, r.w - 4, r.h - 4);
    ctx.restore();
  }
  return { rects, hero: layout.hero, titleTop, titleBottom, panelArea };
}

// Load the scene images (and any uploaded photos) into Image objects.
export function loadImages(sources) {
  const out = {};
  const jobs = Object.entries(sources).map(([key, src]) => new Promise((resolve) => {
    const img = new Image();
    img.onload = () => { out[key] = img; resolve(); };
    img.onerror = () => resolve();
    img.src = src;
  }));
  return Promise.all(jobs).then(() => out);
}

export function scenePath(scene) {
  return `./scenes/${scene}.jpg`;
}
