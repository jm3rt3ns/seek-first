# Seek First — the app

A single static page. No server, no account, no network calls except the two font files
and (only if you ask for a PDF) the jsPDF library.

- `index.html` — the whole app: the five steps, progress, the printable sheet, and Manage.
- `sw.js` — service worker: caches the app shell, and each Bible chapter the first time
  you read it, so it works on a plane.
- `assets/` — crown icon, wordmark, web manifest.
- `bible/` — public-domain text exported from `../assets/bible-sqlite.db`:
  `web/`, `asv/`, `kjv/` (one JSON file per book), plus `books.json`, `tms.json`
  (the 60 Topical Memory System verses), and `sections.json` (passage divisions).
- `_headers` — security and caching headers for Cloudflare.

## Where the data lives

`localStorage`, on the device you're using. Each device keeps its own copy; move it with
**Manage → Download backup / Restore from backup**. Clearing the browser's site data
erases it, so keep a backup.

## Reading

Three tracks, each moving one passage a day:

| Track | Default | Shown as |
|---|---|---|
| Study | 1 Corinthians | WEB / ASV / KJV, or all three verse by verse |
| Longer read | Exodus | one translation |
| Gospel | Mark | one translation |

Passages follow hand-drawn section breaks for Exodus, Matthew, Mark, Luke, John, Acts,
Romans and 1 Corinthians; other books are split into even pieces of about 14 verses.
Change the book or jump to any passage under Manage → Reading.

NLT, ESV and NET are under copyright and can't be bundled, so each passage carries
one-tap links that open it in those translations on Bible Gateway.

## Working on it

```sh
cd web && python3 -m http.server 8000     # then open http://localhost:8000
```

Regenerate the Bible data from the SQLite source with the scripts documented in the
repository root. Deployment lives in `../cloudflare/`.
