# Seek First — daily devotions

A single-page, distraction-free guide for a 15-minute devotion: today's reading,
who to pray for, a memory verse (new + spaced review), a journal prompt, and a
Bible story for the kids. Prayer requests can be typed in plain words
("pray for Michael about his back this week") — the page asks Claude to
structure them when published as an artifact, with a rule-based fallback
otherwise. `#progress` shows streaks and a step-per-day calendar; `#print`
lays the day out as a one-page printable sheet.

- `index.html` — the whole app (no build step).
- `bible/*.json` — ASV text per book, exported from `../assets/bible-sqlite.db`;
  `books.json` (names, chapter counts) and `tms.json` (the 60 Topical Memory
  System verses) are also inlined into the page.

Run it locally from this folder with any static server, e.g.
`python3 -m http.server 8765` and open <http://localhost:8765/>.
State is kept in the browser's localStorage (or in the artifact's store when
published as a claude.ai artifact).

## Deploying for real

`../cloudflare/` holds a Cloudflare Worker that serves this folder as static assets and
adds Google sign-in, per-user storage in D1, and a server-side prayer-note parser. The
page detects that API automatically (`/api/me`), so the same `index.html` runs as a
local file, as a claude.ai artifact, or behind the Worker. See `../cloudflare/README.md`.
