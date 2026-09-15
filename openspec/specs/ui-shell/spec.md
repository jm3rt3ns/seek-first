# ui-shell Specification

## Purpose

The page itself: how Seek First is delivered (one static HTML file, no build step),
how the four views are routed, and the typographic, theming, and touch rules that
keep a devotion feeling like a quiet page rather than an app screen.

## Requirements

### Requirement: Single-File Delivery Without a Build Step

The web app SHALL ship as a single `web/index.html` file containing all markup,
styles, and script. Book metadata (66 books, names and chapter counts) and the 60
memory verses SHALL be inlined as `<script type="application/json">` blocks so the
page is useful before any network request. No bundler, transpiler, framework, or
`npm install` may be required to serve or change the page.

#### Scenario: Serving the app locally

- **WHEN** a static server is pointed at `web/`
- **THEN** opening `/` renders the full app with no build step

#### Scenario: Adding a feature

- **WHEN** a new step, view, or setting is added
- **THEN** it is written into `web/index.html` rather than a new module or bundle

#### Scenario: External dependency

- **WHEN** the page needs a resource from outside the file
- **THEN** the only permitted ones are the Google Fonts stylesheet (Inter, Literata),
  each with a real system fallback stack, and `bible/<book>.json` fetched from the
  same origin

### Requirement: Hash Routing Between Four Views

The app SHALL route on `location.hash` with four views: `today` (the default when
the hash is empty), `progress`, `print`, and `manage`. A `hashchange` SHALL clear
the manual step selection and re-render. The nav link for the current view SHALL be
hidden so the header never offers where the reader already is.

#### Scenario: Landing on the page

- **WHEN** the page loads with no hash
- **THEN** today's flow renders and the "← Today" link is hidden

#### Scenario: Navigating to progress

- **WHEN** the reader follows `#progress`
- **THEN** the progress view renders and the "Progress" link is hidden while
  "← Today" reappears

### Requirement: Theme Follows the Reader's System

The page SHALL define its complete light palette as custom properties on bare
`:root`, redefine them for dark under `@media (prefers-color-scheme: dark)` guarded
as `:root:not([data-theme="light"])`, and again under `:root[data-theme="dark"]`, so
an explicit `data-theme` wins in both directions. `body` SHALL always set an explicit
background. No color may be defined only inside a media or `[data-theme]` block.

#### Scenario: Reader's device is in dark mode

- **WHEN** the system reports `prefers-color-scheme: dark` and no `data-theme` is set
- **THEN** the page renders in the dark palette, including `theme-color` for the
  browser chrome

### Requirement: Phone-First Reading Layout

Content SHALL sit in a single column of at most 620px, padded by at least 20px and by
the device's safe-area insets on every side. Below 560px, label-and-button rows
(prayer items, memory rows) SHALL stack instead of squeezing, and the print sheet's
columns SHALL collapse to one. Under `pointer: coarse`, interactive targets SHALL be
at least 40–44px tall and the progress calendar's cells SHALL grow to 16px. Nothing
may cause horizontal page scrolling; the calendar scrolls inside its own container.

#### Scenario: Reading on a phone

- **WHEN** the page is opened at 390px wide with a notch
- **THEN** the text clears the notch and the home indicator, no row is clipped, and
  the body does not scroll sideways

#### Scenario: Tapping a step in the strip

- **WHEN** a touch device taps one of the five step buttons
- **THEN** the target is large enough to hit without zooming, and inputs are 16px so
  iOS does not zoom on focus

### Requirement: Render Is a Full Redraw

State changes SHALL be applied by mutating the in-memory state `S`, calling
`store.save()`, and calling `render()`, which replaces the contents of `#app`.
Elements SHALL be built with the `h(tag, attrs, ...children)` helper rather than
`innerHTML`, except where scripture HTML is assembled with escaped verse text.
Transient view state (a revealed verse, an expanded details) is deliberately not
preserved across a redraw; the prayer chat input is the one exception and SHALL be
restored and refocused.

#### Scenario: Marking a prayer prayed

- **WHEN** the reader taps "Prayed"
- **THEN** the item is updated, saved, and the whole view redraws with the item
  struck through

#### Scenario: Adding a request from the chat

- **WHEN** a request is added while the reader has more text typed in the chat box
- **THEN** the list redraws and the typed text and focus survive

### Requirement: Untrusted Text Is Escaped

Any text that did not originate in the page's own source — scripture JSON, a reader's
prayer request, a journal entry, a model reply — SHALL reach the DOM as a text node
or through `esc()`. `innerHTML` may only be given strings whose interpolated parts
have been escaped.

#### Scenario: A request containing markup

- **WHEN** a reader types a prayer request containing `<script>`
- **THEN** it is displayed as literal characters and never parsed as HTML
