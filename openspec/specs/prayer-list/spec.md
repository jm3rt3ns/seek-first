# prayer-list Specification

## Purpose

Whom to pray for today. The reader keeps one list of people and needs; the app brings
back a handful each day — the ones longest unprayed-for first — so nobody is
quietly dropped and no day turns into a backlog.

## Requirements

### Requirement: A Prayer Request Record

A request SHALL carry: an id, `who` (required), `what` (optional), a category from
Family, Friends, Church, World, Me, a `daily` flag, an optional `until` date
(`YYYY-MM-DD`), the date added, the date last prayed, a count of times prayed, and
`answered` / `ended` dates. A request is active while it is neither answered nor
ended.

#### Scenario: Adding a request with no name

- **WHEN** an add is attempted with an empty `who`
- **THEN** nothing is added

### Requirement: Daily Rotation

The day's list SHALL be every active request marked `daily`, plus up to
`prayer.perDay` more (default 4, configurable) chosen least-recently-prayed first,
breaking ties by the date added. The selection SHALL be fixed for the day once made,
SHALL drop ids that are no longer active, and SHALL only be re-picked when it is
empty.

#### Scenario: A neglected request

- **WHEN** one active request has never been prayed for and others were prayed for
  yesterday
- **THEN** the neglected one is in today's list

#### Scenario: Marking prayed does not reshuffle today

- **WHEN** the reader marks everyone in today's list prayed
- **THEN** the same list stays on the page for the rest of the day

### Requirement: Marking Prayed Is Reversible

"Prayed" SHALL stamp today onto the request, increment its count, and count toward
the day's prayed total. The button SHALL then offer "Undo", restoring the previous
last-prayed date. Requests prayed for today SHALL be visibly marked.

#### Scenario: Undo after marking prayed

- **WHEN** the reader undoes a "Prayed"
- **THEN** the request's last-prayed date returns to what it was before

### Requirement: Answered and Expiring Requests

A request SHALL be markable answered from the day's list and from Manage, which
retires it from the rotation while keeping it in the answered list, where it can be
reopened or deleted for good. A request whose `until` date has passed SHALL be ended
automatically at the start of the day.

#### Scenario: A request for this week

- **WHEN** a request was added with "this week" and seven days pass
- **THEN** it stops appearing in the rotation without the reader doing anything

### Requirement: Plain-Language Capture

The Pray step SHALL accept a request in plain words ("pray for Michael about his back
this week") and turn it into structured requests. When the page runs as a published
artifact with sampling granted, it SHALL ask Claude for a JSON list of actions
(`add`, `answered`, `remove`) and a short reply; otherwise, or on any failure or
malformed response, it SHALL fall back to a rule-based parse of the same sentence.
The reader's text SHALL be passed as delimited data, never as instructions, and the
model's output SHALL only ever result in those three action shapes.

#### Scenario: Sampling is unavailable

- **WHEN** the page is served as a plain static site
- **THEN** the same box still works, parsing who, what, category, "daily", and a
  duration into a request

#### Scenario: A note the parser cannot use

- **WHEN** nothing can be made of the text
- **THEN** the app says so and suggests the shape of a request, changing nothing

#### Scenario: Reporting an answer

- **WHEN** the reader writes that an existing request was answered
- **THEN** that request is marked answered rather than added again

### Requirement: Every Chat Action Is Undoable

Each action taken from the chat SHALL be reported as its own line with an inline
"undo" that reverses exactly that action — removing an added request, or restoring
the previous answered/ended state.

#### Scenario: Wrong person marked answered

- **WHEN** the reader taps "undo" on an "Marked answered" line
- **THEN** that request is active again with its previous state

### Requirement: Form and Manage Editing

A form SHALL remain available for adding a request field by field (who, what,
category, daily), and Manage SHALL list active requests with controls to toggle
daily, edit who/what, mark answered, or remove, plus the answered-and-past list and
the rotation size.

#### Scenario: Adding from the form

- **WHEN** the reader submits the form with a name
- **THEN** the request is added and, if daily or if today's list is short, joins
  today's list immediately
