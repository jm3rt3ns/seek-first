# scripture-text Specification

## Purpose

Bible text on the page, from a public-domain ASV exported out of the repository's
SQLite Bible, served as plain JSON per book — enough to read from, never so much that
the page waits on it.

## Requirements

### Requirement: ASV Text Served Per Book

Bible text SHALL live in `web/bible/<bookNumber>.json`, one file per book, numbered
1–66, each an array of chapters where a chapter is an array of verse strings in
order. `books.json` (book number, name, testament, chapter count) and `tms.json` (the
60 memory verses) sit beside them and are also inlined into the page. The source of
record is `assets/bible-sqlite.db` (`t_asv`, verse ids of the form `BBCCCVVV`).

#### Scenario: Reading a verse

- **WHEN** the page needs Genesis 1:3
- **THEN** it is `bible/1.json`'s first chapter's third entry

#### Scenario: Regenerating the text

- **WHEN** the JSON needs to be rebuilt
- **THEN** it is exported from `assets/bible-sqlite.db`, keeping this shape

### Requirement: Books Load Lazily and Are Cached

A book's JSON SHALL be fetched only when a passage from it is first displayed, and
SHALL be held in an in-memory cache for the life of the page. The page SHALL NOT
preload the corpus.

#### Scenario: A day in Matthew

- **WHEN** the reader's plan is in Matthew and they open the Read step
- **THEN** only `bible/40.json` is fetched, and only once however many times the
  passage is re-rendered

### Requirement: Reference Parsing

`parseRef()` SHALL parse the human references used by kids' stories and custom
content into segments of `{book, chapter, firstVerse, lastVerse}`. It SHALL accept a
whole chapter ("John 3"), a chapter range ("Genesis 7-8"), a verse range
("Luke 2:1-20"), and several parts separated by semicolons where a later part may
omit the book ("Exodus 7:14-24; 10:21-29"). It SHALL return null for anything it
cannot parse, and the caller SHALL treat null as "no text available" rather than an
error.

#### Scenario: Multi-part reference

- **WHEN** "Exodus 7:14-24; 10:21-29" is parsed
- **THEN** two segments are produced, both in Exodus

#### Scenario: Unparseable reference

- **WHEN** a reference cannot be parsed
- **THEN** the "Show text" control is not offered and the reference still reads as the
  anchor for the reader's own Bible

### Requirement: Passage Rendering

Rendered passages SHALL show superscript verse numbers, a chapter label above each
chapter when more than one chapter is shown, verse text escaped, and an "American
Standard Version" credit at the end. A verse range that runs past the end of a
chapter SHALL be clipped to the verses that exist.

#### Scenario: Two chapters in one passage

- **WHEN** Matthew 5–6 is rendered
- **THEN** each chapter is preceded by its own label

### Requirement: Text Is Optional and Degrades Quietly

Every place that shows scripture SHALL have a show/hide control, and the Read step's
choice SHALL be remembered in `localStorage`. If a book's JSON cannot be fetched, the
passage area SHALL read "Text not available here — read it in your own Bible" instead
of failing or blocking the step.

#### Scenario: Offline or missing data file

- **WHEN** the fetch for a book fails
- **THEN** the reference and the rest of the step still work, with that one line in
  place of the text

#### Scenario: Reader prefers their paper Bible

- **WHEN** the reader hides the text on the Read step
- **THEN** it stays hidden on later days until they show it again
