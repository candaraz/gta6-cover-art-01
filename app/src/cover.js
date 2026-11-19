// Vice Cover Studio renderer: draws the multi-panel Vice-style poster cover onto a
// canvas at any export size. Original art only: no Rockstar logo, artwork or font.
// Title: Passion One Black (OFL), drawn with a layered 3D extrusion. Script: Yellowtail
// (OFL). Labels: Barlow Condensed (OFL).
//
// v2: nine original scene photos (no repeats in the dense grids), seven layouts
// (Nine Grid + Title Band are new), a bigger 3D title that grows to fill the cover
// width, a much larger script in its own clear band, two-line panel captions, and a
// taller palm band. Panel captions are never drawn where the title would cover them:
// renderCover measures the title first and skips any caption tab whose panel starts
// at or below the title's top, so no caption fragment can peek out from behind the
// title.

/** The nine bundled scene photos. The two samples are the kit's model-made photos. */
export const SCENES = [
  { id: 'boulevard', file: 'samples/boulevard.jpg', name: 'Boulevard', caption: 'OCEAN DRIVE · 6:47 PM — LAST LIGHT' },
  { id: 'pier', file: 'samples/pier.jpg', name: 'Pier', caption: 'OLD PIER · 5:40 PM — ONE MORE CAST' },
  { id: 'sportscar', file: 'scenes/sportscar.jpg', name: 'Sports Car', caption: 'PALM ROW · 7:02 PM — REDLINE' },
  { id: 'neonstreet', file: 'scenes/neonstreet.jpg', name: 'Neon Street', caption: 'NEON ROW · 11:58 PM — NO LAST CALL' },
  { id: 'speedboat', file: 'scenes/speedboat.jpg', name: 'Speedboat', caption: 'BISCAYNE BAY · 6:15 PM — FULL THROTTLE' },
  { id: 'skyline', file: 'scenes/skyline.jpg', name: 'Skyline', caption: 'THE BAY · 7:31 PM — LIGHTS ON' },
  { id: 'heli', file: 'scenes/heli.jpg', name: 'Helicopter', caption: 'THE STRIP · 6:03 PM — EYES IN THE SKY' },
  { id: 'motorbike', file: 'scenes/motorbike.jpg', name: 'Motorbike', caption: 'SOUTH BEACH · 12:41 AM — NO BRAKES' },
  { id: 'marina', file: 'scenes/marina.jpg', name: 'Marina', caption: 'THE MARINA · 7:48 PM — LAST BERTH' },
];

/** The seven layouts. Each returns panels as { x, y, w, h, rot, points?, hero? } in cover pixels. */
export const LAYOUTS = [
  { id: 'hero-strip', name: 'Hero + Strip', blurb: 'Big hero, four scenes' },
  { id: 'full-grid', name: 'Full Grid', blurb: 'Hero + six scenes' },
  { id: 'nine-grid', name: 'Nine Grid', blurb: 'Nine scenes, no repeats' },
  { id: 'title-band', name: 'Title Band', blurb: 'Clean band for the title' },
  { id: 'slash', name: 'Slash', blurb: 'Diagonal panel cuts' },
  { id: 'key-art', name: 'Key Art', blurb: 'Hero on top, strip below' },
  { id: 'triple', name: 'Triple', blurb: 'Three panels, title below' },
];

/** The four colour grades. */
export const GRADES = [
  { id: 'sunset', name: 'Sunset', blurb: 'Purple → rose → orange' },
  { id: 'neon', name: 'Neon Night', blurb: 'Pink + cyan after dark' },
  { id: 'golden', name: 'Golden Hour', blurb: 'Warm honey light' },
  { id: 'ink', name: 'Poster Ink', blurb: 'Posterised halftone' },
];

/** The three export sizes the bounty asks for. */
export const EXPORT_SIZES = [
  { id: '1920x1080', label: '1920 × 1080', w: 1920, h: 1080 },
  { id: '1080x1080', label: '1080 × 1080', w: 1080, h: 1080 },
  { id: '1080x1350', label: '1080 × 1350', w: 1080, h: 1350 },
];

/** The title band's top edge, as a fraction of the cover height (title-band layout). */
export const TITLE_BAND_TOP = 0.66;

/** Default cover state: what a fresh visitor sees. The densest layout opens first. */
export function defaultState() {
  return {
    layout: 'nine-grid',
    grade: 'sunset',
    size: '1920x1080',
    title: 'VICE ROYALE',
    script: 'chasing the last light',
    quote: 'THE COAST HAS NEVER LOOKED THIS GUILTY.',
    quotePaper: 'THE VICE LEDGER',
    band: 'EVERY SUNSET HAS A PRICE',
    furniture: { seal: true, vol: true, ribbon: true, heat: true, quote: true, band: true, credits: true, barcode: true },
    panels: defaultPanels('nine-grid'),
  };
}

/** Default panel sources + captions for a layout: the hero panel shows the hero photo,
    the rest take the scenes in turn, each captioned for its own picture. */
export function defaultPanels(layoutId) {
  const count = layoutPanelCount(layoutId);
  const heroIdx = layoutPanels(layoutId, 100, 100).findIndex((p) => p.hero);
  const order = ['sportscar', 'neonstreet', 'speedboat', 'skyline', 'pier', 'boulevard', 'heli', 'motorbike', 'marina'];
  const panels = [];
  let scene = 0;
  for (let i = 0; i < count; i++) {
    if (i === heroIdx) {
      panels.push({ source: 'hero', caption: SCENES[0].caption, crop: { x: 0.5, y: 0.35, zoom: 1 } });
    } else {
      // Take the next scene in turn (computed once per panel, not per find step).
      const id = order[scene++ % order.length];
      const s = SCENES.find((x) => x.id === id);
      panels.push({ source: s.id, caption: s.caption, crop: { x: 0.5, y: 0.35, zoom: 1 } });
    }
  }
  return panels;
}

