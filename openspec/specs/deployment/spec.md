# deployment Specification

## Purpose

How the app reaches a reader: a static site on Cloudflare Workers assets, deployed
straight from `web/` with no build step, from a repository whose root is an unrelated
Expo project.

## Requirements

### Requirement: Cloudflare Workers Static Assets

`web/` SHALL deploy as a Workers static-assets site configured entirely by
`web/wrangler.jsonc` — a Worker name, a compatibility date, and an `assets`
directory of `.`. There SHALL be no Worker script and no build step, so
`npx wrangler deploy` from `web/` is the whole deploy. The configured Worker name
SHALL match the existing Worker, or the deploy creates a second one alongside it.

#### Scenario: Deploying

- **WHEN** `npx wrangler deploy` is run in `web/`
- **THEN** `index.html` and `bible/*.json` are published as static assets

#### Scenario: Dashboard build settings

- **WHEN** the Cloudflare project is configured
- **THEN** its root directory is `/web/` and its deploy command is `npx wrangler deploy`

### Requirement: Deploy Files Are Not Served

`web/.assetsignore` SHALL keep the deploy's own files out of the published site:
`wrangler.jsonc`, `.assetsignore`, `README.md`, `.wrangler`, and `node_modules`.

#### Scenario: Fetching a config file

- **WHEN** a visitor requests `/wrangler.jsonc`
- **THEN** it is not served

### Requirement: The Root Install Must Stay on Yarn 1

Cloudflare installs dependencies from the repository root before running the deploy
command, even with the root directory set to `/web/`. The root `package.json` SHALL
therefore pin `"packageManager": "yarn@1.22.22"`, so the build image's Corepack shim
does not run Yarn 4 against the repository's Yarn 1 lockfile, migrate it, and fail
the immutable install with `YN0028`. The static site depends on none of those
packages.

#### Scenario: A deploy from a clean build image

- **WHEN** Cloudflare runs its install at the repository root
- **THEN** it uses Yarn 1, succeeds, and is a no-op for the site

### Requirement: Serving Locally Needs Nothing

The site SHALL run from any static file server pointed at `web/`, for example
`python3 -m http.server`, with no install, build, or environment configuration.

#### Scenario: Checking a change locally

- **WHEN** a developer edits `web/index.html` and reloads
- **THEN** the change is live, with state kept in that browser's `localStorage`
