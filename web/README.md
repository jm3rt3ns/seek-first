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

## Deploying to Cloudflare

`wrangler.jsonc` deploys this folder as a Workers static-assets site — there is
no Worker script and no build step, so the `assets` block is the whole config.
`.assetsignore` keeps the config, this README, and Wrangler's own `.wrangler/`
scratch output from being served as public files.

    npx wrangler deploy

In the Cloudflare dashboard the build settings for this project are:

- **Root directory** — `/web/`
- **Deploy command** — `npx wrangler deploy`

Note that `name` in `wrangler.jsonc` must match the Worker you created, or the
deploy will create a second Worker alongside it.

Cloudflare installs dependencies from the *repository root* before running the
deploy command, even when the root directory is set to `/web/`. The root is the
Expo app, whose `yarn.lock` is a Yarn 1 lockfile; the build image's Corepack
shim defaults to Yarn 4, which would migrate the lockfile and then fail the
immutable install with `YN0028`. The root `package.json` therefore pins
`"packageManager": "yarn@1.22.22"` so that install stays on Yarn 1 and is a
no-op for this static site. Nothing here depends on those packages.
