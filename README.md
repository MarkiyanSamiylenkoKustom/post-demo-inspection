# Kustom Field Documentation Tools

Eight self-contained HTML pages (hub + 7 forms) for Kustom US field documentation,
served from GitHub Pages. Techs fill forms on their phones; each form builds a
DASH-ready note. Everything works offline via a service worker.

## Layout
- `*.html`, `sw.js`, `manifest.webmanifest`, icons — **built output**, what Pages serves. Do not hand-edit pages that contain generated blocks; edit `src/` and rebuild.
- `src/pages/*.html` — page sources with `{{BLOCK:...}}` placeholders
- `src/blocks/` — shared blocks: `top_controls`, `field_comfort`, `egg_generic` (+ bespoke eggs for hub/index/wpu)
- `src/assets/sprites.json` — base64 characters, the shared van, disco-ball frames
- `pages.json` — footer version per page + easter-egg parameters
- `qa/master.test.js` — full jsdom functional sweep
- `docs/` — project handoff + trilingual how-to for the department

## Workflow
```bash
npm install            # once (jsdom for QA)
# edit src/... and/or pages.json (bump the page version on every change!)
python3 build.py       # rebuild pages in the repo root
node qa/master.test.js # must be green
git commit -am "..."
git push               # Pages redeploys; techs hard-refresh
```
CI (`.github/workflows/ci.yml`) rebuilds and runs QA on every push — a broken
or drifted build fails before it reaches Pages.

Changing a shared block once now changes it on every page at the next build.
Bumping: page footer version lives in the page source AND `pages.json` (build
asserts they match); bump the `sw.js` cache name on any deploy.

## Adopting into the existing Pages repo
```bash
git clone <your-pages-repo> && cd <repo>
# copy the CONTENTS of this folder over the repo root (replaces the 12 files, adds src/, qa/, etc.)
git add -A && git commit -m "v82: introduce source tree, build step, CI"
git push
```
Built pages in this commit are byte-identical to the deployed v82 — techs see no change.

## Rules that must survive any refactor
Self-contained pages (base64 only) · DASH note always English · COPY_MODE raw ·
Send gated on Job ID + Customer · version bump on every change · QA before push.
See `docs/PROJECT_HANDOFF_v82.md` for the full map and the QA gotchas list.
