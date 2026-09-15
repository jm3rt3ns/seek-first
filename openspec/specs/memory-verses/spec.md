# memory-verses Specification

## Purpose

Learning scripture by heart: one new verse at a time from a 60-verse course patterned
after the Navigators' Topical Memory System, then spaced review so the verses already
learned keep coming back.

## Requirements

### Requirement: Sixty Verses in Five Series

The course SHALL be the 60 ASV verses of `tms.json`, ordered, each with a series
(A–E), a topic, a reference, and its text. The list is content, not state: a card in
the reader's state references a verse by its index.

#### Scenario: Course composition

- **WHEN** the memory view is opened
- **THEN** the verses are grouped under their five series in course order

### Requirement: One Verse Is Being Learned at a Time

Whenever no card has status `learning`, the app SHALL start the next unstarted course
verse as a learning card. A learning card SHALL show its series, topic, reference,
and text, with a control to blur the text for reciting and a control to record one
recitation, countable once per day.

#### Scenario: Reciting twice in a day

- **WHEN** the reader records a recitation and taps again the same day
- **THEN** the count stays where it is and the button reads as already recited today

#### Scenario: The course is finished

- **WHEN** all 60 verses have been started
- **THEN** the step says so and points to adding the reader's own verses

### Requirement: Promotion to Review Starts the Next Verse

"I know it — move to review" SHALL move the learning card to `review`, due in two
days, which leaves no card learning and so starts the next course verse on the next
render. A verse the reader already knows SHALL be markable straight into review from
Manage, due tomorrow, without becoming the learning card.

#### Scenario: Promoting the current verse

- **WHEN** the reader promotes the verse they are learning
- **THEN** it is due for review in two days and the next course verse is now the
  learning card

#### Scenario: Learning an out-of-order verse

- **WHEN** the reader picks "Learn now" on another verse
- **THEN** the current learning card is paused and the chosen verse becomes the
  learning card

### Requirement: Spaced Review

Cards in review SHALL come due on their due date. Review SHALL show the reference
with the text hidden, a "Reveal", and then two grades. "Remembered" SHALL multiply
the interval by 2.2 (minimum 1 day, capped at 120) and set the new due date;
"Forgot" SHALL reset the interval to 1 day. At most four due cards SHALL be shown at
once, with a note of how many are waiting.

#### Scenario: A verse remembered repeatedly

- **WHEN** a card is graded "Remembered" from a one-day interval
- **THEN** its next review is about two days out, then about five, growing to a
  120-day ceiling

#### Scenario: A verse forgotten

- **WHEN** a card is graded "Forgot"
- **THEN** it is due again tomorrow

#### Scenario: Nothing due

- **WHEN** no card is due today
- **THEN** the step says when the next one is due rather than offering busywork

### Requirement: The Reader's Own Verses

Manage SHALL accept a custom verse (reference and text), which enters review due
today and can be removed. Custom verses SHALL be counted separately from course
verses in progress.

#### Scenario: Adding a verse from another translation

- **WHEN** the reader adds their own reference and text
- **THEN** it joins the review rotation with the course verses

### Requirement: Resetting a Verse

Manage SHALL let a started course verse be reset, deleting its card; if it sat before
the course pointer, the pointer SHALL move back so the verse can be reached again.

#### Scenario: Resetting a verse already passed

- **WHEN** the reader resets a verse earlier in the course than the next one up
- **THEN** the course will offer that verse again
