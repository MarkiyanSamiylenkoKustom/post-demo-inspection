# PROJECT HANDOFF — Kustom Field Documentation Tools
**Repo-based since v82 · sw cache `pdri-v82` · build: `python3 build.py`, QA: `node qa/master.test.js`, CI on push**
Supersedes the v62 handoff. Covers everything added in v63–v81.

## Files & footer versions (must match after deploy)
| File | Version | Purpose |
|---|---|---|
| hub.html | v19 | Landing hub, stats card, crew easter egg |
| index.html | v53 | PDRI (Post-Demo Rebuild Inspection) |
| scope-sheet.html | v26 | Initial Inspection (mitigation) |
| demo-day.html | v15 | Demo Day (mitigation) |
| moisture-check.html | v13 | Daily moisture (mitigation) |
| initial-job-walk.html | v34 | Production start |
| weekly-project-update.html | v25 | Weekly PM update |
| end-of-day.html | v7 | Rebuild crew daily wrap-up (new in v69) |
| sw.js | pdri-v82 | Caches all 8 pages + manifest + icons |
plus manifest.webmanifest, icon-192.png, icon-512.png. Deploy = drop all 12 into repo root, commit, hard refresh, verify footers.

## Hard rules (unchanged from v62, all still enforced)
Self-contained pages (base64 assets only, no external files) · DASH note always English · COPY_MODE="raw" (literal `<b>`/`<br/>` markup copied as plain text) · Send gated on Job ID + Customer Name · version bump in footer + sw on every change · jsdom QA before every package.

## Everything added since v62
**Language:** first open auto-detects device language (uk/es → that UI, else en); auto-detect never persists — only an explicit pill tap saves, and the saved choice always wins. Translation engine bug fixed in v73: replacement now always runs against the stored English original (`n.__orig`), never the current text — before that, switching es→uk left labels stuck in Spanish and produced artifacts like "Програмаа".

**Dictionaries:** deduped per page in v63 (–239 KB): keys ≤30 chars always kept (safety for JS-generated strings), longer keys kept only if present outside the DICT literal.

**Silent time tracker (all forms):** accumulates active fill time (gaps >3 min ignored), logs to `kustom_stats_v1` on Copy/Send via a wrapper around `histAdd`. Copy+Send on the same note within 10 min = one entry. Hub shows a stats card (total notes, avg minutes of entries ≥30 s, this-week count); hidden until the first note. Purpose: before/after numbers for Marko's interview case study.

**Recent jobs (all forms):** every copied note stores {job, customer} in `kustom_jobs_v1` (cap 5, dedup). Any form shows up to 3 chips under Job ID; one tap fills both fields and rebuilds the note.

**End of Day Report (end-of-day.html):** built in v69 from the moisture donor. Designed for "no typing on a normal day": recent-job chip, tech names remembered in `kustom_tech_v1`, date=today, 19 multi-select trade tiles (order of tapping = bullet order), Progress pills, Issues/Materials default None with Yes→textarea, Photos Uploaded (No→outstanding textarea), Returning Tomorrow, "Other" tile reveals a detail field whose lines become `- Other - …` bullets. Note title: red **JOB UPDATE**; subject `JOBID: End of Day Report`.

**PDRI form changes (field feedback):** cost chips now $0-10K…$150K+; Insulation Yes → location chips (Wall/Ceiling/Attic/Crawl space) each revealing a type pill row (Batt/Blown-in/Spray foam/Rigid board/Unknown), note prints `Insulation is affected: wall insulation (batt), …`; cabBlock now opens directly under Q14 (was after Q15); room-card textareas min-height 76 px (two visible lines — selector is `.room-card .room-grid textarea`, NOT `.mi-grow`).

**Desktop layout fix (v79):** `.wrap` is a 2-column grid at ≥980px and must have EXACTLY two children: `.form-col` + `.preview-col`. scope-sheet shipped (since before v62) with a stray `</div>` that spilled 5 blocks into the grid and pushed the preview out; fixed, Photos Uploaded moved inside the Documentation card. Invariant is QA-checked on all forms now.