/** Replaces any repeated scene source (other than 'hero') with an unused scene, so a
    dense grid never shows the same photo twice. Returns the panels, edited in place. */
export function dedupePanelSources(panels) {
  const used = new Set();
  for (const p of panels) {
    if (p.source === 'hero' || p.source.startsWith('photo:')) {
      used.add(p.source);
      continue;
    }
    if (used.has(p.source)) {
      const spare = SCENES.find((s) => !used.has(s.id));
      if (spare) {
        p.source = spare.id;
        p.caption = spare.caption;
      }
    }
    used.add(p.source);
  }
  return panels;
}

/** How many panels a layout holds. */
export function layoutPanelCount(layoutId) {
  if (layoutId === 'hero-strip') return 5;
  if (layoutId === 'full-grid') return 7;
  if (layoutId === 'nine-grid') return 9;
  if (layoutId === 'title-band') return 7;
  if (layoutId === 'slash') return 3;
  if (layoutId === 'key-art') return 5;
  return 3; // triple
}

/** Panel rectangles for a layout at cover size W x H. rot is a slight tilt in radians. */
export function layoutPanels(layoutId, W, H) {
  const m = Math.round(W * 0.008); // outer margin
  const g = Math.round(W * 0.007); // gutter
  if (layoutId === 'hero-strip') {
    const heroW = Math.round(W * 0.55);
    const x0 = heroW + g;
    const cw = Math.round((W - m - x0 - g) / 2);
    const ch = Math.round((H - 2 * m - g) / 2);
    return [
      { x: m, y: m, w: heroW - m, h: H - 2 * m, rot: -0.014, hero: true },
      { x: x0, y: m, w: cw, h: ch, rot: 0.02 },
      { x: x0 + cw + g, y: m, w: cw, h: ch, rot: -0.018 },
      { x: x0, y: m + ch + g, w: cw, h: ch, rot: -0.02 },
      { x: x0 + cw + g, y: m + ch + g, w: cw, h: ch, rot: 0.016 },
    ];
  }
  if (layoutId === 'full-grid') {
    const heroW = Math.round(W * 0.32);
    const x0 = heroW + g;
    const cw = Math.round((W - m - x0 - g) / 2);
    const ch = Math.round((H - 2 * m - 2 * g) / 3);
    const panels = [{ x: m, y: m, w: heroW - m, h: H - 2 * m, rot: -0.012, hero: true }];
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 2; c++) {
        panels.push({ x: x0 + c * (cw + g), y: m + r * (ch + g), w: cw, h: ch, rot: (r + c) % 2 === 0 ? 0.016 : -0.016 });
      }
    }
    return panels;
  }
  if (layoutId === 'nine-grid') {
    // A 3 x 3 grid of nine distinct scenes, hero top-left — the GTA V cover grid.
    const cw = Math.round((W - 2 * m - 2 * g) / 3);
    const ch = Math.round((H - 2 * m - 2 * g) / 3);
    const panels = [];
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        panels.push({
          x: m + c * (cw + g), y: m + r * (ch + g), w: cw, h: ch,
          rot: (r + c) % 2 === 0 ? 0.014 : -0.014, hero: r === 0 && c === 0,
        });
      }
    }
    return panels;
  }
  if (layoutId === 'title-band') {
    // Tall hero + 2 x 3 captioned scene grid in the top zone, above the clean title
    // band — the layout where the lettering never fights the art.
    const zoneH = Math.round(H * TITLE_BAND_TOP);
    const heroW = Math.round(W * 0.32);
    const x0 = heroW + g;
    const cw = Math.round((W - m - x0 - g) / 2);
    const ch = Math.round((zoneH - 2 * m - 2 * g) / 3);
    const panels = [{ x: m, y: m, w: heroW - m, h: zoneH - 2 * m, rot: -0.012, hero: true }];
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 2; c++) {
        panels.push({ x: x0 + c * (cw + g), y: m + r * (ch + g), w: cw, h: ch, rot: (r + c) % 2 === 0 ? 0.016 : -0.016 });
      }
    }
    return panels;
  }
  if (layoutId === 'slash') {
    // Three diagonal-cut panels: parallelograms leaning right.
    const slant = Math.round(W * 0.07);
    return [
      { points: [[m, m], [W * 0.40, m], [W * 0.40 - slant, H - m], [m, H - m]], rot: 0, hero: true },
      { points: [[W * 0.40 + g, m], [W * 0.70, m], [W * 0.70 - slant, H - m], [W * 0.40 + g - slant, H - m]], rot: 0 },
      { points: [[W * 0.70 + g, m], [W - m, m], [W - m, H - m], [W * 0.70 + g - slant, H - m]], rot: 0 },
    ].map((p) => ({ ...p, x: Math.min(...p.points.map((q) => q[0])), y: m, w: Math.max(...p.points.map((q) => q[0])) - Math.min(...p.points.map((q) => q[0])), h: H - 2 * m }));
  }
  if (layoutId === 'key-art') {
    const heroH = Math.round(H * 0.60);
    const y0 = heroH + g;
    const cw = Math.round((W - 2 * m - 3 * g) / 4);
    const ch = H - m - y0;
    const panels = [{ x: m, y: m, w: W - 2 * m, h: heroH - m, rot: 0, hero: true }];
    for (let c = 0; c < 4; c++) {
      panels.push({ x: m + c * (cw + g), y: y0, w: cw, h: ch, rot: c % 2 === 0 ? 0.014 : -0.014 });
    }
    return panels;
  }
  // triple: three panels across the top, title below them
  const cw = Math.round((W - 2 * m - 2 * g) / 3);
  const ch = Math.round(H * 0.58);
  return [0, 1, 2].map((c) => ({
    x: m + c * (cw + g), y: m, w: cw, h: ch, rot: c === 1 ? 0 : (c === 0 ? -0.012 : 0.012), hero: c === 1,
  }));
}

