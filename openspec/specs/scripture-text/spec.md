# scripture-text Specification

## Purpose

Bible text on the page: a public-domain ASV exported out of the repository's SQLite
Bible and served as plain JSON per book, plus three copyrighted translations — NET,
ESV, NLT — fetched a passage at a time from their publishers. Enough to read from,
never so much that the page waits on it, and never so little that a translation being
away can stop the day.

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

### Requirement: Four Translations, One of Them Always Present

The page SHALL offer four translations: `asv`, `net`, `esv`, and `nlt`. The ASV SHALL
be the only one whose text is stored in this repository and SHALL be the default.
The other three are copyrighted: their text SHALL NOT be committed here and SHALL be
fetched from the publisher's own API — `labs.bible.org` for the NET, `api.esv.org`
for the ESV, `api.nlt.to` for the NLT — one passage at a time, as the reader asks
for it.

#### Scenario: Shipping the repository

- **WHEN** `web/bible/` is inspected
- **THEN** it holds ASV text only, and no copyrighted translation is stored anywhere in
  the repository

#### Scenario: A reader who never changes the setting

- **WHEN** the page is opened and left as it comes
- **THEN** every passage is the ASV and no request leaves for a Bible publisher

### Requirement: The Reader Chooses a Translation

Manage SHALL offer two defaults in `settings`: `readTranslation`, used by the Read
step, the kids' story, and the print sheet, and `memoryTranslation`, used for memory
verses. The Read step SHALL also carry a compact picker beside its show/hide control
that changes `readTranslation` for every later day, and that SHALL be hidden while the
text is hidden.

#### Scenario: Switching while reading

- **WHEN** the reader picks NET on the Read step
- **THEN** today's passage is re-rendered in the NET and later days open in the NET

#### Scenario: Reading from paper

- **WHEN** the reader hides the text
- **THEN** the translation picker goes with it

### Requirement: Keys Belong to the Reader

The ESV and the NLT SHALL require an API key the reader obtains themselves. A key
SHALL be held in `localStorage` under `seekfirst.key.<id>`, SHALL NOT be written into
the state object or the artifact store, and SHALL be sent only to the publisher it
belongs to — the ESV's in an `Authorization` header, never in a URL that could be
logged elsewhere. Manage SHALL show a field per key with a link to the publisher's
free-key page. Changing a key SHALL discard what was cached for that translation.

#### Scenario: No key saved

- **WHEN** the reader chooses the ESV without a key
- **THEN** nothing is requested, the ASV is shown, and a line under the text points to
  Manage → Translations

#### Scenario: A key is replaced

- **WHEN** a new key is pasted
- **THEN** the next passage is fetched again rather than served from the old key's
  cache

### Requirement: Fetched Passages Are Cached and Clipped

A fetched passage SHALL be cached in memory for the life of the page, keyed by
translation and by the exact segment requested, and a failed fetch SHALL NOT be
cached. A whole-chapter request SHALL keep every verse returned; a verse range SHALL
be clipped to the verses asked for.

#### Scenario: Re-rendering the same passage

- **WHEN** the reader hides and shows the same passage again
- **THEN** the publisher is asked once

#### Scenario: A publisher answers with more than was asked

- **WHEN** a range of two verses comes back as a paragraph of five
- **THEN** only the two requested verses are shown

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
chapter when more than one chapter is shown, verse text escaped, and a credit line for
each translation actually shown — the publisher's own copyright notice, which is a
condition of quoting the NET, the ESV, and the NLT at all. A verse range that runs
past the end of a chapter SHALL be clipped to the verses that exist. Text fetched from
a publisher SHALL be treated as untrusted: HTML answers SHALL be parsed into an inert
document and read as text, and no fetched string SHALL reach the page unescaped.

#### Scenario: Two chapters in one passage

- **WHEN** Matthew 5–6 is rendered
- **THEN** each chapter is preceded by its own label

### Requirement: Text Is Optional and Degrades Quietly

Every place that shows scripture SHALL have a show/hide control, and the Read step's
choice SHALL be remembered in `localStorage`. A chosen translation that cannot be
reached — offline, rate-limited, refused, or answering with nothing — SHALL fall back
to the ASV with one quiet line saying so, never an error and never an empty step. If
even the ASV cannot be fetched, the passage area SHALL read "Text not available here
— read it in your own Bible" instead of failing or blocking the step.

#### Scenario: Offline or missing data file

- **WHEN** the fetch for a book fails
- **THEN** the reference and the rest of the step still work, with that one line in
  place of the text

#### Scenario: The publisher is unreachable

- **WHEN** the reader has chosen the NLT and the request fails
- **THEN** the passage is shown in the ASV with a line saying the NLT could not be
  reached, and the step carries on

#### Scenario: Reader prefers their paper Bible

- **WHEN** the reader hides the text on the Read step
- **THEN** it stays hidden on later days until they show it again
