// shots.js — fixed scenes for screenshots.
// ?shot=cover shows the cover alone (editor controls hidden, canvas fills
// the viewport) so the screenshot is a clean exported cover.
// ?shot=editor shows the page with the cast loaded, as a user sees it.
// window.__shotReady is set once the cover is painted.
export function runShot(shot) {
  if (shot === 'cover') document.body.classList.add('shot-cover');
  if (shot === 'editor') document.body.classList.add('shot-editor');
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}

// Resize the preview canvas to the cover's aspect for a clean shot.
export function sizePreviewForShot(shot, canvas) {
  const params = new URLSearchParams(location.search);
  const w = Number(params.get('w') || 0);
  const h = Number(params.get('h') || 0);
  if (shot === 'cover' && w > 0 && h > 0) {
    canvas.width = w;
    canvas.height = h;
  }
}