/** Cover-fit draw position: the image scaled to cover the panel, centred on the crop focus. */
export function coverFit(img, panel, crop) {
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  const scale = Math.max(panel.w / iw, panel.h / ih) * (crop.zoom || 1);
  const dw = iw * scale;
  const dh = ih * scale;
  // Clamp the focus so the image always covers the panel.
  const fx = dw > panel.w ? Math.min(Math.max(crop.x, panel.w / (2 * dw)), 1 - panel.w / (2 * dw)) : 0.5;
  const fy = dh > panel.h ? Math.min(Math.max(crop.y, panel.h / (2 * dh)), 1 - panel.h / (2 * dh)) : 0.5;
  return { dx: panel.x + panel.w / 2 - fx * dw, dy: panel.y + panel.h / 2 - fy * dh, dw, dh };
}

/** Shrinks a font size until `text` fits `maxWidth`; returns the fitted size. */
export function fitFontSize(ctx, text, startSize, maxWidth, fontFor) {
  let size = startSize;
  ctx.font = fontFor(size);
  while (size > 10 && ctx.measureText(text).width > maxWidth) {
    size -= 2;
    ctx.font = fontFor(size);
  }
  return size;
}

/** A point-in-panel test for clicks (uses the unrotated rect; close enough for a small tilt). */
export function panelAt(panels, x, y) {
  for (let i = panels.length - 1; i >= 0; i--) {
    const p = panels[i];
    if (p.points) {
      if (pointInPolygon(x, y, p.points)) return i;
    } else if (x >= p.x && x <= p.x + p.w && y >= p.y && y <= p.y + p.h) {
      return i;
    }
  }
  return -1;
}

