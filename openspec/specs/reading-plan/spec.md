# reading-plan Specification

## Purpose

What to read today. A plan is an ordered list of chapters the reader walks through at
their own pace; there is no schedule to fall behind, only a position that moves when
the reader actually reads.

## Requirements

### Requirement: Six Reading Plans

The app SHALL offer these plans: New Testament a chapter a day (`nt`, the default),
Gospels & Acts (`gospels`), Psalms & Proverbs (`psalms`), a balanced
Old Testament + New Testament + a Psalm (`balanced`), Old Testament (`ot`), and the
whole Bible in order (`whole`). A plan SHALL be made of one or more tracks; each track
expands at load into its full ordered `[book, chapter]` list from the book metadata.

#### Scenario: Balanced plan composition

- **WHEN** the balanced plan is selected
- **THEN** it has three tracks — Old Testament (books 1–39 excluding Psalms),
  New Testament (books 40–66), and Psalms — each with its own position

### Requirement: One Day's Reading

`todaysReading()` SHALL return the segments for today: for a single-track plan, the
next `plan.perDay` chapters from that track's position; for a multi-track plan,
exactly one chapter from each track. Positions SHALL wrap to the start of the track
when the end is reached, so a plan never runs out.

#### Scenario: Two chapters a day on a single-track plan

- **WHEN** the New Testament plan is set to 2 chapters a day at Matthew 1
- **THEN** today's reading is Matthew 1–2

#### Scenario: Pace on a multi-track plan

- **WHEN** the balanced plan is selected
- **THEN** the pace control is disabled and the day is one chapter from each of the
  three tracks

#### Scenario: Finishing a track

- **WHEN** a track's position passes its last chapter
- **THEN** it wraps to the first chapter of that track

### Requirement: The Plan Advances Only When Read Is Marked Done

Plan positions SHALL advance by exactly the number of chapters shown, and only when
the reader marks the Read step done. There SHALL be no catch-up, no missed-day debt,
and no advancement on a day the reader skips.

#### Scenario: Skipping several days

- **WHEN** the reader does not open the app for a week and then returns
- **THEN** today's reading is the same chapter that was next a week ago

### Requirement: Readable Reference Labels

Reference labels SHALL group consecutive whole chapters of the same book into a
range with an en dash ("Matthew 5–7") and join separate segments with " · ". The
book named "Psalms" SHALL be rendered "Psalm" when cited with a chapter.

#### Scenario: Balanced plan label

- **WHEN** today's reading is Genesis 4, Matthew 3, and Psalm 12
- **THEN** the heading reads "Genesis 4 · Matthew 3 · Psalm 12"

### Requirement: Plan and Position Are Editable

The Manage view SHALL let the reader change the plan, change the pace (1–3 chapters a
day, only for single-track plans), and set the next chapter for each track directly.
Changing the plan SHALL reset that plan's positions to the start of each track.

#### Scenario: Jumping to a chapter

- **WHEN** the reader picks "John 1" as the next chapter
- **THEN** today's reading becomes John 1 and the plan continues from there

#### Scenario: Progress reporting

- **WHEN** the progress view is opened
- **THEN** each track shows chapters read of total, a bar, and how many days remain at
  the current pace
