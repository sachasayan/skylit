# Design review — 2.6

The dashboard should read clearly at arm's length and say what a control does.
Momo supplies personality; functional screens do not need marketing copy.

## Calendar critique and changes

| Finding | Change |
| --- | --- |
| A large slogan and empty decoration displaced useful information | Plain Calendar heading; concise connection instructions |
| Dates blended together and event text was difficult to scan | Visible weekday/grid boundaries, larger event and agenda type |
| Overflow count was clipped along with an event title | Independent +N badge; full count in the date's accessible label |
| Today and selection were easy to confuse | Today has a filled circle; selected date has an outlined cell |
| Event details did not look interactive | Explicit Details disclosure; generous summary touch targets |
| Month navigation could affect an overview summary | Overview stays anchored to today independently of the browsed month |
| Short tabs jumped vertically | Consistent top alignment across all tabs |

The six-row month fits the frame's 1280×720 effective viewport. Long titles still
truncate in cells: select the date to read complete titles and details in the agenda.
Agenda scrolls independently on the frame and stacks below the month on narrow
screens. This is a read-only calendar, so there are no misleading create/edit controls.

## Colour and hierarchy

Linen, Sage, Stone, Ocean, Plum and High contrast each have light and dark variants.
Automatic switches at the configured city's sun horizon without fetching weather.
Settings explains the location and next transition. The frame is left in Automatic.

Regular palettes use soft text and subtle dividers. Following owner feedback in
2.6.1, Linen and Sage light return to their original colours; Linen dark returns
to the original Cocoa colours. The newer palettes have similarly restrained text
and borders. Layout, typography, navigation and calendar improvements remain.

The optional **High contrast** palette keeps the stronger treatment. Its normal,
secondary and accent text are tested at 4.5:1 against background, panel, rail and
selected surfaces, as is button text. Control borders meet 3:1 against background
and panel. These checks apply to High contrast only, not a full accessibility claim
for the regular palettes or every possible rendered state.

Palette and mode are independent: Linen + Dark is warm brown; Ocean + Dark is blue.
Browser settings belong to that browser origin (including its port). The installed
frame has its own local settings. They do not sync. Matching palette and resolved
Light/Dark mode uses the same colour tokens in both deployments. Automatic can
resolve differently if location, device time or the synthetic demo date differs.

Kept: warm surfaces, restrained serif headings, clear touch controls, Momo.
Removed: repetitive “a little…” slogans, invented inspirational copy, giant
illustrations unrelated to an action, and placeholder home-status cards. The sidebar
has navigation, Momo and connection status; time/date live on Overview.

## Public screenshots

Run `python3 scripts/preview.py` and use the separate localhost demo. It contains
made-up events and a fixed forecast/date. Screenshots in `docs/screenshots` show this
fixture, visibly labelled DEMO DATA. Never screenshot private feed addresses, real
calendar contents, family photos, account identities or household setup records for
publication. Screenshots demonstrate layout, not authenticated service operation.

## Overview refinement — 2.7

The prior overview looked like a stack of shortcuts: the clock was subordinate and
the weather summary lost the illustration already used by Weather. Replaced that
structure with an oversized clock, a separate quiet day-period label, full date,
and two columns: illustrated forecast and a borderless agenda. Rain, wind and
sunset sit under the existing day/night landscape. Text stays outside the artwork.

Photos, Home, YouTube and Settings shortcuts are removed from Overview; the sidebar
handles navigation. Weather and calendar retain contextual drill-down arrows. No
palette or contrast changes. At 1280×720 the clock, forecast and five typical events
fit; long event titles can extend the page naturally. The columns stack on smaller
screens. No generated replacement asset, framework or new API request was needed.

## Card layout — 2.7.1

Clock/date, illustrated weather and upcoming events each occupy a matching card.
Shared panel colour, subtle borders, rounded corners and consistent gaps group the
information without increasing contrast. The large clock and weather artwork remain;
no duplicate service shortcuts were reintroduced.

## Overview hierarchy — 2.7.2

