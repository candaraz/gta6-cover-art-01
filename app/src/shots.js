// shots.js — fixed scenes for screenshots.
// ?shot=cover shows the cover alone, full frame; ?shot=editor shows the
// editor with a photo loaded. `photo` picks a scene file, `caption` the
// title. window.__shotReady is set once the cover is painted, so a
// headless browser knows when to take the screenshot.

export async function runShot(shot, query, load) {
  if (shot === 'cover') document.body.classList.add('shot-cover');
  const photo = query.get('photo') || 'samples/pier.jpg';
  const caption = query.get('caption') || 'VICE ROYALE';
  await load(photo, caption);
  // Two frames so the canvas paint and the font swap have settled.
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  window.__shotReady = true;
}
