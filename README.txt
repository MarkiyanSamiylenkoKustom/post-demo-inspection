KUSTOM PDRI - Post-Demo Rebuild Inspection (PWA)
Restyled to Kustom brand · verified 62/62 functional tests · July 2026

DEPLOY (GitHub Pages)
  1. Copy these 5 files to the repo root (or /docs):
     index.html, manifest.webmanifest, sw.js, icon-192.png, icon-512.png
  2. Commit + push. Pages serves over https - the service worker
     registers automatically and the app works offline after first visit.
  3. Installed phones pick up this update automatically (cache pdri-v2).

NOTES
  - Send to DASH: 5878665@dashstart.net, subject = JobID + ":"
  - No external dependencies (fonts/logo inlined) - fully offline-capable.
