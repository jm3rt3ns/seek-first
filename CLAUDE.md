# Seek First

A distraction-free daily devotions guide: about fifteen minutes of reading, prayer,
scripture memory, journaling, and a Bible story for the kids.

**The behavioral spec lives in `openspec/specs/`** — twelve capabilities, one
directory each. Read the relevant one before changing behavior, and update it in the
same change. `openspec/config.yaml` holds the project context OpenSpec shows to
agents.

## Two apps in one repository

| | what it is | status |
|---|---|---|
| `web/` | the devotions app — one static `index.html` + `bible/*.json` | shipped, deployed to Cloudflare |
| repo root | an Expo / React Native prototype for choosing a passage to memorize | unfinished, not deployed, no shared code |

Unless the request is explicitly about the mobile prototype, "the app" means
`web/index.html`. They share nothing but the repository and `assets/bible-sqlite.db`.

## web/ — the app that ships

One file. Markup, CSS, and vanilla JS all live in `web/index.html` (~1100 lines).
No build step, no framework, no dependencies, no `npm install`. Edit the file, reload.

```
web/index.html      the whole app
web/bible/N.json    ASV text, one file per book (1–66): [chapter][verse] strings
web/bible/books.json, tms.json   also inlined into index.html as <script type="application/json">
web/wrangler.jsonc  Cloudflare Workers static-assets config (no Worker script)
```

Run it: `cd web && python3 -m http.server 8765`, then <http://localhost:8765/>.
Deploy it: `cd web && npx wrangler deploy`.

### How the code is organized

`index.html` reads top to bottom as: `<style>` → inlined JSON data → static content
(`PLANS`, `PROMPTS`, `STORIES`, `STEPS`) → date helpers → state + `store` →
bible loading and `parseRef` → per-feature logic → `render*` functions → `boot()`.

- **State** is one object `S` (see `defaultState()`), saved by `store.save()`, which
  folds today into `history`, stamps `updatedAt`, writes `localStorage`, and debounces
  a write to the artifact store when one is granted.
- **Rendering** is a full redraw: mutate `S` → `store.save()` → `render()`. Elements
  are built with the `h(tag, attrs, ...children)` helper. Transient view state is
  deliberately lost on redraw; the prayer chat input is the one thing restored.
- **Routing** is `location.hash`: `today` (default), `progress`, `print`, `manage`.
- **Journal text is not in `S`** — it is one document per day (`journal/<date>` or
  `seekfirst.journal.<date>`), loaded and saved on its own.

### Conventions worth keeping

- No dependencies, no bundler, no `innerHTML` with untrusted text (use `h()` or
  `esc()`). The only external resources are the two Google fonts.
- Wrap every `localStorage` access in try/catch — a blocked store must degrade to an
  in-memory session, never a broken page.
- Theme: full light palette on bare `:root`, dark redefined under both
  `@media (prefers-color-scheme: dark)` (guarded `:root:not([data-theme="light"])`)
  and `:root[data-theme="dark"]`. Never define a color only inside a media block.
- Phone first: 620px column, safe-area insets, 44px touch targets, 16px inputs, rows
  stack below 560px, nothing scrolls the page sideways.
- Dates are local-time `YYYY-MM-DD` strings via `dayKey()`; all date math goes through
  `addDays` / `daysBetween`, never raw `Date` arithmetic.
- Bible text is the public-domain ASV, exported from `assets/bible-sqlite.db`
  (table `t_asv`, ids `BBCCCVVV`). Keep the per-book JSON shape if you regenerate it.

### The tone rules are product requirements

The reader is never nagged, never behind, and never asked to catch up. A missed day
leaves the plan where it was. Steps can be done in any order and undone. Nothing
blocks on the network or on a model being available — the prayer-capture box falls
back to a rule-based parse whenever sampling is not granted. Don't add streaks-based
pressure, badges beyond the existing milestones, or anything that shames a gap.

### AI in the page

The Pray step can ask Claude to turn a plain sentence into structured requests, but
only when the page runs as a published artifact with sampling granted
(`window.claude.use('sample')`). The reader's text is passed as delimited data, and
the only things the model's reply can cause are `add` / `answered` / `remove`, each
undoable. Every path must still work with the fallback parser.

## Repo root — the Expo prototype

Expo 47 / React Native 0.70 / TypeScript, Redux Toolkit (`planSlice.ts`, `store.ts`),
React Navigation, `expo-sqlite` reading `assets/bible-sqlite.db`. Screens: Home →
Select Book → Select Chapter → Select Start Verse. `yarn test` runs `jest-expo`
against `App.test.tsx`.

Known rough edges, in case you touch it: `App.test.tsx` has an `it.only`, so most of
its cases don't run; `planSlice.setEndVerse` writes to `startVerse` and
`setReviewDay` writes to `startDate`; no reducer ever sets
`PlanSelectionStatus.ChoosingStartVerse`. It has no spec in
`openspec/` — it is a prototype, not shipped behavior.

## Working here

- Root `package.json` pins `"packageManager": "yarn@1.22.22"`. Don't remove it:
  Cloudflare installs from the repo root before deploying `web/`, and Corepack's Yarn
  4 default would migrate the Yarn 1 lockfile and fail the build with `YN0028`.
- There are no tests for `web/`; verify changes by loading the page and walking the
  five steps, including at phone width and in dark mode.
- 4.2MB of `bible/*.json` is committed on purpose — it is the app's data, not build
  output.