The first card layout spread the date too far from the clock and stretched the
weather card to match a dense agenda. Clock and date now share a compact card above
the weather, with Upcoming alongside both. Weather sizes to its contents. At frame
resolution the three cards fit comfortably with room below.

Events are grouped by Today, Tomorrow or date, with a separate Ongoing group.
Times and supporting text are larger; a single calendar's name is not repeated on
every row. Multiple-calendar names remain visible. Normal refresh timestamps stay
in the detailed tabs; Overview shows only missing, stale or offline status. Existing
palettes, artwork, Momo and drill-down controls are preserved.

## Photos and inviter controls — 2.8

Photos now exposes its source in the page heading. The email mode starts with one
clear setup/check action; cache details and thumbnails appear when useful. A
manual slideshow has large touch controls and a calm crossfade, while idle mode
hides controls and returns on first touch. Reduced-motion preference removes the
crossfade. The Google Photos shared-album mode remains familiar and available.

Calendar keeps the month and agenda prominent. Inviter review opens on demand,
with a clear frame-only scope, exact-address approval and a separate choice for
events missing organizer information. This avoids implying that the UI changes
Google Contacts or accepts events in Google Calendar. The detailed architecture,
usability critique and remaining validation are in [feature review](feature-review.md).

## First-run guide — 2.9

A new owner previously landed on an empty Overview and had to discover setup forms
across multiple tabs. The guide puts city, photos and calendar in a short sequence,
with a direct action for each. It uses existing settings forms rather than copying
credential fields into another screen. Calendar and Home can wait, so the guide is
easy to leave and reopen. A previous settings record suppresses auto-opening on
upgrade. Cards use the current palette, large buttons and plain status labels;
no decorative slogan or personal example data is shown.

## Photo-first overview and library — 2.10

The overview now uses a two-column grid at the frame's 1280×720 CSS viewport:
clock and illustrated weather on the left, loose photo prints above a compact
three-event agenda on the right. The prints appear only when local email photos are
available. They are a contextual route to Photos, not another service shortcut.
The fixed event limit keeps the normal state on one screen; longer detail remains in
Calendar. Narrow screens stack the content and may scroll.

Photos puts saved pictures first. The former setup-heavy page is a thumbnail library
with direct browse and zoom; delivery and retention controls sit in a disclosure
beside it. The shared-album layout remains available when selected. The built-in
slideshow offers a quiet fade, animated falling prints and a three-picture collage.
Controls draw from the selected theme, fade during playback and reappear on input.
Reduced motion removes entrance/crossfade animation. A browser review at frame,
desktop and narrow widths found no horizontal overflow. Synthetic photo fixtures
exist only in the isolated preview and are excluded from normal APKs.

## Weather scenes and looser prints — 2.11

The single sun-and-cloud drawing made rain, fog, snow and storms look too similar.
The current forecast now chooses one of nine small CSS scenes in both Weather and
Overview. They reuse the warm palette and switch the sun to a moon when the forecast
reports night. The scene adds a glanceable cue; the written condition remains the
source of meaning. Synthetic previews check clear, fog, snow, showers and storms.

The little label on the Overview photo stack competed with the prints. The whole
stack remains a generous, named button to Photos, while the label is gone. Prints
are larger and slightly spill over the Upcoming card edge. With only one or two
saved pictures, collage changes to one or two frames instead of repeating a photo
just to fill three slots.

## Responsive landscape pass — 2.12

Design for 16:9 and 16:10 landscape displays, using width and available height rather
than treating 1280×720 as the only canvas. That size remains a checkpoint. Overview
and the core month view have no page scroll; agendas/settings/libraries can scroll
deliberately. Short landscapes reduce decorative space before touch targets. The
optional larger-text profile keeps warm palettes; `appearance.js` owns its scale.
Avoid selectors newer than Chromium 95 (for example `:has`).

Settings has eight focused destinations with one shared editor per preference. New
controls belong there or in on-demand photo/event details. Household navigation and
the Overview note are off by default; healthy service timestamps remain off Overview.
The three bounded Overview presets introduced in 2.12 remain as starting layouts in the 2.14 module editor. Preserve Momo,
the six light/dark pairs and independent offline solar appearance.

