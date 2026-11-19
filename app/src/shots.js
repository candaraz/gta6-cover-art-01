// Fixed scenes for screenshots: ?shot=cover shows the cover alone at its export size;
// ?shot=editor shows the editor with a photo loaded. window.__shotReady is set once painted.

/** Applies a shot scene. `api` is the editor's { state, sceneImages, uploads, canvas, setPhoto, redraw, ready }. */
export async function runShot(shot, query, api) {
  const { state, sceneImages, uploads, canvas } = api;
  const photo = query.get('photo') || 'boulevard';
  const layout = query.get('layout') || 'hero-strip';
  const grade = query.get('grade') || 'sunset';
  const size = query.get('size') || '1920x1080';
  const title = query.get('title') || 'VICE ROYALE';
  const script = query.get('script') || 'chasing the last light';

  state.layout = layout;
  state.grade = grade;
  state.size = size;
  state.title = title;
  state.script = script;
  if (query.get('quote')) state.quote = query.get('quote');
  if (query.get('band')) state.band = query.get('band');
  // A fresh panel set for the shot's layout, hero first.
  const { defaultPanels, layoutPanels, SCENES } = await import('./cover.js');
  state.panels = defaultPanels(layout);

  // The shot's hero photo: the named scene, loaded as the hero upload, and the hero
  // panel's caption follows the photo (not the panel slot's old caption).
  if (sceneImages[photo]) {
    api.setPhoto(sceneImages[photo]);
    const [w, h] = size.split('x').map(Number);
    const heroIdx = layoutPanels(layout, w, h).findIndex((p) => p.hero);
    const scene = SCENES.find((s) => s.id === photo);
    if (heroIdx >= 0 && scene) state.panels[heroIdx].caption = scene.caption;
    // No panel repeats the hero photo while a spare scene is unused.
    state.panels.forEach((p, i) => {
      if (i !== heroIdx && p.source === photo) {
        const spare = SCENES.find((s) => s.id !== photo && !state.panels.some((q) => q.source === s.id));
        if (spare) {
          p.source = spare.id;
          p.caption = spare.caption;
        }
      }
    });
  }

  if (shot === 'cover') {
    document.body.classList.add('shot-cover');
    const [w, h] = size.split('x').map(Number);
    canvas.width = w;
    canvas.height = h;
  }
  api.redraw();
  // Two frames so the canvas paint lands before the screenshot.
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  api.ready();
}