function pointInPolygon(x, y, points) {
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const [xi, yi] = points[i];
    const [xj, yj] = points[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

/** The sky behind the panels, per grade: the Vice sunset gradient. */
export function drawSky(ctx, grade, W, H) {
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  if (grade === 'neon') {
    sky.addColorStop(0, '#160829');
    sky.addColorStop(0.45, '#3d1157');
    sky.addColorStop(0.75, '#8a1e6e');
    sky.addColorStop(1, '#ff2e88');
  } else if (grade === 'golden') {
    sky.addColorStop(0, '#7a2d12');
    sky.addColorStop(0.45, '#d96b1e');
    sky.addColorStop(0.75, '#ff9e3d');
    sky.addColorStop(1, '#ffd166');
  } else if (grade === 'ink') {
    sky.addColorStop(0, '#1a0b2e');
    sky.addColorStop(0.5, '#5b2a86');
    sky.addColorStop(1, '#c22e7a');
  } else {
    sky.addColorStop(0, '#3b1c6e');
    sky.addColorStop(0.45, '#fc94af');
    sky.addColorStop(1, '#ff8a3d');
  }
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);
}

/** Canvas filter string per grade (keeps faces warm under the magenta grades). */
function gradeFilter(grade) {
  if (grade === 'neon') return 'saturate(1.35) contrast(1.18) brightness(0.98) hue-rotate(-8deg)';
  if (grade === 'golden') return 'saturate(1.3) contrast(1.1) brightness(1.05) sepia(0.28)';
  if (grade === 'ink') return 'none';
  return 'saturate(1.25) contrast(1.12) brightness(1.02) sepia(0.12)';
}

/** Draws one photo panel: clip, cover-fit image, grade wash, cream border, caption tab.
    `captionLimitY`: a caption tab is drawn only when the panel's top edge sits above
    it — a tab any lower would be hidden behind the title, so it is skipped outright
    rather than left half-visible. Returns the caption tab height drawn (0 if none). */
export function drawPanel(ctx, img, panel, crop, caption, grade, W, H, captionLimitY = Infinity) {
  ctx.save();
  beginPanelPath(ctx, panel);
  ctx.clip();
  // From here the panel is drawn in its own local frame: for a tilted panel the
  // origin is the panel centre, so the image, wash and vignette line up with the clip.
  // (Drawing them in canvas coordinates after the rotate would shift them by the centre.)
  const local = panel.rot
    ? { x: -panel.w / 2, y: -panel.h / 2, w: panel.w, h: panel.h }
    : panel;
  if (grade === 'ink') {
    drawPosterisedPanel(ctx, img, local, crop);
  } else {
    ctx.filter = gradeFilter(grade);
    const fit = coverFit(img, local, crop);
    ctx.drawImage(img, fit.dx, fit.dy, fit.dw, fit.dh);
    ctx.filter = 'none';
    drawGradeWash(ctx, local, grade);
  }
  drawVignette(ctx, local);
  ctx.restore();
  // Cream border + thin black keyline around the panel.
  ctx.save();
  beginPanelPath(ctx, panel);
  ctx.lineWidth = Math.max(2, W * 0.002);
  ctx.strokeStyle = '#fff3d6';
  ctx.stroke();
  ctx.lineWidth = Math.max(1, W * 0.0008);
  ctx.strokeStyle = 'rgba(18, 8, 31, 0.9)';
  ctx.stroke();
  ctx.restore();
  const tabTop = panel.points ? panel.points[0][1] : panel.y;
  if (tabTop + 4 >= captionLimitY) return 0;
  return drawCaptionTab(ctx, panel, caption, H);
}

/** The clip path of a panel: a (possibly tilted) rectangle, or a slash polygon. */
function beginPanelPath(ctx, panel) {
  ctx.beginPath();
  if (panel.points) {
    ctx.moveTo(panel.points[0][0], panel.points[0][1]);
    for (let i = 1; i < panel.points.length; i++) ctx.lineTo(panel.points[i][0], panel.points[i][1]);
    ctx.closePath();
    return;
  }
  if (panel.rot) {
    const cx = panel.x + panel.w / 2;
    const cy = panel.y + panel.h / 2;
    ctx.translate(cx, cy);
    ctx.rotate(panel.rot);
    ctx.rect(-panel.w / 2, -panel.h / 2, panel.w, panel.h);
  } else {
    ctx.rect(panel.x, panel.y, panel.w, panel.h);
  }
}

/** A soft warm/cool wash over the photo, per grade. */
function drawGradeWash(ctx, panel, grade) {
  const wash = ctx.createLinearGradient(panel.x, panel.y, panel.x, panel.y + panel.h);
  if (grade === 'neon') {
    wash.addColorStop(0, 'rgba(26, 11, 46, 0.22)');
    wash.addColorStop(0.6, 'rgba(255, 20, 147, 0.10)');
    wash.addColorStop(1, 'rgba(0, 240, 255, 0.10)');
  } else if (grade === 'golden') {
    wash.addColorStop(0, 'rgba(255, 170, 60, 0.05)');
    wash.addColorStop(1, 'rgba(255, 110, 0, 0.20)');
  } else {
    wash.addColorStop(0, 'rgba(59, 28, 110, 0.10)');
    wash.addColorStop(0.55, 'rgba(252, 148, 175, 0.08)');
    wash.addColorStop(1, 'rgba(255, 138, 61, 0.16)');
  }
  ctx.globalCompositeOperation = 'soft-light';
  ctx.fillStyle = wash;
  ctx.fillRect(panel.x, panel.y, panel.w, panel.h);
  ctx.globalCompositeOperation = 'source-over';
}

/** Darkens the panel edges a touch so the centre reads. */
function drawVignette(ctx, panel) {
  const r = Math.max(panel.w, panel.h) * 0.75;
  const vg = ctx.createRadialGradient(
    panel.x + panel.w / 2, panel.y + panel.h / 2, r * 0.35,
    panel.x + panel.w / 2, panel.y + panel.h / 2, r,
  );
  vg.addColorStop(0, 'rgba(18, 8, 31, 0)');
  vg.addColorStop(1, 'rgba(18, 8, 31, 0.28)');
  ctx.fillStyle = vg;
  ctx.fillRect(panel.x, panel.y, panel.w, panel.h);
}

/** Poster Ink grade: posterise the panel to five duotone levels, then a halftone dot wash. */
function drawPosterisedPanel(ctx, img, panel, crop) {
  const off = document.createElement('canvas');
  off.width = Math.max(2, Math.round(panel.w));
  off.height = Math.max(2, Math.round(panel.h));
  const octx = off.getContext('2d');
  const fit = coverFit(img, { x: 0, y: 0, w: off.width, h: off.height }, crop);
  octx.drawImage(img, fit.dx, fit.dy, fit.dw, fit.dh);
  const data = octx.getImageData(0, 0, off.width, off.height);
  const px = data.data;
  const levels = [
    [18, 8, 31], [91, 42, 134], [194, 46, 122], [255, 106, 61], [255, 233, 201],
  ];
  for (let i = 0; i < px.length; i += 4) {
    const lum = 0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2];
    const level = Math.min(4, Math.floor(lum / 51.2));
    const c = levels[level];
    px[i] = c[0];
    px[i + 1] = c[1];
    px[i + 2] = c[2];
  }
  octx.putImageData(data, 0, 0);
  ctx.drawImage(off, panel.x, panel.y);
  // Halftone dots: a small tile stamped over the panel.
  const tile = document.createElement('canvas');
  tile.width = 14;
  tile.height = 14;
  const tctx = tile.getContext('2d');
  tctx.fillStyle = 'rgba(18, 8, 31, 0.55)';
  tctx.beginPath();
  tctx.arc(7, 7, 2.2, 0, Math.PI * 2);
  tctx.fill();
  const pattern = ctx.createPattern(tile, 'repeat');
  ctx.save();
  ctx.globalAlpha = 0.35;
  ctx.fillStyle = pattern;
  ctx.fillRect(panel.x, panel.y, panel.w, panel.h);
  ctx.restore();
}

/** Two-line black caption label at the panel's top-left: big PLACE on the first line,
    smaller TIME — TAGLINE on the second. A caption without " · " draws as one line.
    Returns the label height drawn (0 when there is no caption). */
export function drawCaptionTab(ctx, panel, caption, H) {
  const raw = (caption || '').trim();
  if (!raw) return 0;
  const upper = raw.toUpperCase();
  const dot = upper.indexOf('·');
  const place = dot > 0 ? upper.slice(0, dot).trim() : upper;
  const sub = dot > 0 ? upper.slice(dot + 1).trim() : '';
  const pad = Math.max(8, H * 0.010);
  const gap = Math.max(2, H * 0.003);
  let placeSize = Math.max(13, H * 0.020);
  let subSize = Math.max(10, H * 0.014);
  const placeFont = (s) => `800 ${s}px "Barlow Condensed", "Arial Narrow", sans-serif`;
  const subFont = (s) => `700 ${s}px "Barlow Condensed", "Arial Narrow", sans-serif`;
  // Slash panels are polygons: the tab sits on the top edge, not the bounding box.
  const tabX = panel.points ? panel.points[0][0] + 4 : panel.x + 4;
  const maxW = panel.points
    ? panel.points[1][0] - panel.points[0][0] - 12
    : panel.w - pad * 2 - 8;
  ctx.font = placeFont(placeSize);
  while (placeSize > 11 && ctx.measureText(place).width > maxW) {
    placeSize -= 1;
    ctx.font = placeFont(placeSize);
  }
  if (sub) {
    ctx.font = subFont(subSize);
    while (subSize > 9 && ctx.measureText(sub).width > maxW) {
      subSize -= 1;
      ctx.font = subFont(subSize);
    }
  }
  const lineW = Math.max(
    ctx.measureText(place).width,
    sub ? ctx.measureText(sub).width : 0,
  );
  const tabW = Math.min(maxW + pad * 2, lineW + pad * 2);
  const tabH = placeSize + (sub ? gap + subSize : 0) + pad * 1.6;
  const ty = panel.y + 4;
  ctx.save();
  ctx.fillStyle = 'rgba(10, 5, 20, 0.9)';
  ctx.fillRect(tabX, ty, tabW, tabH);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#fff3d6';
  ctx.font = placeFont(placeSize);
  ctx.fillText(place, tabX + pad, ty + pad + placeSize * 0.85);
  if (sub) {
    ctx.fillStyle = '#ffb86b';
    ctx.font = subFont(subSize);
    ctx.fillText(sub, tabX + pad, ty + pad + placeSize + gap + subSize * 0.85);
  }
  ctx.restore();
  return tabH;
}

