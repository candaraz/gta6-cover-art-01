# Vice Cover Studio

[![gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/candaraz/gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/candaraz/gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01)

Turn your photo into a Vice-style poster cover — multi-panel layouts, bold gradient
lettering, sunset and neon grades — and export it as a PNG in 1080 × 1080, 1080 × 1350
or 1920 × 1080.

Built for the [gta6-cover-art-01](https://make.fun/bounty/gta6-cover-art-01) bounty on
[make.fun](https://make.fun).

## How it works

1. **Photo** — add your own photos (they never leave your machine) or use a bundled scene.
2. **Layout** — pick one of five poster layouts and one of four colour grades.
3. **Words** — edit the title, script line, press quote and bottom band; toggle the
   poster furniture (gold seal, VOL. 06 pill, ribbon, HEAT pill, palm band, credits, barcode).
4. **Export** — one click saves the cover as a PNG in your chosen size.

Click any panel to select it, drag to reposition its photo, scroll to zoom, and set its
caption and source individually.

## Run it

```sh
node serve.ts
# open http://localhost:8080
```

The app is plain static files under `app/` with no build step and no network request:
every font, scene and script is a file under `app/`. Fonts are SIL Open Font License
(Passion One Black for the title, Yellowtail for the script, Barlow Condensed for
labels, Anton as a fallback). All art is original — no Rockstar logo, artwork or font.

## Entry

`main.ts` copies `app/` and `screenshots/` to `/output` and writes
`/output/dossier.json` with the vendored make.fun library:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```
