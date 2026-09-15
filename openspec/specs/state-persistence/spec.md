# state-persistence Specification

## Purpose

Where a reader's devotion lives: one small state object, saved in the browser by
default and in the artifact's private store when the page is published, so the same
devotion can be picked up on another device without an account.

## Requirements

### Requirement: One State Object

All app state except journal prose SHALL live in a single serializable object with a
version, a last-updated timestamp, and five parts: `plan` (id, per-track positions,
chapters per day), `prayer` (items, how many rotate in a day), `memory` (cards, the
course pointer), `kids` (position), `history` (per-day records), and `today` (the
date, the done map, the day's prayer selection, prompt shift, and counters).

#### Scenario: Inspecting state

- **WHEN** the state is serialized
- **THEN** it is plain JSON with no functions, DOM references, or journal text

### Requirement: The Browser Is the Baseline

State SHALL be written to `localStorage` under `seekfirst.state` on every save and
read back at boot, before any network work. Every `localStorage` access SHALL be
wrapped so that a browser blocking site data degrades to an in-memory session rather
than a broken page.

#### Scenario: Private window with storage blocked

- **WHEN** `localStorage` throws
- **THEN** the app still renders and works for the session

#### Scenario: Returning the next day

- **WHEN** the reader reopens the page in the same browser
- **THEN** their plan position, prayer list, memory cards, and history are as they
  left them

### Requirement: The Artifact Store When Published

When the page runs as a published artifact with a store granted, it SHALL mirror the
state to the document `seekfirst/state`, subscribe for remote updates, and write
journal entries to `journal/<date>`. Adoption SHALL be last-write-wins on
`updatedAt`: a remote copy at least as new replaces local state, a newer local copy is
pushed up, and later snapshots are adopted only when strictly newer. Writes SHALL be
debounced (about 400ms). Failure to reach the store SHALL be logged and otherwise
ignored — `localStorage` still holds the day.

#### Scenario: Opening on a second device

- **WHEN** the reader opens the same published artifact on their phone
- **THEN** the state written from their laptop is adopted and rendered

#### Scenario: Store unavailable

- **WHEN** the store cannot be reached or the page is served as a plain static site
- **THEN** the app runs on `localStorage` alone with no error shown to the reader

### Requirement: Loaded State Is Migrated Forward

State read from either source SHALL be merged onto a fresh default so keys added
since it was written are present with their defaults, and per-day fields are
reconciled against today's date before the first render.

#### Scenario: State written by an older version

- **WHEN** a stored state lacks a field added later
- **THEN** it loads with that field's default rather than throwing

#### Scenario: State from a previous day

- **WHEN** the stored `today` belongs to an earlier date
- **THEN** it is reset before rendering, leaving history and positions intact

### Requirement: No Account, No Server, No Telemetry

The app SHALL NOT require sign-in and SHALL NOT send a reader's prayer requests,
journal entries, or progress anywhere except the store described above. The only
outbound requests SHALL be for its own static assets and, where sampling is granted,
the prayer-parsing request the reader initiates.

#### Scenario: Reading the network tab

- **WHEN** a devotion is completed on the static site
- **THEN** the only requests are for the page, its fonts, and the books read