/** Measures the title (grows to fill `maxWidth`, capped at `maxSize`) and returns its
    geometry: { size, baseline, top, bottom, centerX }. No drawing. */
export function fitTitle(text, W, H, opts = {}) {
  const clean = (text || '').trim().toUpperCase();
  const baseline = opts.baseline ?? H * 0.76;
  const maxWidth = opts.maxWidth ?? W * 0.94;
  const maxSize = opts.maxSize ?? H * 0.26;
  const centerX = opts.centerX ?? W / 2;
  if (!clean) return { size: 0, baseline, top: baseline, bottom: baseline, centerX };
  const fontFor = (s) => `900 ${s}px "Passion One", "Anton", sans-serif`;
  // Grow-to-fill: the size that spans maxWidth, then clamp to maxSize so a short
  // title stays poster-tall instead of ballooning.
  const probe = document.createElement('canvas').getContext('2d');
  probe.font = fontFor(100);
  const w100 = probe.measureText(clean).width || 1;
  let size = Math.min(maxSize, Math.max(H * 0.10, (100 * maxWidth) / w100));
  // The real context may measure the fallback font wider; shrink to fit for real.
  size = fitFontSize(probe, clean, size, maxWidth, fontFor);
  const top = baseline - size * 0.78;
  // Ink bottom: the outline reaches past the baseline and the 3D extrusion steps
  // further down-right (see drawTitle).
  const bottom = baseline + size * 0.045 + size * 0.012 * 6;
  return { size, baseline, top, bottom, centerX };
}

/** The giant gradient title, with a layered 3D extrusion: six offset copies in deep
    purple stepping down-right behind the black outline and the gradient fill, so the
    letters stand off the art. `info` is a fitTitle() result (computed when omitted). */
export function drawTitle(ctx, title, W, H, info) {
  const text = (title || '').trim().toUpperCase();
  if (!text) return null;
  const t = info || fitTitle(text, W, H);
  const { size, baseline, top, centerX } = t;
  const grad = ctx.createLinearGradient(0, top, 0, baseline);
  grad.addColorStop(0, '#fff3d6');
  grad.addColorStop(0.55, '#ff8a3d');
  grad.addColorStop(1, '#ff2e88');
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.lineJoin = 'round';
  ctx.font = `900 ${size}px "Passion One", "Anton", sans-serif`;
  // 3D extrusion: far copies darker, near copies lighter, all stepping down-right.
  const steps = 6;
  const dx = size * 0.012;
  const dy = size * 0.012;
  for (let i = steps; i >= 1; i--) {
    ctx.fillStyle = i > steps / 2 ? '#241040' : '#3b1c6e';
    ctx.fillText(text, centerX + dx * i, baseline + dy * i);
  }
  // Thick black outline, then the gradient fill.
  ctx.lineWidth = Math.max(4, size * 0.09);
  ctx.strokeStyle = '#12081f';
  ctx.strokeText(text, centerX, baseline);
  ctx.fillStyle = grad;
  ctx.fillText(text, centerX, baseline);
  ctx.restore();
  return t;
}

/** Pink brush-script line under the title, tilted -2 degrees, fitted to the width.
    Placed from measured ink, never from a fixed offset: the script's top clears the
    title's ink bottom (baseline + outline + extrusion) by a clear gap, and its
    bottom clears the furniture band (pills / ribbon). The tilt lifts the right end
    and drops the left, so the tallest ascender / deepest descender are measured per
    glyph at their own x position — a wide script can no longer climb into the title
    on its right end. If the band is too short, the script shrinks before it ever
    collides; the title clearance is never sacrificed. On art (not the title band)
    a dark scrim is drawn behind the script first, so the pink reads on any photo. */