Public before/after reports live under `docs/reviews/`. Use `scripts/check_ui.cjs`
against the synthetic preview for interaction/landscape checks and capture manifests.
The fixtures' repeated images in the 50-thumbnail stress case test layout volume,
not import deduplication. Physical WebView 95 acceptance remains separate.

## Owner feedback refinement — 2.12.1

The 2.12 pass added clutter and compacted familiar screens too far. Restore the
larger loose Overview prints and icon-only weather/calendar arrows. Weather uses
its previous hero, metric and forecast spacing; remove its additional city action
and sunrise text. The shared-album card and supporting cards regain their original
width and padding. Keep the accepted full-width email-photo library.

Photo source, favourite/hide, framing, captions and playback choices belong in
Settings. The player contains icon-only buttons with accessible names for Previous, Play/Pause, Zoom/Fit,
Next and Close. Calendar has one month/selected-date agenda, with no core Refresh,
view picker or source chips. Visibility and retry belong in Settings.

Settings previously created three competing columns and placed its heading between
unrelated actions. Use a left-aligned heading, a separate contextual return and one
labelled area selector above a single editor column. Existing calendars precede a
collapsed add form. Inviter review opens its own panel with pending/approved
choices first and setup below. Capture viewport images for comparisons: full-page
captures of a sticky rail can misrepresent its actual screen position.

## Settings lightbox — 2.12.3

Open Settings over the current screen, with a dimmed background and one editor
column. Keep its heading, area selector and 48-pixel Close button fixed while
content scrolls. Size the dialog from both viewport dimensions, with comfortable
margins on landscape displays and smaller margins on a narrow preview. Retain
warm light/dark surfaces, larger text, the existing categories and disclosures.
Closing returns to the underlying screen and original control; switching areas
keeps that context. Setup links use the same dialog, returning to the guide.
Pause automatic photo and quiet-hour entry while the owner is using Settings.

## Settings navigation and gallery curation — 2.13.0

Inside the Settings lightbox, use a left-side category rail for landscape screens,
with its own scroll on short displays. Keep a single editor column and fixed Close
button. Narrow previews retain the labelled selector. The underlying dashboard
context and focus-return behavior remain the same.

The emailed-photo library places a 48-pixel trash action on each thumbnail as a
separate button, avoiding nested controls and accidental viewer opening. It means
exclude from this frame, with Undo and restore in Settings. Use one retention
selector with date/count groups; capacity is shown only for date-based choices.
Keep all further delivery/curation controls in Settings and the player minimal.


## Modular dashboard — 2.14.0

Keep configuration in Settings → Dashboard. The normal dashboard contains no drag
handles or settings toolbar. Start with the familiar four modules; offer Clock &
date, Weather, Photos, Upcoming events, Hourly forecast, Note, Shopping list,
Countdowns and Timers in the gallery. One of each keeps the layout and data model
simple. Reuse existing photo curation, calendar filtering and Household content.

Use a twelve-column/twelve-row grid with integer resize steps, module-specific
minimums and no overlap. Preserve intentional empty space. Tap-add makes room with
an explicit status and Undo; gallery dragging only uses available space. Stage
edits in a named preview, with Save, Discard, Undo and precise size/position fields.
Retain 44-pixel drag/resize targets; touch gallery scrolling uses the card body,
while its separate grip starts a drag. Keep the Settings heading and Close fixed.

Render the four originals inside adaptive wrappers. Scale clock/temperature from
their actual bounds, keep loose photos inside the assigned space, simplify weather
metrics at small sizes, and scroll event/utility content internally. Forecast,
Countdowns and Timers need four grid rows to keep useful content visible beneath
their headings. Keep arm's-length text and the existing warm palettes/Momo.
Validate minimum/full sizes and different positions as well as complete 16:9/16:10
layouts, standard/larger text, all six light/dark pairs and a narrow fallback.


