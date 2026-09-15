# print-sheet Specification

## Purpose

The whole day on one sheet of paper, for a reader who would rather sit with a pen
than a phone — the same five steps, with room to write.

## Requirements

### Requirement: The Day on One Sheet

`#print` SHALL lay today's devotion out as a printable sheet: a masthead with the
wordmark and the full date, then five numbered blocks in two columns — Read (the
reference and the plan name), Pray (today's people as check-boxed lines, plus two
blank lines), Memorize (the verse being learned in full, and the references due for
review as check boxes), Journal (today's prompt over ruled lines), and Kids (the
title, reference, and question).

#### Scenario: Printing before the day starts

- **WHEN** the sheet is opened before any step is done
- **THEN** the day's reading, prayer selection, and learning verse are chosen and
  shown, the same ones the flow will use

#### Scenario: Nothing to memorize

- **WHEN** no verse is being learned and none are due
- **THEN** the memorize block says "Nothing due today" rather than printing empty

### Requirement: Passage Text Is Optional on Paper

The sheet SHALL offer a checkbox to include today's passage text, set in two columns
below the blocks, remembered in `localStorage` between visits.

#### Scenario: Printing with the text

- **WHEN** the reader leaves the checkbox on
- **THEN** the passage prints under the blocks, possibly running onto a second side

### Requirement: Print Output Carries No App Chrome

Print styles SHALL drop the header, nav, and any control marked no-print, render
black on white with margins of about 13mm × 14mm, and avoid breaking a block across
pages. Saving as PDF from the print dialog SHALL give the same sheet.

#### Scenario: Printing the page

- **WHEN** the reader prints
- **THEN** the sheet prints alone, without navigation, buttons, or dark backgrounds