export function drawScript(ctx, script, titleInfo, W, H, opts = {}) {
  const text = (script || '').trim();
  if (!text) return;
  const tilt = 0.035; // -2 degrees, as in the brief
  const centerX = opts.centerX ?? W * 0.5;
  const titleBottom = titleInfo ? titleInfo.bottom : H * 0.82;
  const gap = H * 0.018;
  const furnitureTop = opts.furnitureTop ?? H * 0.905;
  const bottomMargin = H * 0.008;
  const floor = Math.max(13, H * 0.022);

  // Ink extents at a size: whole-string width, plus the per-glyph ascender /
  // descender extremes including the tilt: rotate(-2°) lifts the RIGHT end and
  // drops the LEFT, so the highest ink is an ascender on the right and the
  // lowest ink a descender on the left. (Verified by pixel scan: the script's
  // right third sits ~14 px higher than its left third at 1080 wide.)
  const measure = (size) => {
    ctx.font = `400 ${size}px "Yellowtail", cursive`;
    const full = ctx.measureText(text);
    let x = 0;
    let topRel = 0;
    let botRel = 0;
    for (const ch of text) {
      const gm = ctx.measureText(ch);
      const cx = x + gm.width / 2 - full.width / 2;
      topRel = Math.max(topRel, gm.actualBoundingBoxAscent + Math.max(0, cx) * tilt);
      botRel = Math.max(botRel, gm.actualBoundingBoxDescent + Math.max(0, -cx) * tilt);
      x += gm.width;
    }
    return { width: full.width, topRel, botRel };
  };

  // Fit the width first, then the vertical band below the title.
  const widthCap = opts.widthCap ?? W * 0.80;
  let size = Math.max(14, H * 0.06);
  ctx.font = `400 ${size}px "Yellowtail", cursive`;
  while (size > 13 && ctx.measureText(text).width > widthCap) {
    size -= 2;
    ctx.font = `400 ${size}px "Yellowtail", cursive`;
  }
  let m = measure(size);
  while (size > floor && titleBottom + gap + m.topRel + m.botRel + 4 > furnitureTop - bottomMargin) {
    size = Math.max(floor, size * 0.92);
    m = measure(size);
  }
  // Dark scrim behind the script when it sits on art (not in the clean title band),
  // so the pink reads on any photo underneath.
  if (!opts.inBand) {
    const scrim = ctx.createLinearGradient(0, titleBottom, 0, furnitureTop);
    scrim.addColorStop(0, 'rgba(18, 8, 31, 0)');
    scrim.addColorStop(0.3, 'rgba(18, 8, 31, 0.5)');
    scrim.addColorStop(0.7, 'rgba(18, 8, 31, 0.5)');
    scrim.addColorStop(1, 'rgba(18, 8, 31, 0)');
    ctx.save();
    ctx.fillStyle = scrim;
    ctx.fillRect(0, titleBottom, W, furnitureTop - titleBottom);
    ctx.restore();
  }
  // Alphabetic baseline: the ink top lands exactly one gap below the title.
  const baseline = titleBottom + gap + m.topRel;
  ctx.save();
  ctx.translate(centerX, baseline);
  ctx.rotate(-tilt);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.shadowColor = 'rgba(255, 110, 199, 0.9)';
  ctx.shadowBlur = size * 0.35;
  ctx.fillStyle = '#ff6ec7';
  ctx.fillText(text, 0, 0);
  ctx.restore();
  return m.width;
}

/** The clean title band (title-band layout): a deep purple-to-magenta band with a
    thin gold top rule, so the title and script sit on a quiet background. */
export function drawTitleBand(ctx, top, bottom, W) {
  ctx.save();
  const band = ctx.createLinearGradient(0, top, 0, bottom);
  band.addColorStop(0, '#3b1c6e');
  band.addColorStop(0.55, '#5b1a63');
  band.addColorStop(1, '#7a1e5e');
  ctx.fillStyle = band;
  ctx.fillRect(0, top, W, bottom - top);
  ctx.fillStyle = '#ffb52e';
  ctx.fillRect(0, top, W, Math.max(2, (bottom - top) * 0.012));
  ctx.fillStyle = 'rgba(255, 243, 214, 0.12)';
  ctx.fillRect(0, bottom - Math.max(2, (bottom - top) * 0.012), W, Math.max(2, (bottom - top) * 0.012));
  ctx.restore();
}

/** Gold starburst seal: EST. 2026. Drawn as a 16-point star, no image.
    Sits below the panel caption tabs, overlapping the art like a sticker.
    `opts` can move it (the title band puts it on the band's left side). */
export function drawSeal(ctx, W, H, opts = {}) {
  const cx = opts.cx ?? W * 0.955;
  const cy = opts.cy ?? H * 0.085;
  const r = opts.r ?? H * 0.038;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.beginPath();
  const points = 16;
  for (let i = 0; i < points * 2; i++) {
    const rad = i % 2 === 0 ? r : r * 0.82;
    const a = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
    if (i === 0) ctx.moveTo(Math.cos(a) * rad, Math.sin(a) * rad);
    else ctx.lineTo(Math.cos(a) * rad, Math.sin(a) * rad);
  }
  ctx.closePath();
  const gold = ctx.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.1, 0, 0, r);
  gold.addColorStop(0, '#ffe9a8');
  gold.addColorStop(0.6, '#ffb52e');
  gold.addColorStop(1, '#d98a00');
  ctx.fillStyle = gold;
  ctx.fill();
  ctx.lineWidth = Math.max(1.5, r * 0.06);
  ctx.strokeStyle = '#7a4d00';
  ctx.stroke();
  ctx.fillStyle = '#1a0b2e';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `800 ${r * 0.42}px "Barlow Condensed", sans-serif`;
  ctx.fillText('EST.', 0, -r * 0.28);
  ctx.font = `800 ${r * 0.52}px "Barlow Condensed", sans-serif`;
  ctx.fillText('2026', 0, r * 0.32);
  ctx.restore();
}

/** COLLECTOR'S EDITION ribbon: a banner in the furniture band above the palm band,
    centred on the hero panel — clear of the caption tabs (top), the title and the script.
    `opts` can move it (the title band puts it at the band's bottom-right). */
