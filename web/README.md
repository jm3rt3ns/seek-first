# Seek First — daily devotions

A single-page, distraction-free guide for a 15-minute devotion: today's reading,
who to pray for, a memory verse (new + spaced review), a journal prompt, and a
Bible story for the kids. Prayer requests are typed in plain words
("pray for Michael about his back this week") and turned into list entries on
the spot — see *Reading prayer notes* below. `#progress` shows streaks and a
step-per-day calendar; `#print` lays the day out as a one-page printable sheet.

- `index.html` — the whole app (no build step).
- `prayer-parse.test.mjs` — regression tests for the note parser, run with
  `yarn test:web` from the repository root (it lifts the marked `#region`
  blocks straight out of `index.html`, so there is nothing to keep in sync).
- `bible/*.json` — ASV text per book, exported from `../assets/bible-sqlite.db`;
  `books.json` (names, chapter counts) and `tms.json` (the 60 Topical Memory
  System verses) are also inlined into the page.

## Reading prayer notes

The chat on the Pray step turns a sentence into structured requests. Three
engines can answer, chosen under **Manage → Prayer list → Understanding what
you type**:

- **Simple rules** — the regex parser in the `prayer-parse` region. It splits a
  line into clauses ("pray for Ana and the Ortiz family" is two requests), pulls
  the person out from the need, reads time words ("this week", "until Friday",
  "for the next three weeks", "every day"), and matches good news or a removal
  against what is already on the list. No download, no network, answers in under
  a millisecond, and it is the floor under both engines below.
- **On-device model** — `Xenova/all-MiniLM-L6-v2` run in the browser by
  transformers.js from jsDelivr. It does not extract any text; it embeds the
  note and votes only where the rules had to guess: the category, whether a note
  closes an existing request rather than opening a new one, and which request it
  means. About 45 MB the first time (22 MB model, 22 MB ONNX runtime), cached in
  the browser afterwards, ~4 s to warm up and 10–30 ms per note. Nothing typed
  leaves the device. The model warms in the background when the Pray step opens;
  until it is ready the rules answer, so the chat is never slow.
- **Claude** — one sampling call, available only when the page is published as a
  claude.ai artifact. `Best available` picks this there and the on-device model
  everywhere else.

The thresholds in `brain.refine` are deliberately high: measured over a spread of
notes, the model's category vote only beat the plain default when it was clearly
confident, so below the bar it stays quiet. Every action the chat takes has an
undo beside it, and switching the setting to *Simple rules* turns the model off
entirely — no download, nothing to clear. *Forget the download* drops the cached
weights.

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
