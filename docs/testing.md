# Testing Skylit

Run from the repository root with Node 18+, Python 3.10+, and JDK 17 for Java tests:

```sh
npm ci --ignore-scripts
npm run typecheck
npm run build
node --test tests/*.test.cjs
python3 -m unittest discover -s tests
python3 scripts/check_public.py --history
```

The suite uses Node/Python standard test runners. No network service is needed. React bundles are built locally before preview or APK staging. Test observable behavior and failure boundaries; avoid snapshots
of household data, tests that only repeat constants, and broad mocks of unrelated
APIs. For example the synthetic preview mocks only the forecast endpoint, and a
regression test ensures script/resource fetches pass through unchanged.

## Automated coverage

- Appearance: sunrise/sunset boundaries, both DST transition dates, date line,
  polar day/night, missing/invalid location, manual overrides, legacy settings.
- Contrast: the optional High contrast palette in both modes, text surfaces,
  accent/button text and control borders. Regular palettes are visually reviewed.
- Overview: expired/ongoing/all-day events, exclusive all-day end dates, result limit,
  stable sorting, weather validity/freshness.
- Dashboard layout: legacy migration, schema stripping, bounds/minimums, collisions,
  unique modules, empty layouts, automatic packing and randomized edit sequences.
- Calendar controller: overlapping worker completion, stale errors, month-independent
  upcoming list, removal during an in-flight parse without resurrecting events,
  grouped overview dates, redundant metadata removal and offline warning visibility.
- Calendar parsing: recurrence, DST, exceptions, cancellation, moved occurrences,
  all-day/floating/overnight events, organizer inheritance, malformed data and
  expansion limits. Inviter approval/revocation is tested as an exact display rule.
- Photos: slideshow style fallback and collage wraparound without duplicate images, private local image URL
  validation, malformed native status, and the
  actual Java policy for account, age, count, dimensions and downsampling. A
  serialized multipart message tests the pinned mail library's image decoding.
- Onboarding: fresh-install launch, upgrade and explicit-route preservation,
  dismissal persistence, reopening and links to the existing setup controls.
- Android: feed URL/size/redirect boundaries, native navigation allowlists, TLS-only
  device selection; packaging/privacy sentinels keep personal data outside APKs.
- Momo: canvas geometry, rendering pause/resume, reduced motion, persistence,
  gallery, daily clothing and local-time/DST routines.

`python3 scripts/test_calendar_device.py` runs isolated storage/failure tests on an
explicitly selected paired frame using in-memory test data. It does not populate
household calendars. Unit tests supplement, rather than replace, device checks.

## Visual and device checks

1. Run `python3 scripts/preview.py` for synthetic data at localhost:8767; restart
   after edits. Check every tab, long titles/multiple events, details, month/Today
   navigation, theme changes and persisted settings after reload.