export function drawRibbon(ctx, heroCenterX, W, H, opts = {}) {
  const h = Math.max(14, H * 0.028);
  ctx.save();
  ctx.font = `800 ${h * 0.52}px "Barlow Condensed", sans-serif`;
  const w = Math.min(W * 0.2, ctx.measureText("COLLECTOR'S EDITION").width + h * 1.4);
  // Centred on the hero panel, but never under the VOL. 06 pill at the left edge.
  const cx = opts.centerX ?? heroCenterX;
  const x = Math.max(cx - w / 2, W * 0.11);
  const y = opts.y ?? H * 0.895;
  ctx.fillStyle = '#c81e4e';
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = '#ffd166';
  ctx.fillRect(x, y, w, 2);
  ctx.fillRect(x, y + h - 2, w, 2);
  ctx.fillStyle = '#fff3d6';
  ctx.font = `800 ${h * 0.52}px "Barlow Condensed", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText("COLLECTOR'S EDITION", x + w / 2, y + h / 2 + 1);
  ctx.restore();
}

/** A small pill: VOL. 06 bottom-left, HEAT ★★★★★ bottom-right, above the palm band.
    The pill sizes itself to its text (the star glyphs fall back to a wider font), so
    nothing is ever cut at the edge. `anchorX` is the left edge, or the right edge when
    `rightAnchored`. */
export function drawPill(ctx, text, anchorX, y, h, gold, rightAnchored) {
  ctx.save();
  ctx.font = `800 ${h * 0.5}px "Barlow Condensed", sans-serif`;
  const w = ctx.measureText(text).width + h * 1.1;
  const x = rightAnchored ? anchorX - w : anchorX;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, h / 2);
  ctx.fillStyle = gold ? '#1a0b2e' : 'rgba(10, 5, 20, 0.9)';
  ctx.fill();
  ctx.lineWidth = Math.max(1.5, h * 0.08);
  ctx.strokeStyle = gold ? '#ffb52e' : '#ff2e88';
  ctx.stroke();
  ctx.fillStyle = gold ? '#ffd166' : '#ff6ec7';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x + w / 2, y + h / 2 + 1);
  ctx.restore();
}

/** Five-star press quote, top-left under the top edge — below the hero panel's
    two-line caption tab, so the stars never touch the tab. */
export function drawQuote(ctx, quote, paper, W, H) {
  const text = (quote || '').trim();
  if (!text) return;
  const x = W * 0.02;
  let y = H * 0.08;
  ctx.save();
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#ffd166';
  ctx.font = `${Math.max(12, H * 0.02)}px sans-serif`;
  ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
  ctx.shadowBlur = 4;
  ctx.fillText('★★★★★', x, y);
  y += H * 0.028;
  ctx.fillStyle = '#fff3d6';
  const size = fitFontSize(ctx, `"${text}"`, H * 0.024, W * 0.44, (s) => `700 ${s}px "Barlow Condensed", sans-serif`);
  ctx.font = `700 ${size}px "Barlow Condensed", sans-serif`;
  ctx.fillText(`"${text}"`, x, y);
  y += size * 1.15;
  ctx.fillStyle = '#ffb86b';
  ctx.font = `700 ${Math.max(10, H * 0.015)}px "Barlow Condensed", sans-serif`;
  ctx.fillText(`— ${paper || 'THE VICE LEDGER'}`, x, y);
  ctx.restore();
}

/** Palm-silhouette bottom band with tagline, credits and barcode. Taller than v1, with
    a sunset gradient behind the palms so the band reads as a horizon, not a black bar. */
export function drawPalmBand(ctx, band, showCredits, showBarcode, W, H, palmH) {
  const bandH = palmH ?? Math.max(30, H * 0.06);
  const y = H - bandH;
  ctx.save();
  const bg = ctx.createLinearGradient(0, y, 0, H);
  bg.addColorStop(0, '#4a2470');
  bg.addColorStop(0.45, '#241239');
  bg.addColorStop(1, '#12081f');
  ctx.fillStyle = bg;
  ctx.fillRect(0, y, W, bandH);
  drawPalmSilhouettes(ctx, y, bandH, W, H);
  ctx.fillStyle = '#fff3d6';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const size = fitFontSize(ctx, band, H * 0.026, W * 0.62, (s) => `800 ${s}px "Barlow Condensed", sans-serif`);
  ctx.font = `800 ${size}px "Barlow Condensed", sans-serif`;
  ctx.fillText(band, W / 2, y + bandH / 2 + 1);
  if (showCredits) {
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(255, 243, 214, 0.75)';
    ctx.font = `700 ${Math.max(9, H * 0.011)}px "Barlow Condensed", sans-serif`;
    ctx.fillText('VICE COVER STUDIO · ALL PHOTOS ORIGINAL · EST. 2026', W * 0.012, y + bandH / 2 + 1);
  }
  if (showBarcode) drawBarcode(ctx, W * 0.94, y + bandH * 0.22, W * 0.05, bandH * 0.56);
  ctx.restore();
}

/** Simple palm silhouettes along the band: trunk + five fronds each. */
function drawPalmSilhouettes(ctx, y, bandH, W, H) {
  ctx.save();
  // Near-black silhouettes, darker than every stop of the band gradient, so the
  // palms read as a crisp row against the lighter band top.
  ctx.strokeStyle = '#0d0518';
  ctx.fillStyle = '#0d0518';
  ctx.lineWidth = Math.max(2, bandH * 0.08);
  const spacing = W * 0.09;
  for (let x = W * 0.03; x < W; x += spacing) {
    const top = y + bandH * 0.08;
    ctx.beginPath();
    ctx.moveTo(x, y + bandH);
    ctx.quadraticCurveTo(x + bandH * 0.08, y + bandH * 0.5, x + bandH * 0.05, top);
    ctx.stroke();
    for (let f = 0; f < 5; f++) {
      const a = -Math.PI * (0.15 + f * 0.175);
      ctx.beginPath();
      ctx.moveTo(x + bandH * 0.05, top);
      ctx.quadraticCurveTo(
        x + bandH * 0.05 + Math.cos(a) * bandH * 0.5, top + Math.sin(a) * bandH * 0.42,
        x + bandH * 0.05 + Math.cos(a) * bandH * 0.85, top + Math.sin(a) * bandH * 0.7 + bandH * 0.25,
      );
      ctx.stroke();
    }
  }
  ctx.restore();
}

/** Deterministic barcode: fixed seed, so re-renders are identical. */
function drawBarcode(ctx, x, y, w, h) {
  ctx.save();
  ctx.fillStyle = '#fff3d6';
  ctx.fillRect(x - 4, y - 3, w + 8, h + 6);
  let seed = 20261120;
  const next = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
  ctx.fillStyle = '#12081f';
  let bx = x;
  while (bx < x + w - 2) {
    const bw = 1 + next() * 4;
    if (next() > 0.4) ctx.fillRect(bx, y, bw, h);
    bx += bw + 1 + next() * 3;
  }
  ctx.restore();
}

/** Resolves a panel's source to a loaded image. 'hero' is the first upload, else the Boulevard scene. */
export function resolvePanelImage(panel, uploads, sceneImages) {
  if (panel.source === 'hero') return uploads[0] || sceneImages.boulevard;
  if (panel.source.startsWith('photo:')) return uploads[Number(panel.source.slice(6))] || sceneImages.boulevard;
  return sceneImages[panel.source] || sceneImages.boulevard;
}

/** Draws the whole cover onto `canvas` at its own size. `images` maps scene id -> Image.
    The title is measured before the panels are drawn, so a caption tab is skipped
    wherever the title would cover it — no caption fragment can peek out from behind
    the title. The title-band layout gets its own clean band for the lettering. */
export function renderCover(canvas, state, images, uploads) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;
  const { layout, grade, furniture } = state;
  const isBand = layout === 'title-band';
  const palmH = Math.max(30, H * 0.06);
  const bandTop = Math.round(H * TITLE_BAND_TOP);
  const bandBottom = H - palmH;
  drawSky(ctx, grade, W, H);
  const panels = layoutPanels(layout, W, H);
  // Title geometry first: the panels' captions dodge the title's top edge.
  const titleInfo = isBand
    ? fitTitle(state.title, W, H, {
      baseline: bandTop + (bandBottom - bandTop) * 0.50,
      maxWidth: W * 0.60, maxSize: (bandBottom - bandTop) * 0.50, centerX: W * 0.53,
    })
    : fitTitle(state.title, W, H, { baseline: H * 0.76, maxWidth: W * 0.94, maxSize: H * 0.26 });
  const captionLimitY = isBand ? bandTop : titleInfo.top;
  panels.forEach((panel, i) => {
    const p = state.panels[i] || defaultPanels(layout)[i];
    const img = resolvePanelImage(p, uploads, images);
    if (img) drawPanel(ctx, img, panel, p.crop, p.caption, grade, W, H, captionLimitY);
  });
  const heroPanel = panels.find((p) => p.hero);
  const heroCenterX = heroPanel ? heroPanel.x + heroPanel.w / 2 : W / 2;
  const pillH = Math.max(18, H * 0.028);
  if (isBand) {
    drawTitleBand(ctx, bandTop, bandBottom, W);
    drawTitle(ctx, state.title, W, H, titleInfo);
    drawScript(ctx, state.script, titleInfo, W, H, {
      inBand: true, centerX: W * 0.53, widthCap: W * 0.45, furnitureTop: bandBottom,
    });
    if (furniture.seal) drawSeal(ctx, W, H, { cx: W * 0.075, cy: (bandTop + bandBottom) / 2, r: H * 0.05 });
    if (furniture.vol) drawPill(ctx, 'VOL. 06', W * 0.985, bandTop + H * 0.015, pillH, true, true);
    if (furniture.ribbon) drawRibbon(ctx, heroCenterX, W, H, { centerX: W * 0.88, y: bandBottom - H * 0.04 });
    if (furniture.heat) drawPill(ctx, 'HEAT ★★★★★', W * 0.985, H * 0.02, pillH, false, true);
    if (furniture.quote) drawQuote(ctx, state.quote, state.quotePaper, W, H);
  } else {
    drawTitle(ctx, state.title, W, H, titleInfo);
    drawScript(ctx, state.script, titleInfo, W, H, { furnitureTop: H * 0.905 });
    if (furniture.ribbon) drawRibbon(ctx, heroCenterX, W, H);
    if (furniture.seal) drawSeal(ctx, W, H);
    if (furniture.quote) drawQuote(ctx, state.quote, state.quotePaper, W, H);
    const pillY = H * 0.905;
    if (furniture.vol) drawPill(ctx, 'VOL. 06', W * 0.015, pillY, pillH, true, false);
    if (furniture.heat) drawPill(ctx, 'HEAT ★★★★★', W * 0.985, pillY, pillH, false, true);
  }
  if (furniture.band) drawPalmBand(ctx, state.band, furniture.credits, furniture.barcode, W, H, palmH);
  return panels;
}

/** Renders the cover at an export size and returns a PNG blob. */
export function exportCoverPNG(state, images, uploads, sizeId) {
  const size = EXPORT_SIZES.find((s) => s.id === sizeId) || EXPORT_SIZES[0];
  const canvas = document.createElement('canvas');
  canvas.width = size.w;
  canvas.height = size.h;
  renderCover(canvas, state, images, uploads);
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
}

/** Loads the app's fonts before the first paint, so the canvas uses the real faces. */
export async function loadCoverFonts() {
  try {
    await Promise.all([
      document.fonts.load('900 100px "Passion One"'),
      document.fonts.load('400 100px "Anton"'),
      document.fonts.load('400 100px "Yellowtail"'),
      document.fonts.load('700 100px "Barlow Condensed"'),
      document.fonts.load('800 100px "Barlow Condensed"'),
    ]);
    await document.fonts.ready;
  } catch {
    // Fallbacks in the font stacks still draw.
  }
}