Clock styles belong to the selected Clock & date module in Dashboard Settings,
with a live sample and explicit Save. Classic, Analog, Stacked and Digital retain
the warm palette and city/date context. Size the analog face and stacked numbers
from module bounds; small modules place the date below, while wider modules use
the space beside the clock. Keep decorative hands/numbers out of accessibility
reading order, and preserve the original time heading. Avoid ticking animation
and controls on the normal dashboard.

## Warm clock concepts — 2.15.2

The approved first four generated concepts guide Landscape, Analog, Flip and
Botanical. Landscape uses olive serif time above soft terracotta hills; Analog
uses a fine cream face, quiet numerals and terracotta hands; Flip uses horizontal
olive cards with a split seam and restrained minute-change motion; Botanical
uses warm serif time, a translucent organic wash and a small plant. Artwork is
original local vector geometry inspired by the concept, with live time/date.

Keep decoration subordinate: small modules omit plants; shallow Flip strips put
the date beside the tiles, narrow/tall Analog places the date beneath the face.
Landscape reserves an explicit region for hills so they cannot cross time text.
All four use existing theme pairs and reduced motion. No controls on Overview.

## Clock concept refinement — 2.15.3

Compare actual widget captures to the approved sheet before accepting a visual
change. Cormorant Garamond supplies warm lining serif numerals; Jost supplies fine
cardinal labels and Flip numerals. Both ship locally with their OFL notices.
Paint servers belong to each instance so the live widget and Settings sample can
coexist. Keep the clock's full accessible time and date even when the minimum
module visually shortens the date.

Every shape has a composition: Landscape puts hills beside wide time and below
balanced time, with a circular sun redrawn for the art region. Analog keeps its
cream dial, slender hands and tiny trailing plant. Flip uses horizontal tiles or
a vertical pair in tall modules, with a small ceramic vase clear of time/date.
Botanical uses a bare, curved branch and a quiet wash rather than another pot.
Minimum modules omit secondary art; strips center compact compositions.

Flip motion has outgoing upper and incoming lower halves, shading and a gentle
settle. Animate only normal visible changed ticks. Cancel both halves on a style
change, hidden update or reduced motion; initial render and time jumps stay still.


## Stricter clock acceptance — 2.15.4

Lock the visual rubric from the approved concepts before showing implementation
captures to a fresh critic. Concept finish and intentional responsive composition
are separate gates; passing geometry alone is insufficient. The reference fixes
visual language, not positions: move dates, stack Flip panels, redraw hills and
omit secondary art where that gives a finished composition. Inspect native crops
in minimum, wide, medium, tall, shallow-strip, full and near-square shapes.

Use fine curved foliage with clean stem attachments and varied contours, modeled
terracotta/ceramic vessels and shallow wooden shelves. Landscape has subtle local
paper grain, coherent light and a low natural entrance in split scenes. Flip
faces retain matte grain, upper/lower shading, a recessed seam and small hinges.
Keep the texture static and local, without a shader or new network request.
Botanical uses a fuller serif weight, with glyph fitting measured at that weight.
Analog strips center the actual dial/date group rather than estimating date width.

Preserve the existing style IDs, full accessible time/date and visible-tick-only
Flip motion. Final visual acceptance includes all six light/dark pairs and sampled
actual animation; physical WebView acceptance remains a separate check.


## Analog reference reconstruction — 2.15.5

Extract and validate the target's construction before judging implementation. The
Analog dial is a shallow recess within a softly convex panel, not a raised disc
or generic rim. Preserve upper interior shade, lower interior light, painted
marks, slender four numerals, copper bars and a raised olive pivot as distinct
layers. Compare lengths independently of current hand angles.

The foreground has clustered broad heart leaves and an irregular left/down
cascade, a rolled terracotta lip, rounded body and separate lower foot, and a
wood shelf with top/front/underside and contact shading. The local transparent
illustration preserves that material detail. Allow intentional edge cropping;
reserve date space beside the cascade. Omit the secondary vignette in constrained
shapes. The public report records the target-first inventory and exact critic
instructions; layout and reference fidelity are independent gates.

Analog hands update each second only when the live clock or Settings sample is
visible. Hidden views do no fast updates. Reduced motion hides the seconds needle
and retains the normal time/date updates. No services or layout render per second.