2. Inspect 1280×720 CSS pixels (1920×1080 at the tested frame's 1.5 density), a normal
   desktop viewport and a narrow viewport. Check overflow, readable text, focus and
   touch targets. Public screenshots must come from the synthetic preview only.
   Also check that a fresh browser opens the guide and an upgraded frame does not;
   reopen the guide from Settings to inspect it without resetting household data.
3. Build with `python3 scripts/build.py`; verify signature and inspect the final APK
   with `python3 scripts/check_public.py --history --apk dist/skylit.apk`.
4. Identify exact model, Android and transport, then install in place with the same
   signing key. Inspect all affected tabs and test settings persistence, HOME/back,
   weather refresh, and appearance on actual hardware. Do not change system time
   or Wi-Fi to simulate solar transitions; use deterministic unit cases.
5. For household Calendar setup, verify an actual owner-made event refresh using
   docs/calendar.md. A loaded grid or synthetic screenshot does not prove syncing.
   Test an unapproved organizer, approval, revocation and cancellation separately.
   For email Photos, follow docs/photos.md and verify a real image import, manual
   browsing/zoom, all three slideshow styles, control fade, idle entry/return and
   cache removal on the physical frame. Do not erase household cache solely for a
   release check unless a separate replacement source is ready.
6. Record results, limitations and rollback in the private setup record and its
   device Downloads copy. Run Gitleaks against history and a source export before
   publication. Follow docs/releasing.md for publication and metadata checks.

There is no claimed percentage coverage, full accessibility certification, or
long-term unattended stability result. See docs/verification.md for checks actually run.

## Optional rendered regression suite

Start `python3 scripts/preview.py`, then run `node scripts/check_ui.cjs` with a local
Playwright installation. `SKYLIT_PLAYWRIGHT` may specify its module path and
`SKYLIT_CHROME` an existing Chrome executable; these are test-only dependencies.
`--capture docs/reviews/DATE-implementation` writes synthetic screenshots plus a
manifest. It exercises Settings dialog context, focus trapping, Close/backdrop/Escape/Back,
fixed headers with internal scroll, category/return routes, Settings curation/reload, icon controls and slideshow styles,
month agenda/search/Settings visibility/metadata, local shopping undo/persistence, privacy
pause, optional navigation and display-transfer exclusion. Its viewport matrix
covers 960×540, 1024×640, 1280×720/800, 1440×900, 1600×900, 1920×1080/1200 and
390×844, both text profiles, with six feeds/long titles/50 thumbnails.

Record any first-load retry separately. The previously observed desktop module
omission is not proof of a native asset failure. Chrome browser geometry coverage
does not replace Android WebView 95, touch, native quiet timing or service delivery
checks. The native calendar test also covers metadata edits during pending refresh.

`python3 scripts/test_photo_device.py --usb` identifies the configured USB frame
and runs actual PhotoStore/Bitmap/JSON code in an isolated shell-owned temporary
directory with in-memory preferences and synthetic images. It covers received-date
windows, count modes, deduplication, excluded-slot capacity, persistence through
reopening/pruning/reimport, restore/erase and importer/exclusion races. It never
opens the household cache or mailbox. It also stalls a synthetic import while
checking responsive cache reads, erase/disconnect cancellation and rejection of
late publication. Omit `--usb` to use paired TLS transport.

For review regressions, run `node scripts/check_review_fixes.cjs` against the
synthetic preview with the same Playwright/Chrome environment variables.
`--capture docs/reviews/2026-10-11-review-fixes` captures slideshow refresh,
unsaved dashboard edits, expired cached forecasts and malformed saved preferences.
The Node tests separately cover calendar-worker cancellation; Python tests cover
serialized malformed MIME, TLS socket cancellation and history-check exit status.


For dashboard editing, run `scripts/check_dashboard.cjs` with the same Playwright
and Chrome environment variables used for `scripts/check_ui.cjs`, against the
isolated synthetic preview. `--capture docs/reviews/2026-10-11-modular-dashboard`
captures default/editor/gallery, all nine modules, every minimum/full size and
nine viewport sizes. Checks cover pointer/keyboard movement, resizing/cancellation,
overlap rejection, Save/Discard/Undo, storage failure, auto-arrangement, gallery
scroll/drop, actual Household data actions and reload persistence. Physical
acceptance must use touch on the selected frame and an actual process restart;
restore the original layout and verify private preference/account/cache hashes.


For clock styles, run `scripts/check_clocks.cjs` with the same browser environment
against the isolated preview; optionally add `--capture docs/reviews/2026-10-11-clock-styles`.
It checks staged styles, Save/reload, Discard/Undo, preset/packing preservation,
failed writes, city time/format synchronization and all four styles across nine
viewports with both text profiles, minimum/full sizes and a dark presentation.
Unit tests cover midnight/noon, half-hour zones, DST and style schema boundaries.
On the frame, exercise the picker and Save with touch, restart the app, capture
small/large styles privately, and restore/verify the original preferences and data.

## Slideshow suite

`node --test tests/slideshow-model.test.cjs` exercises bounded queue/history,
collections, portrait layouts, schedules and capture-date policy. With the isolated
preview running, `node scripts/check_slideshow.cjs --capture <review-directory>`
checks playback timing, transitions, gesture inspection, curation, persistence,
video export/cancellation and responsive Settings. It uses synthetic fixtures only.
Set `SKYLIT_PLAYWRIGHT` / `SKYLIT_CHROME` as with the existing browser checks.

`python3 scripts/test_slideshow_device.py` builds a **private** test APK with a
separate package/UID, runs native media/privacy and WebView playback/export checks
through paired TLS ADB, and removes it plus its owned Downloads files. It never
opens the household app's data. Requires private build/device config and Playwright.
The first-run credential fields are checked empty. The runner also checks certificate-pinned phone authentication, bounded mutations,
uploads, cross-origin refusal and revocation. The address/code are written only to
ignored local evidence. Never distribute the test APK or private
evidence. Always restore the normal app and remove task ADB forwards afterwards.

## QR phone pairing

`node scripts/check_phone_pairing.cjs <capture-folder>` uses the synthetic preview
and the same browser environment variables as the slideshow suite. It checks
scan/pending/approve/reject/stop across four sizes, keyboard focus and the phone
page’s URL-fragment removal. `test_phone_pairing.py` exercises the actual Java
approval state machine, timeout, single-use and session-restart boundaries.
`test_slideshow_device.py` also runs `check_phone_pairing_device.cjs` against its
separate synthetic UID: photos blocked before approval, matching numbers, actual
on-frame touch, decoded phone thumbnails, and Stop revocation. Owner phone camera
and local-certificate acceptance still require device-specific verification.

The clock browser suite also checks near-square modules in both text profiles and
centering of the complete Analog strip dial/date group. Visual concept acceptance
uses a target-first locked rubric and all seven native shape crops; runtime bounds
checks do not replace that independent critique.


## Analog construction and visible seconds

For reference reconstruction, extract and validate defining light/depth/layer
relationships before seeing implementation; a stricter adjective-based rubric
can still accept the wrong construction. Inspect native shapes independently of
live hand angles. Keep reference fidelity and responsive composition as separate
gates, then assess all six light/dark pairs separately. Record real remaining
finish differences and precise acceptance scope.

`check_clocks.cjs` verifies configured city seconds and a visible Analog tick
independent of the main 15-second status timer, plus reduced-motion suppression.
Its minimum/wide/medium/tall/strip/full/near-square matrix exercises both text
profiles. Synthetic captures do not substitute for WebView 95 device acceptance.

## Updater and live editor acceptance

`tests/updates.test.cjs`, `tests/test_update_policy.py` and
`tests/test_release_metadata.py` exercise malformed native status, exact release
URLs/hostnames, version downgrade rejection, bounded release metadata, source asset
binding, idle heartbeat freshness, and cross-midnight hour windows.

Against the synthetic preview, run `scripts/check_updates_editor.cjs` with the
same Playwright/Chromium setup as the other rendered scripts. It covers real
widget content in a script-free preview, continuous pointer resize, transaction
undo/redo, cancellation, palette placement, ratio selection, expanded tools,
short-screen canvas occlusion, narrow geometry, disabled browser installation,
conditional update routes, settings dependencies, escaped release notes and fixed
native action dispatch. Updater native status is simulated; actual installation
and download acceptance must run on Android, as described in [updates](updates.md).


## Task-based Settings acceptance

Run `scripts/check_settings_interactions.cjs` against `scripts/preview.py` with the
Playwright/Chrome environment above. `SKYLIT_PREVIEW` selects the localhost origin;
`--capture docs/reviews/2026-10-12-settings-interactions` writes synthetic evidence.
Checks cover visible preference choices, staged dashboard templates and styles,
Apply/Discard/Keep editing recovery, current-screen geometry, explicit gallery
selection, saved direct crop/framing, custom pace, visual collections/presentations,
review-before-apply transfer, source capabilities and narrow/short fallback.
Native updater policy is simulated here; frame installation, native persistence
and document-picker integration require separate physical acceptance. Older editor
suites that assert removed coordinate/ratio/expand controls describe the prior UI.

## React migration checks

`check_react_frontend.cjs` exercises first-run versus upgrade behavior, setup direct links,
phone matching-number approval before photo access, mutation payload allowlists, exclusion
confirmation and session expiry. `check_settings_interactions.cjs` covers the preserved
Settings tasks, staged dashboard edits, crop recovery and responsive layouts. Both use
only the isolated synthetic preview and block external requests. Set `SKYLIT_PREVIEW`,
`SKYLIT_PLAYWRIGHT` and optionally `SKYLIT_CHROME` for the local browser runtime.

## Shared components

Build the review-only interactive gallery with
`node scripts/build_component_showcase.mjs`, then run
`node scripts/check_components.cjs` with the Playwright/Chrome environment above.
It checks live action feedback, switches, selection, field error associations,
disabled controls and segmented keyboard focus/activation. Captures cover light
and dark at 1280×720, 1920×1080 and 390×844. Run the Settings workflow suite and
React screen suite after changing shared styles, since a primitive affects many
features. See [component rules](components.md).

## React recovery regression checks

`npm run test:react` runs the initial React integration suite and
`check_react_recovery.cjs` against the synthetic preview. The latter checks incomplete
forecast recovery, independent feature boundaries, calendar confirmation cancellation
and navigation, slideshow drafts during unrelated refresh and in-flight saves,
external changes to clean drafts, server closure, deadline expiry and late responses.
`tests/frontend-data.test.cjs` validates nested API/cache data, polar sunset absence,
invalid timestamps and phone session metadata. Browser tests intentionally inject
render failures into an isolated test host, never household data.
CI runs these checks after a fresh frontend build. Local use accepts the existing
`SKYLIT_PREVIEW`, `SKYLIT_PLAYWRIGHT` and `SKYLIT_CHROME` environment variables.

## Walkthrough controls and editor

`node scripts/check_walkthrough.cjs` uses the synthetic preview (`SKYLIT_PREVIEW`),
with optional installed Chrome (`SKYLIT_CHROME`). It checks compact icon choices,
top-level Navigation, an actual pointer swap, opposite-corner anchoring at all four
resize handles, and landscape/narrow screenshots. Narrow screens edit a scaled
1280×720 landscape canvas; landscape screens use their current proportions.
Swaps exchange entire slots and reject incompatible minimum sizes.

### Settings / Photos follow-up regression checks

Use an isolated `scripts/preview.py` URL via `SKYLIT_PREVIEW`.
`node scripts/check_followup.cjs` covers grouped settings, sidebar and bottom tray, compact timer placement, preview/drop agreement, automatic invitation renewal and native service dispatch.
`node scripts/check_editor_photo_stability.cjs` verifies selection and dragging preserve photo image nodes while actual photo updates still refresh.
`node scripts/check_phone_pairing.cjs` covers QR and matching-number approval across four viewports with mocked native state. These mocks do not verify the Android listener, sign-in, Home controls or YouTube playback.

### Live dashboard and General settings

`node scripts/check_dashboard_live.cjs` checks immediate persistence, gesture commit,
reload, storage-failure rollback, selection/removal, reset cancellation and responsive
canvas geometry. `node scripts/check_widget_styles.cjs` captures 24 photo/weather
style and shape combinations. `check_settings_interactions.cjs` now checks General
and live dashboard templates, replacing the previous staged Apply/Cancel contract.
All use a synthetic `SKYLIT_PREVIEW` and optional `SKYLIT_CHROME`.

`node scripts/check_gallery_refinement.cjs` covers gallery scrolling, included states, addition, responsive widths and natural photo proportions at four widget shapes. `check_gallery_touch.cjs` uses Chromium touch events to verify dragging directly from the preview and vertical scrolling without separate handles.

### Phone companion redesign

`node scripts/check_phone_redesign.cjs [screenshot-directory]` runs against an
isolated synthetic preview (`SKYLIT_PREVIEW`, optional `SKYLIT_CHROME`). It checks
pairing before data access, focused navigation, selection confirmation/restore,
visual crop and save failure, saved collection membership, arrival review,
slideshow drafts across tabs, sequential JPEG/PNG uploads and retry, empty states,
320–1920px layouts and expiry cleanup. All endpoints are local mocks. Run
`npm run test:react` for draft races and late-response regressions. Physical phone
certificate acceptance, native storage/upload results and frame playback remain
separate device checks.

### Momo context and phone pairing

Run `scripts/check_momo_context.cjs` against a synthetic preview with
`SKYLIT_PREVIEW` and `SKYLIT_CHROME` set. It captures camera, calendar, rain,
frost, bedtime and still-mode scenes; checks accessory preservation, competing
page requests and bounded rendering. Coordinator tests also cover cooldowns,
Fahrenheit conversion, stale forecasts and hidden/resume behavior.
The pairing browser check covers scan, matching-number approval, rejection,
disconnection and keyboard focus at four sizes. Visual evidence for this pass is
in `docs/reviews/2026-10-13-momo-context/`.

## Dashboard gesture performance regression

With the synthetic preview running, run
`node scripts/check_dashboard_performance.cjs` (also included in CI). It drives the
actual editor pointer handlers and checks unchanged-cell moves/resizes, queued
release/cancellation, compositor-based live resize, native touch-action policy and
hidden-dashboard navigation.
It asserts work boundaries rather than desktop timing thresholds. Profile the
physical frame separately: cached desktop rendering is not a substitute for its
WebView/GPU. During resizing, the existing preview scales until release, when its
responsive typography and artwork settle into the final dimensions.
