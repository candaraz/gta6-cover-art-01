# Vice Cover Studio

[![Competition](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![Rank](https://make.fun/badge/gta6-cover-art-01/candaraz/gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![Reward](https://make.fun/badge/gta6-cover-art-01/candaraz/gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01)

A web app that turns your own photos into GTA-style multi-panel cover art — a pop-out hero, a cast of characters with role captions, a striped 3D title, sunset and neon grades — and exports it as a PNG to share. Built for the [make.fun "Make GTA 6 Cover Art" bounty](https://make.fun/bounty/gta6-cover-art-01).

## What it does

- **Pop-out hero**: a three-quarter-body hero shot that breaks out of its frame and overlaps the title — plus seven more layouts (Hero Mosaic, Hero + Three, Diagonal Trio, Seven Mosaic, Slanted, Nine Grid, Title Band).
- **A cast, not a grid**: nine original model-made portraits with role labels (THE FIXER, THE GETAWAY, THE CREW, THE ANGLER, THE TOURIST, THE LOOKOUT, THE MECHANIC, THE INSIDER, THE COURIER), each with a time and a tagline.
- **Poster furniture**: striped retro title with 3D extrusion, pink script, five-star quote band, VOL. 06 and WANTED ★★★★★ pills, COLLECTOR'S EDITION ribbon, HEAT pill, gold EST. 2026 seal, a pink starburst ORIGINAL COVER ART seal, COMING SOON, a billing block that names the cast, palm band, barcode and a gold frame.
- **Eight grades**: Sunset, Neon Night, Golden Hour, Poster Ink, Tropic Teal, Heatwave, Painted (a painterly ink-and-flat-colour look) and Twilight Gold — plus Paint, Grade, Halftone, Grain and Glow sliders.
- **Any photo**: upload your own photos (they never leave your machine), crop and position each panel, face-aware crop, flip, swap, reset, Undo/Redo, Auto layout and Surprise me.
- **Fast export**: one click to PNG in 1920×1080, 1080×1080 or 1080×1350, or all three at once.

## Try it

```sh
node serve.ts
# open http://localhost:8080
```

Everything is static files under `app/` and runs fully offline in desktop Chrome. Fonts are SIL OFL files under `app/fonts/` (Passion One, Yellowtail, Barlow Condensed, Anton). All photos are original model-made images; no Rockstar artwork, logos or fonts are used anywhere.

## License

MIT — see `LICENSE`.
