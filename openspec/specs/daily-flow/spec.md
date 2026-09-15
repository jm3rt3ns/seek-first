# daily-flow Specification

## Purpose

The spine of the app: one day's devotion as five short steps — Read, Pray, Memory,
Journal, Kids — that a reader can finish in about fifteen minutes, with the page
always opening on the first thing not yet done.

## Requirements

### Requirement: Five Steps in a Fixed Order

The daily flow SHALL consist of exactly five steps in this order: `read`, `pray`,
`memory`, `journal`, `kids`. Each step SHALL render as one section with an eyebrow,
a heading, its own body, and a done row. Only one step is visible at a time.

#### Scenario: Opening the app mid-devotion

- **WHEN** the reader has finished Read and Pray today and reopens the page
- **THEN** the Memory step is shown, because it is the first step not yet done

#### Scenario: Every step finished

- **WHEN** all five steps are marked done and no step is manually selected
- **THEN** the completion screen is shown instead of a step

### Requirement: Progress Strip Navigation

A five-cell strip SHALL sit above the step, one cell per step, showing each step's
label and a bar. A finished step SHALL be marked done (gold bar, check mark after the
label); the current step SHALL be emphasized. Tapping any cell SHALL jump to that
step, in any order, whether or not earlier steps are finished.

#### Scenario: Jumping back to a finished step

- **WHEN** the reader taps "Read" after finishing it
- **THEN** the Read step is shown again with its done row offering "Undo" and "Next →"

### Requirement: Marking a Step Done Advances the Flow

Each step's done row SHALL offer a primary button that records the step as done for
today, runs that step's side effect, saves, and moves to the next unfinished step
(wrapping to any earlier unfinished step, or to the completion screen when none
remain). A step already done SHALL instead offer "Undo", which clears the record, and
"Next →", which only navigates.

#### Scenario: Finishing the last unfinished step

- **WHEN** the reader marks the only remaining step done
- **THEN** the completion screen is shown

#### Scenario: Undoing a step

- **WHEN** the reader taps "Undo" on a finished step
- **THEN** the step is no longer counted as done today and the day's history entry is
  rewritten to match

### Requirement: Step Side Effects Fire Once, On Completion

Marking Read done SHALL advance the reading plan position; marking Kids done SHALL
advance the story position. These SHALL happen only on the transition from not-done
to done, never on rendering, on "Next →", or on Undo. Undo SHALL NOT rewind them.

#### Scenario: Re-opening a finished step

- **WHEN** the reader returns to the finished Read step and taps "Next →"
- **THEN** the plan position does not advance a second time

### Requirement: Completion Screen

When the day is finished the app SHALL show a closing screen reading "Go in peace",
displaying the verse currently being learned (or the next review verse, or a default
verse), with links to the progress view and back into the day.

#### Scenario: Looking back over a finished day

- **WHEN** the reader taps "Look back over today" on the completion screen
- **THEN** the flow returns to the first step with every step still marked done

### Requirement: The Day Rolls Over at Midnight

Today's per-day state (`today.date`, the done map, the prayer selection, the prompt
shift, the day's counters) SHALL be reset whenever the local date differs from
`today.date`. The app SHALL check every 60 seconds so a page left open overnight
rolls over on its own. Rollover SHALL NOT touch plan positions, prayer items, memory
cards, journal entries, or history.

#### Scenario: Page left open past midnight

- **WHEN** the local date changes while the page is open
- **THEN** the next check resets the day and re-renders with all five steps unfinished

#### Scenario: Yesterday's work

- **WHEN** the day rolls over
- **THEN** yesterday's completed steps remain in history and the streak is unbroken
