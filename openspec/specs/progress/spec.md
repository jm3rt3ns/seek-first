# progress Specification

## Purpose

An honest account of showing up: streaks, a calendar of the last sixteen weeks, how
far each plan has come, which verses are hidden in the heart, and prayers prayed —
encouragement without gamification.

## Requirements

### Requirement: History Is Written Per Day

Every save SHALL fold today's work into `history[date]` as the list of steps done
plus counts of prayers prayed and verses reviewed. A day with nothing done SHALL be
removed rather than stored empty. History SHALL be capped at the most recent 800
days, oldest dropped first.

#### Scenario: Undoing the only step of the day

- **WHEN** the reader undoes the single step they had marked done
- **THEN** that day's history entry is removed and the streak no longer counts it

### Requirement: Streaks Count Days Showing Up

The current streak SHALL be the run of consecutive days ending today (or yesterday,
if today has nothing yet) on which at least one step was done. The best streak SHALL
be the longest such run in history, never less than the current one.

#### Scenario: Partial day

- **WHEN** the reader finishes only the Read step today
- **THEN** the day counts toward the streak

#### Scenario: Early in the morning

- **WHEN** the reader opens the app before doing anything today
- **THEN** the streak still shows yesterday's run rather than dropping to zero

### Requirement: Sixteen-Week Calendar

The progress view SHALL show 16 weeks of days as a Sunday-first grid of columns, each
cell shaded by how many of the five steps were done (0–5), with today outlined and
future days drawn as empty outlines. Hovering or tapping a day SHALL caption it with
the date, steps done, prayers prayed, and verses reviewed.

#### Scenario: A full day

- **WHEN** all five steps were done on a day
- **THEN** that cell is the darkest shade and the legend reads "all five"

### Requirement: Per-Area Summaries

The view SHALL summarize each part of the devotion: the reading plan's position and
days remaining per track, memory verses as a dot per course verse marked by status
(in review, learning, paused, not started) with the count still ahead, prayer totals
(prayed, answered, on the list), and the kids' story position with the next title.

#### Scenario: Memory dots

- **WHEN** a verse is in review
- **THEN** its dot is filled, while the verse being learned has a gold ring

### Requirement: Milestones

The view SHALL show a fixed set of milestones — first full day; 7-, 30-, and 100-day
streaks; first verse by heart; a full series of 12; all 60; first answered prayer;
100 prayers; the kids through the Old Testament and through the whole story; 100
chapters read — marking the ones reached.

#### Scenario: First full day

- **WHEN** the reader finishes all five steps for the first time
- **THEN** "First full day" is marked as reached
