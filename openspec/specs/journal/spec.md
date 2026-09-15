# journal Specification

## Purpose

A few honest lines a day, against a prompt the reader does not have to invent —
saved as they type, kept apart from the rest of the app's state, and readable later.

## Requirements

### Requirement: A Prompt a Day

The journal step SHALL show one prompt from the fixed list of 36, chosen by the day
number so the same prompt appears for the whole day and the list rotates over about
five weeks. The step's eyebrow SHALL name today's reading, so the prompt sits next to
what was read. A "Different prompt" control SHALL move to the next prompt for today
only.

#### Scenario: Reopening the step later the same day

- **WHEN** the reader leaves and returns to the journal step
- **THEN** the same prompt is shown, including one chosen with "Different prompt"

#### Scenario: A new day

- **WHEN** the date changes
- **THEN** the prompt moves on and any prompt shift is cleared

### Requirement: Entries Autosave

The entry SHALL save about 700ms after typing stops, keyed by the day, showing a
brief saved indicator, and SHALL be reloaded when the step is reopened. The reader
SHALL never have to press a save button, and an entry SHALL NOT be lost by navigating
between steps.

#### Scenario: Typing and navigating away

- **WHEN** the reader writes a few lines and taps to another step
- **THEN** the text is saved and comes back when they return

#### Scenario: Save fails

- **WHEN** the entry cannot be written
- **THEN** the indicator says so rather than silently losing the text

### Requirement: Entries Are Stored Apart From App State

Journal text SHALL be stored one document per day, separate from the main state
object: `journal/<date>` in the artifact store when present, or
`seekfirst.journal.<date>` in `localStorage`. The main state SHALL never carry entry
text.

#### Scenario: Syncing state

- **WHEN** the app state is written to the store
- **THEN** it contains no journal prose

### Requirement: Past Entries Are Readable

Manage SHALL list past entries newest first — up to 90 from the artifact store, or
every entry found in `localStorage` — each collapsed to its date and first line, and
expandable to the full text with its line breaks kept.

#### Scenario: Looking back

- **WHEN** the reader opens Manage
- **THEN** past entries are listed, and an empty list says so plainly