**Top controls (all forms, v80):** small "Reset Form" pill top-right of form-col (proxies #resetBtn incl. its confirm), floating ↑ button (appears >400 px scroll, smooth-scrolls to top; above the mobile bar on phones).

**Field comfort (all forms, v81):** "Now" buttons beside every `input[type=time]` (scope/demo/moisture) stamping HH:MM; Job ID auto-format (digits `250433091` → `25-04-33091`, never fights deletions, ignores non-numeric formats); after a blocked Send the page smooth-scrolls to the first `.invalid` field.

**Easter eggs — on all 8 pages.** Shared pattern: pixel disco ball top-right of the masthead (3 SVG rotation frames), tap → full-screen sparkles + WebAudio 8-bit disco (~6.5 s, starts from the tap so iOS allows it; silent-switch mutes it — that's OS behavior) → character pops in with an HTML pixel bubble → white KUSTOM US van drives in → character boards → van exits → clean reset, re-tappable. Unique id prefixes per page (no collisions): hub `egg*` (7 crew sprites), index `iegg*` (Matterport inspector + tripod, "Remember, continuous floors/walls/ceilings", + **Happy Inspector** button when job+cust+reconCost+cause+room name are filled), scope `segg*` ("Let's see what the meter says!", meter shows 15.4% DRY), demo `degg*` (DEMO CREW + sledgehammer, "Time to make some dust!"), moisture `megg*` (kneeling meter 28.7 HIGH, "I smell moisture!"), ijw `jegg*` (PD, "Let's build a game plan!"), wpu `regg*` (Rocio with bat, "DO YOUR STUFF OR I'LL BE MAD", + **Happy Rocio** button when job+cust+work item+schz are filled — completeness checks read the DOM directly, never the form's internal functions), eod `eegg*` (rebuild, "If it's not in DASH, did it even happen?!"). All sprites are palette PNGs with a transparency index, extracted from Marko's AI art via /tmp pipeline.

## localStorage inventory
`kustom_lang` (explicit language choice) · `kustom_stats_v1` (note stats, cap 300) · `kustom_jobs_v1` (recent jobs, cap 5) · `kustom_tech_v1` (EOD tech names) · per-form `<code>_draft_v1`, `<code>_hist_v1` (Recent Notes, cap 5), `<code>_tm_v1` (active-time accumulator). Form codes: pdri, scope, demo, moist, ijw, wpu, eod.

## Language behavior (tell the department!)
Note headings and every button-driven answer (tiles, Yes/No, pills) always come out in English regardless of UI language. **Typed free text goes into the note exactly as typed — no translation exists or is possible offline.** The how-to note (how-to-use-note.md, EN/ES/UK) includes this warning as item 6.

## QA gotchas (each one cost a debugging round — don't relearn them)
- `document.body.textContent` includes the embedded DICT with all three languages. **Never assert translation state against it** — query real elements (label/h2/button).
- The translation walker runs `querySelectorAll` INSIDE added nodes; a bare added `<button>` is invisible to the MutationObserver path. Wrap dynamically-created translatable controls in a `<span>`.
- `.wrap` must have exactly 2 children; anything appended between form-col and preview-col explodes desktop into grid cells while looking fine on mobile.
- Sprite extraction: flood-fill tolerance must be tuned per image — dark clothing on dark bg dies at tol≥20 (use 7–10 on clean AI PNGs; the PD suit and van tires both got eaten this way). Transparency is assigned by area, never by palette remap (extract_lib fix in v80). Caption text below sprites bleeds into crops — cut boxes above caption rows and use the small-island cleanup.
- Base64 payload swaps must be scoped to the egg block — a page-wide regex also hits the masthead logo.
- jsdom stubs used in QA: clipboard.writeText capture, mailto interception via HTMLAnchorElement.click, full AudioContext stub, navigator.languages override, scrollY defineProperty + scroll event.

## Open items
1. **Field adoption metrics** — stats accumulate on each device; after 1–2 weeks read the hub card and write the interview case study ("cut documentation time from X to Y min").
2. ~~Yesterday-plan carry-over~~ — SHIPPED in v82 (EOD): plan stored per job in `kustom_plan_v1`, banner offers "Add to Details" on the next report for the same job.
3. Feedback link in footers (declined once — revisit if techs report friction verbally).
4. Trilingual how-to (how-to-use-note.md) does not yet mention the End of Day Report — one paragraph to add before the next re-send.
