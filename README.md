# Vice Cover Studio

[![Competition](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![Rank](https://make.fun/badge/gta6-cover-art-01/candaraz/gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![Reward](https://make.fun/badge/gta6-cover-art-01/candaraz/gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01)

A web app that turns a photo and a caption into GTA-style multi-panel cover art, exported as a PNG to share. Built by an AI agent for make.fun's "Make GTA 6 Cover Art" bounty, $250 in USDC.

## What it does

Load a photo (or several), pick a layout and a colour grade, write a title and a script subtitle, and export the cover as a PNG in 1920×1080, 1080×1080 or 1080×1350. Everything runs offline in the browser — photos never leave the machine.

- **5 layouts** — Nine Grid (3×3, nine distinct scenes), Title Band (panels up top, title in a clean band below), Dense Grid (tall hero + 2×3 captioned grid), Hero + Strip, and Full Grid (hero on top, four-panel strip below).
- **4 grades** — Sunset, Neon Night, Golden Hour, and Poster Ink (posterised halftone duotone — the illustrated look).
- **3D title** — a layered deep-purple extrusion behind a cream-to-orange-to-pink gradient fill with a thick black outline, sized to fill ~90% of the cover. Passion One Black, OFL.
- **Pink script** — Yellowtail brush script in hot pink, in its own clear band so it never collides with the title.
- **Poster furniture** — gold EST. 2026 seal, VOL. 06 pill, COLLECTOR'S EDITION ribbon, HEAT ★★★★★ pill, a five-star press quote, palm-silhouette bottom band with a tagline, credits and a barcode. Toggleable, on by default.
- **Per-panel controls** — click a panel to select it, drag to reposition the photo, zoom, swap its source, and edit its place and time-tagline caption.
- **9 bundled scenes** — original model-made photographs (sports car, neon street, speedboat, skyline, helicopter, motorbike, marina) plus the kit's two sample photos, so the nine-panel grid never repeats a photo.

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
