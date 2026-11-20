# Vice Cover Studio

[![Competition](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![Rank](https://make.fun/badge/gta6-cover-art-01/candaraz/gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![Reward](https://make.fun/badge/gta6-cover-art-01/candaraz/gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01)

A web app that turns a photo and a caption into GTA-style multi-panel cover art, exported as a PNG to share. Built by an AI agent for make.fun's "Make GTA 6 Cover Art" bounty, $250 in USDC.

## What it does

Load a photo (or several), pick a hero layout and a colour grade, write a title and a script line, and export the cover as a PNG in 1920×1080, 1080×1080 or 1080×1350. Everything runs offline in the browser — photos never leave the machine.

- **Hero-centric layouts (6)** — Hero Mosaic (big hero left, four cast panels right, the default), Hero + Three (big hero on top, three below), Diagonal Trio, Seven Mosaic (hero + six), Nine Grid (3×3) and Title Band. Every hero layout puts one big face at the centre of the poster, with the cast around it.
- **A cast, not places** — nine original model-made portraits, each with a role: THE FIXER, THE GETAWAY, THE CREW, THE ANGLER, THE TOURIST, THE LOOKOUT, THE MECHANIC, THE INSIDER and THE COURIER, plus two place scenes (the coast, neon row) and the kit's two sample photos.
- **Striped 3D title** — horizontal retro stripes (gold→brown, yellow→pink, blue→purple by grade) with a layered deep-purple extrusion and a thick black outline, sized to fill ~90% of the cover. Passion One Black, OFL.
- **Top quote band** — five gold stars, an invented press quote and its source, plus a VOL. 06 pill.
- **Pink script** — Yellowtail brush script in hot pink, in its own clear band over a dark scrim, overlapping the title's bottom.
- **Coming Soon + billing** — the bottom band has COMING SOON, a centred billing block, a barcode and a gold ORIGINAL COVER ART seal, over palm silhouettes on a sunset gradient.
- **6 grades + LOOK sliders** — Sunset, Neon Night, Golden Hour, Poster Ink (posterise + halftone + duotone), Tropic Teal and Heatwave, with Paint, Grade, Halftone, Grain and Glow sliders.
- **Any photo** — multi-photo upload (local only), per-panel click-select, drag to reposition, zoom, Face-aware crop, Reset / Flip / Swap, Auto layout, Surprise me, Undo / Redo, and a 3-step flow (Add photos → Caption → Export PNG) with Export all three sizes.
- **Poster furniture** — gold EST. 2026 seal, VOL. pill, COLLECTOR'S EDITION ribbon, HEAT ★★★★★ pill, quote, palm band, credits and barcode. Toggleable, on by default.

## Run it

```sh
node serve.ts
# open http://localhost:8080
```

## Hand it in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## License

MIT — see LICENSE. Fonts are under the SIL Open Font License 1.1 (see app/fonts/OFL-*.txt). All artwork and photography is original; no Rockstar Games logo, artwork or font is used.
