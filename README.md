# Vice Royale — Golden Hour Cover Studio

[![Competition](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![Rank](https://make.fun/badge/gta6-cover-art-01/candaraz/gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![Reward](https://make.fun/badge/gta6-cover-art-01/candaraz/gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01)

Turn your photos into a framed crime-epic key art cover. A hero close-up,
a cast of eight around it, a striped sunset title, a gold seal, and a
billing block — exported as a PNG in three sizes. Everything runs offline
in the browser; your photos never leave your device.

## What it does

- **Hero close-up** — one large face in the middle, bigger than every other
  panel, with a face-aware crop that keeps the eyes and chin clear of the
  title.
- **10 layouts** — Hero Mosaic, Hero Left, Hero Right, Nine Grid, Diagonal
  Trio, Seven Mosaic, Pop-Out, Slanted, Title Band, Full Bleed.
- **10 grades** — Sunset, Golden, Twilight (deep violet sky + gold sun),
  Neon, Painted, Noir, Vice, Ember, Palm, Mono Gold.
- **Poster furniture** — five-star quote band, VOL. 1 box, WANTED pill,
  gold starburst seal, double gold frame with corner ornaments, COMING
  SOON, billing block, barcode.
- **Any photo** — click a panel, add your own photo, drag to reposition,
  scroll to zoom. Face-aware crop defaults to the upper third.
- **Fast export** — one click, PNG at 1920×1080, 1080×1080 or 1080×1350.
- **Auto layout / Surprise me / Undo / Redo**.

## How to run it

```sh
node serve.ts
# open http://localhost:8080
```

No build step, no network. The app is plain static files under `app/`
plus `screenshots/`; `main.ts` copies both to the output directory and
writes `dossier.json`.

## Files

- `app/index.html` — the editor page
- `app/style.css` — dark editor chrome, gold + pink accents
- `app/src/cover.js` — the cover engine: layouts, grades, panels, title,
  seal, billing, barcode, frames
- `app/src/main.js` — the editor: photo upload, panel picking, drag/zoom,
  export, undo/redo, `?shot=` modes
- `app/scenes/` — the cast: a silver-haired hero plus eight portraits
- `app/samples/` — four place photos (boulevard, neon, pier, skyline)
- `app/fonts/` — OFL fonts: Passion One, Yellowtail, Anton, Barlow
  Condensed (license texts beside them)
- `screenshots/` — the four entry screenshots (first by name is the cover)
- `shots.json` — the four screenshot scenes
- `main.ts` — the entry program (copies `app/` + `screenshots/`, writes
  the dossier)
- `serve.ts` — a tiny static server for local testing

## Screenshots

1. `1-cover.jpg` — the landscape cover (Hero Mosaic, Twilight)
2. `2-editor.jpg` — the editor with a photo loaded
3. `3-cover-square.jpg` — a square cover (Pop-Out, Sunset)
4. `4-cover-portrait.jpg` — a portrait cover (Nine Grid, Golden)

## Design notes

The cover is built to read as key art at a glance: the hero face is the
largest single element on the poster, the title is a striped sunset
gradient with a dark extrusion, and the gold frame + seal + billing give
it the finished print-poster feel. The Twilight grade (deep violet sky,
gold sun, pink neon) is the house grade — it stands apart from the usual
gold/pink sunset while staying warm.

## License

MIT. Fonts are SIL OFL 1.1 (see `app/fonts/OFL-*.txt`).
