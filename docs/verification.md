# Delivery verification — October 11, 2026

## Version 2.14.1 — Clock styles

- Clock & date adds Classic, Analog, Stacked and Digital under Settings → Dashboard,
  with a live staged sample, Save/Discard/Undo and style preservation through
  presets, arrangement and geometry changes. Unknown styles default to Classic.
  Original city time, DST, date, 12/24-hour preference and accessible heading retained.
- 64 JavaScript, 14 Python, 32 clock rendered checks, 23 dashboard checks and 31
  full-app rendered regression checks pass. All four styles across nine viewports
  with both text profiles, minimum/full sizes, persistence, rejected writes and
  format synchronization verified. Zero runtime errors or startup retries.
- Normal signed 2.14.1, code 25, valid v1/v2/v3 signatures, installed in place with
  the same key on identity-verified USB D156 / Android 12 / WebView 95 at 1920×1080
  physical / 1280×720 CSS. Installed APK matches built artifact byte for byte.
- Ten frame checks pass: touch Settings/picker/Save, staged sample, Discard/Undo,
  preset/arrangement preservation, real process restart, every style minimum/full,
  city/12/24-hour labels/live tick, guide with empty fields/Android Back and data
  preservation. Original preferences/style, account, photo cache, calendar config,
  retention/exclusions and HOME restored/verified. Eighteen acceptance screenshots
  remain private; public report uses 33 isolated synthetic captures.
- Private upgrade/undo record copied to Downloads. Temporary inspection disabled,
  task ADB forward removed. No new requests, permissions, native integrations or
  remote fonts. Existing live service functionality was not reverified.
- Public-data source/history/APK and Gitleaks history/source scans: zero findings.
  APK SHA-256: `fac2545b26c551ddaeb211c910579fd387e53ae6ff02e44136609bf07a6f9e99`.
- [Clock styles and responsive screenshots](reviews/2026-10-11-clock-styles/index.html).

## Version 2.14.0 — Modular dashboard

- Settings → Dashboard stages draggable/resizable modules on a 12 × 12 grid,
  with a nine-module gallery, minimum sizes, no overlap, exact fields, keyboard
  alternatives, internal drag scrolling, automatic room-making, Save/Discard/Undo.
- Four original modules preserve their controllers/actions. Hourly forecast,
  Note, Shopping list, Countdowns and Timers share existing service/Household data.
  Removal retains data; empty layouts are supported. Legacy presets/note migrate.
  Custom layouts stay local and are excluded from display-preference transfer.
- 60 JavaScript tests, 14 Python tests, 23 rendered dashboard checks and 31 existing
  rendered regression checks pass. Zero runtime errors or startup retries. Nine
  viewport sizes with both text profiles, all minimum/full sizes/alternate placements,
  storage failure, pointer/keyboard, gallery drag/autoscroll and shared-data actions
  verified. Eighty synthetic captures retained; themes and affected states reviewed.
- Normal signed 2.14.0, code 24, valid v1/v2/v3 signatures, installed in place with
  the same key on identity-verified USB D156 / Android 12 / WebView 95 at 1920×1080
  physical / 1280×720 CSS. Installed APK equals the built artifact byte for byte.
- Thirteen frame checks pass: physical Settings navigation, touch move/resize,
  overlap rejection, gallery/save, all-nine geometry, actual process restart,
  all minimum-size modules, removal/Undo, affected screen captures, reopened guide
  with empty credentials/Android Back, and preserved original data. Twenty-two
  physical screenshots remain private; original layout/preferences, account,
  photo cache, calendar configuration, retention/exclusions and HOME preserved.
- Private upgrade/undo record copied to Downloads; temporary inspection and task
  ADB forward removed. No new service setup or native data migration. Live mail,
  calendar, home control and video playback were not reverified by these UI tests.
- Source/history/APK public-data and Gitleaks history/source checks: zero findings.
  APK SHA-256: `7072af0d2c9ea717cb47bd2d9ced99d9d8e6cd6176f1af4fb2d9672495f6bde4`.
- [Module editor, responsive sizes and screenshots](reviews/2026-10-11-modular-dashboard/index.html).

## Version 2.13.0 — Settings navigation and gallery curation

- Settings uses a left-side category rail inside its lightbox on landscape
  screens, keeping a single scrolling editor, fixed header/Close and underlying
  context. Narrow previews retain the labelled selector.
- Gallery thumbnails have separate 48-pixel trash buttons. Exclusions keep photos
  out of the gallery, Overview and all playback. Private original-file hash rules
  survive Check now, image expiry/pruning and restart; native import checks them
  before saving. Undo/restore remain available, with a 4,096-rule bound and no
  silent eviction. Explicit cache erase/account change/disconnect clears rules.
- Retention offers last 7/30/90/180 days with capacity, or last 10/20/30/40/50
  non-excluded photos without an age cutoff. Count mode reads at most 1,000 recent
  inbox messages; the existing 100-image-part limit remains. All cached images
  together stay bounded to 50. Default and existing retention are preserved.
- 54 JavaScript tests, 14 Python tests and 31 rendered browser checks pass. No
  runtime errors or load retries. Visually reviewed 33 synthetic captures across
  Settings, gallery/Undo, retention, dark mode and landscape/narrow/larger-text
  variants. Public fixtures remain excluded from the APK.
- The actual PhotoStore/Bitmap/JSON code passed 44 isolated Android checks on the
  identity-verified USB D156: every retention option, deduplication, count capacity,
  exclusion after reopening/pruning/reimport, restore/erase and import races.
  Synthetic images and in-memory preferences were used in a temporary directory;
  household cache/account data was untouched by that harness.
- Normal signed 2.13.0 (version code 23), valid v1/v2/v3 signatures. Installed in
  place with the same signing key on Android 12 / WebView 95 at 1920×1080 physical
  and 1280×720 CSS. The installed APK matches the built artifact byte for byte.
- Fourteen physical checks passed: every Settings area, internal swipe with fixed
  header, all nine retention choices through the native bridge, trash, exclusion
  from Overview/slideshow, Check now persistence, Undo, restore, actual app
  restart, Calendar context/Android Back and the reopened guide with empty
  credential fields. No runtime errors. Thirteen physical captures remain private.
- Live Check now reported a mail error. Exclusion remained intact, but successful
  real mail refresh/new import is unverified. Earlier weather/calendar refresh
  failures also remain unresolved. Same-file reimport rejection was verified by
  the isolated Android harness, without household credentials.
- Original preference groups, mailbox configuration, two cached pictures, one
  calendar configuration, retention and exclusions restored and verified. HOME
  and the stock launcher preserved; temporary inspection and the task’s ADB
  forward removed. Private upgrade/undo record copied to Downloads.
- Source/history/APK public-data and Gitleaks history/source-export checks: zero
  findings. APK SHA-256:
  `4bcd1521e14057a043a7e6bcfcbb5880d2c00f2973818487d2d928676faeb6c5`.
- [Report, rules and screenshots](reviews/2026-10-11-gallery-curation/index.html).

## Version 2.12.3 — Settings lightbox

- Settings now opens over the current tab, with a fixed heading, category selector
  and Close button above an internally scrolling editor. Keeps category switching
  in the same context and restores focus on Close/backdrop/Escape/Android Back.
  Navigation and setup links close or reopen the shared editor appropriately.
- Automatic photo/quiet entry defers while Settings is open, in both the Android
  host and browser quiet scheduler. Preference storage formats are unchanged.
- Passed 53 JavaScript tests, 14 Python tests and 29 rendered browser checks. Nine
  viewport sizes, standard/larger text, focus, context, dismissal, scrolling,
  existing photo/calendar behavior and setup routes passed. No browser runtime
  errors or load retries. Visually reviewed 25 synthetic screenshots, including
  every Settings area, dark mode and landscape/narrow variants.
- Built normal signed 2.12.3 (version code 22), with valid v1/v2/v3 signatures.
  Source/history/APK public-data inspection: zero findings.
- Installed in place on the identity-verified USB D156 running Android 12 and
  WebView 95, physical 1920×1080 / CSS 1280×720. Same signing certificate as the
  installed 2.12.2. Saved preference hashes, photo account/configuration, two
  cached pictures and one calendar configuration were preserved.
- Ten physical checks passed: all areas, swipe/internal scroll with fixed header,
  Close/outside tap/Android Back, Calendar/Photos context, reopened guide and empty
  credential fields. Settings stayed open beyond the configured 120-second idle
  delay; no photo interruption. No runtime errors. Thirteen frame screenshots
  remain private. HOME and the stock launcher were preserved; per-launch inspection
  was disabled after testing. Private upgrade/undo record copied to Downloads.
- Earlier weather/calendar refresh failures remain unresolved; this UI acceptance
  did not reverify live service synchronization.
- [Report and screenshots](reviews/2026-10-11-settings-lightbox/index.html).

## Version 2.12.2 — Minimal slideshow controls

- Removed visible text labels from the five player buttons. Retained icons,
  dynamic accessible names and generous touch targets; reduced the control bar
  from 1000 to 600 CSS pixels at its maximum width.
- Passed 53 JavaScript tests, 14 Python tests and seven focused browser checks:
  browse/navigation, dynamic Play/Pause and Zoom/Fit, focus/close, three slideshow
  styles, and control bounds at 1440×900, 1920×1080, 960×540 and 390×844, plus the
  primary 1280×720 canvas. Nine synthetic captures; zero browser runtime errors.
- Built normal signed 2.12.2 (version code 21); v1/v2/v3 signatures verify.
  Source/history/APK public-data inspection: zero findings. Gitleaks 8.30.1
  (official checksum verified) found no leaks in history or the proposed source
  export. No installation or
  device change. APK ready for later physical testing.
- [Updated controls and screenshots](reviews/2026-10-11-controls/index.html).

## Version 2.12.1 — Owner review refinements

- Addressed all eight review comments. Restored Overview's larger cropped prints
  and icon-only arrows; restored Weather's previous visual layout. Kept the wide
  email-photo library, moved source selection and per-picture choices to Settings,
  restored shared-album spacing and added labelled icons to player controls.
- Calendar now has one month/selected-date agenda. Core Refresh, view picker,
  Week/Today functionality and source chips are removed. Saved legacy modes are
  ignored; source visibility and retry remain in Settings. Race, removal and
  today-anchored Overview behavior remain covered.
- Replaced the secondary Settings column with a labelled selector above one
  editor column and a left-aligned heading/separate return. Existing calendars
  precede a collapsed connection form. Inviter review opens a dedicated decision
  view with setup collapsed, without showing connection fields first.
- Passed 53 JavaScript tests, 14 Python tests and 28 reproducible browser checks,
  plus four supplemental screenshot/interaction checks. Reviewed 231 synthetic
  captures at the nine documented viewport sizes and both text profiles, including
  all tabs, expanded Settings controls, player styles/icons, inviter decisions,
  palettes and weather scenes. No runtime errors or first-load retries. No
  horizontal overflow or landscape Overview/Calendar page scroll; month grids fit.
- Built normal signed 2.12.1 (version code 20); v1/v2/v3 signatures verify. Final
  source/history/APK public-data inspection has zero findings; empty household
  configuration and fixture exclusion verified. Gitleaks is unavailable here and
  remains a publication check. No publication occurred.
- No installation or device change. The owner requested the APK ready for later
  device testing; physical upgrade/setup, touch/WebView 95, real mail/calendar/Home
  functionality and unattended reliability remain pending.
- [Refinement report and screenshot gallery](reviews/2026-10-11-refinement/index.html)
  includes the Settings critique, feature map, retained/deferred priorities and
  exact later acceptance checklist. Earlier reports remain historical records.

## Version 2.12 — Adaptive layouts and optional on-frame features

- Implemented the October 11 review with fluid landscape 16:9 and 16:10 layouts,
  bounded Overview presets, larger text and eight shared Settings categories.
  Core Overview/Calendar fit without page scrolling. Household and its Overview
  note are off by default; Home and YouTube navigation are optional. Warm palette
  pairs, astronomical automatic mode, reduced motion and Momo are preserved.
- Added photo favourites/hide/undo, per-photo Fit/Fill and local captions, bounded
  replay preferences, coarse import progress, private exact-address sender rules,
  configurable mail intervals and single-flight/backoff policy. Calendar adds
  Week/Today, loaded-date title search, source visibility and private metadata
  edits. Added local notes/list/countdowns/visible timers, quiet/privacy display,
  curated exact-host YouTube links and strict non-secret preference transfer.
- Final automated suites pass 53 JavaScript and 14 Python tests. Native mail,
  sender, backoff and YouTube policies run in a pure Java harness. Extra Android
  CalendarStore metadata cases are prepared but their device runtime test remains
  pending. Browser checks total 29, with zero runtime errors or reload retries.
- Reviewed 208 synthetic captures, including all main screens, Settings categories,
  player/modes/recovery/setup, twelve palette-mode pairs and nine day/night weather
  scenes. Nine viewport sizes each exercised standard/larger text: 960×540,
  1024×640, 1280×720, 1280×800, 1440×900, 1600×900, 1920×1080, 1920×1200 and
  390×844. No page has horizontal overflow. Overview/Calendar have no landscape
  page overflow or month-grid clipping. Six calendars/long titles/fifty thumbnail
  records are synthetic volume tests, not evidence of real mail deduplication.
- The normal signed 2.12.0 APK (version code 19) builds and verifies v1/v2/v3
  signatures. Source/history/APK public-data checks have zero findings; household
  configuration is empty and demo fixtures are absent from the APK. Gitleaks was
  not rerun in this pass and remains a publication check. No publication occurred.
- The paired TLS wireless frame was unreachable. The owner explicitly requested
  finishing with the APK ready for later device testing. No deployment, device
  settings change, fresh Android install, upgrade or multi-day soak was performed.
  Real mail delivery windows/pruning, private event updates/inviter decisions,
  quiet first-touch/lifecycle behavior, Home operations and deep-link playback
  remain unverified. The report includes the exact later acceptance procedure.
- Full implementation report and capture manifest:
  [October 11 implementation report](reviews/2026-10-11-implementation/index.html).
  Original review remains available for before/after comparison. Frame screenshots
  and household setup evidence must remain private.

## Version 2.11 — Weather scenes and duplicate-free collage

- Nine scene states now cover the supported Open-Meteo current conditions: clear,
  partly cloudy, cloudy, fog, rain, snow, rain showers, snow showers and storms.
  The condition label remains visible. Both Overview and Weather use the same
  mapping, with a moon/night variant when the forecast reports night. Synthetic
  previews were visually checked for clear, fog, snow, storms and night showers;
  the physical frame showed its live cloudy-night forecast. Other live conditions
  will need to occur naturally for an on-device visual check.
- The small Overview photo label is gone; the entire stack remains a named touch
  target. Prints are larger and slightly extend past their grid area. Updated public
  screenshots use only the synthetic preview. The 1280×720 frame viewport and a
  390×844 narrow viewport had no horizontal page overflow.
- A regression test first reproduced the collage's repeated index with one saved
  picture. Collage now uses one, two or three unique images and clears unused
  slots. The isolated two-photo preview showed distinct images; the actual frame
  showed its two existing cached images once each, swapped them on automatic
  advance, and faded the controls. The prior Soft fade preference was restored.
- The signed 2.11.0 APK (version code 18) passed signature verification, public
  source/history/APK inspection and Gitleaks history/source scans. It was installed
  in place on the identified USB-connected Android 12 D156. The original Skylight
  app and Skylit HOME role remained intact; the frame was left on Overview. The
  final suite passed 44 JavaScript and 13 Python tests. No long-term unattended
  slideshow test was run in this update.

## Version 2.10 — Photo library and slideshow presentation

- Overview now fits a clock, illustrated weather, up to three upcoming events and
  loose local-photo prints at the tested 1920×1080 physical resolution. The photo
  treatment is absent when no local email photos are selected. The actual frame
  showed its two existing saved test pictures in Overview without exposing them in
  the public screenshot set.
- Photos now leads with a thumbnail library and direct browsing; the setup controls
  remain in Photo settings. The physical frame displayed its two cached pictures,
  opened the first picture, advanced to the second and zoomed it. An in-place
  upgrade preserved the existing email connection and cache.
- Soft fade, Falling prints and Photo collage are selectable for local pictures.
  Falling prints and collage rendered on the physical frame using its two saved
  pictures; collage repeated a picture to fill its third position as designed.
  Themed controls disappeared after inactivity on the frame. The isolated browser
  preview confirmed they remain hidden across automatic slide advance and return
  after a manual Next action. The original Soft fade preference was restored after
  the physical test, and the frame was left on Overview.
- Public screenshots show generated sample pictures with synthetic events/weather in
  Linen and Ocean dark. The preview was inspected at 1280×720 CSS pixels, 1440×900
  desktop and 390×844 narrow viewports. No horizontal overflow was observed. The
  full photo set was reviewed only in the isolated preview; the normal APK contains
  no sample fixture or household photo.
- The signed 2.10.0 APK (version code 17) passed signature verification and was
  installed in place on the Android 12 D156 over identified USB. The final suite
  passed 42 JavaScript and 13 Python tests; public-data inspection found zero
  findings in source, history or APK. Gitleaks found no secrets in Git history or
  a separate export of the proposed 95 source files. No fresh-install or long-term
  unattended slideshow test was run on the household frame.

## Version 2.9 — First-run guide and live email-photo test

- Added an on-frame setup guide for city, photos and calendar, with direct routes to
  the existing controls and a Settings entry to reopen it. A saved settings record
  suppresses auto-opening during upgrades. A fresh browser launch, dismissal and
  reopening are covered by focused tests; a destructive fresh-install test was not
  run on the configured household frame.
- Two synthetic, generated images were emailed to the dedicated frame inbox. The
  frame's manual IMAP check imported both, then showed **2 saved photos**. The
  native slideshow displayed picture 1, advanced to picture 2 automatically, and
  kept a saved picture visible during a brief Wi-Fi-off test. It also started
  automatically after the configured two-minute idle period; one tap returned to
  Photos. Wi-Fi was restored; IPv4, IPv6, router, internet and DNS checks then
  passed. The images and private device captures are excluded from the public
  repository and APK.
- Signed 2.9.0 (version code 16) built with empty household defaults, passed
  signature and public-data checks, and installed in place on the identified
  Android 12 D156 frame over USB. The existing city, calendar, email connection,
  two cached pictures and HOME behavior remained intact. The guide reopened from
  Settings and its Photos action reached the connected photo tab. The upgraded
  frame continued to open Overview rather than interrupting the household.
- The guide was inspected at the frame's 1920×1080 physical resolution and at
  1280×720, desktop and narrow browser viewports. 40 JavaScript tests and 13
  Python tests passed. Gitleaks found no secrets in Git history or the proposed
  source tree; the APK inspection found no household data.
- The photo last-check label used Android's GMT timezone, four hours ahead of
  the configured city. It now formats in that city's timezone. A
  due-check guard also retries if the device clock ever moves backward.
- Manual slideshow, idle entry/return and offline rendering are verified. Long-term
  mail polling, age pruning and a fresh Android installation remain unverified. The earlier
  2.8 entry records the state *before* the email-photo connection and test.

## Version 2.8 — Photos and inviter review

- Added a local email-photo importer, Android Keystore-protected app password,
  bounded private image cache and Skylit slideshow controls. Shared-album playback
  remains available and is still the default.
- Added organizer parsing and an optional on-frame approved-inviters rule across
  Calendar and Overview. This does not alter Google Contacts or Calendar's account
  invitation setting.
- 36 JavaScript tests and 11 Python tests passed, including organizer inheritance,
  review policy, private image URLs, native retention/size limits and multipart
  image extraction with the pinned mail libraries. A signed
  2.8.0 APK built and passed Android signature verification. Source/history/APK
  public-data scan found no file-content findings. A clean public export later
  replaced the metadata-bearing development history.
- A synthetic 1280×720 preview was inspected for the Photos empty state, Calendar
  month and inviter panel. No personal pictures or events were used.
- On October 10, the signed 2.8.0 APK (version code 15) was installed in place over
  the explicitly selected USB transport on the Android 12 D156 frame at 1920×1080.
  The configured serial matched; the original Skylight app remained installed and
  Skylit remained HOME. Overview, Photos, Calendar, inviter review and the email
  setup form were visually checked on the frame. The existing shared-album source
  was restored after viewing the email empty state.
- No Gmail app password was entered. Real image import, cache pruning, offline
  playback and idle return for the new email source are **not verified**. Inviter
  review remains off, with no approved addresses or real test invitation; its
  approval/removal flow is not verified against Google Calendar.
- The first household-calendar refresh failed. The initial claim that Wi-Fi had no
  IPv4 lease or route was **incorrect**: Android 12 left the legacy
  `dhcp.wlan0.ipaddress` property and main route table empty, while a later direct
  check found an IPv4 address and a working policy route. One Wi-Fi off/on cycle
  was performed, without changing router or saved-network settings. The earlier
  snapshot alone does not establish when connectivity recovered.
- Later, the frame reached the router, public IPv4 and IPv6 addresses, and Google
  Calendar by DNS. A manual Calendar refresh succeeded. A temporary private,
  reminder-free event added to the household account appeared in Skylit's month
  and agenda views on refresh; after deletion in Google Calendar, it disappeared
  from both on the next refresh. The test event was removed. This verifies live
  add/remove sync for the configured household feed, not invitation approval.
- Android's retained log showed repeated failed IPv6 link-local neighbor probes
  during the earlier problem window. It does not prove whether the router, access
  point, frame driver or another link caused them. A later 24-sample probe showed
  stable IPv4, IPv6, router and DNS reachability. See [wireless setup](wireless.md)
  for the repeatable diagnostic check.
- A first two-capture spot check showed the same photo and was inconclusive. A
  repeated timed check captured five private frame images eight seconds apart;
  each showed a different album photo. Automatic advance and Skylit's return
  control worked in this run. The frame also passed IPv4, IPv6, router and DNS
  checks. This verifies current playback, not long-term third-party reliability.
- The clean public source export began at commit `5099cb11cef368112b79d976905de0108297a2d3`.
  Its sole commit used a GitHub noreply address; the earlier development repository
  was retained privately. No APK was uploaded as a GitHub release. The locally built
  normal APK has SHA-256
  `8db92d2d1288bab1e7d1992fb1a52c8e2bb042ace6b36e3feacb300e3ae9fe70`;
  Android SDK 34 `apksigner` verified its v1, v2 and v3 signatures.
- See [photo setup](photos.md), [calendar setup](calendar.md) and the
  [feature review](feature-review.md) for activation, limits and acceptance tests.

Tested on the actual 1920×1080 Android 12 frame and in desktop Chrome.

**Release-status update — October 10, 2026:** The owner removed the former
license-clarification gate. References to that gate in the historical entries below
are superseded; see docs/releasing.md for the current release procedure.
The public source repository was prepared as a clean export with a GitHub noreply
commit identity; the earlier development history remains in a separate private
archive. No personal APK or household setup record is published.

## Passed

- Signed APK built with JDK 17 / Android SDK 34, verified and installed in place.
- Four tabs rendered: Weather, Photos, Home, Settings.
- Real Richmond Hill weather fetched from Open-Meteo; current, hourly and daily data rendered.
- Clock uses America/Toronto. Desktop 24-hour setting and city search checked.
- All three themes selected and visually inspected on the frame. Desktop theme survived reload.
- Supplied shared album loaded without sign-in. Native menu automation started a slideshow;
  successive actual-device captures showed different photos. Touch returned from idle photo mode.
- Default HOME survived a device reboot and dashboard reopened automatically.
- Two-minute idle timer fired after reboot; configured album and delay survived startup.
  After the Wi-Fi recovery, a fresh full idle test opened photos at 23:29:13 local
  after the last touch at about 23:27:12. Slideshow auto-started at 23:29:27,
  successive captures showed different photos, and one touch returned to weather.
- Home page reached Google sign-in. Existing Chrome household UI confirmed lights and thermostat.
- Disabled package list unchanged from baseline. Original app and watchdog remain enabled.
- Private GitHub source excludes local configuration, signing key, APKs and family screenshots.

## Observed issues and limits

After the reboot, Wi-Fi reported a connection problem and weather/Photos could not
load. A Wi-Fi off/on cycle was followed by Android's validated internet connection;
live weather then refreshed. The old claim that this proved a missing IPv4 lease
was based on legacy Android fields and is withdrawn. No router setting, saved
network, or credential was changed. The cause remains undetermined.

Weather now retries failed requests after one minute, retains cached data with an
explicit saved-data message, and also refreshes on the browser online event.

Google Home account sign-in and device operations on the frame are not verified.
No thermostat, light, lock, speaker or account settings were changed. Google may
reject authentication on the older embedded browser.

No claim of long-term unattended stability, slideshow looping, immediate discovery
of newly added album photos, offline photo playback, or consumer Keep API access.
Two-finger stock-app gesture and deliberate renderer-crash recovery not physically tested.

## Follow-up

Finish Google Home sign-in on the frame, verify supported controls, then investigate
an authenticated shared Keep note for the voice shopping-list phase. If connectivity
fails again, run the route and reachability probe in docs/wireless.md while the
failure is present before attributing it to DHCP or the router.

## Version 2.1 — October 10, 2026

- Added and visually checked the Netflix tab on the physical frame.
- Netflix returned **Update required** / unsupported browser, operating system or device.
  Playback is blocked, not verified. The tab reports this limitation explicitly.
- Built and verified signed version code 3; installed successfully over paired TLS Wi-Fi ADB.
- Verified both Wi-Fi and developer-options shortcuts reached their intended activities.
- Four discovery-helper tests passed: exact device match, TLS-only connect service,
  connected-transport reuse, and invalid-endpoint rejection.
- Restart retained pairing but disabled wireless debugging. A Wi-Fi connection
  problem was observed again; the older DHCP attribution was not established.
  Reconnecting Wi-Fi and allowing wireless debugging again restored the connection.
  A second install over Wi-Fi succeeded without re-pairing. See docs/wireless.md.
- No system packages disabled. Original app remains present, and baseline disabled NFC unchanged.
- Updated on-device setup log verified against the Mac copy using SHA-256.
- User completed the separate Google account signup; signed-in identity verified in Chrome.
  Family album is viewable from that account through the shared link. Direct album invitation
  is prepared and awaits final access-grant confirmation. Home invitation remains pending
  the Google Home mobile app. No password set or 2FA configured by this setup; no account
  session copied to the frame.

## Version 2.2 — Momo

Replaced the sidebar wordmark with a procedural Canvas 2D companion. Added twelve
expressive reactions, gaze/scroll response, eleven accessories, persistent wardrobe
and motion settings, reduced-motion handling, and native/visibility pause hooks.
Five focused tests pass. Browser interaction checks and physical frame rendering /
wardrobe shortcut verified. See docs/momo.md for controls and verification scope.

## Version 2.3 — Momo gallery and daily rhythm

Twelve routine/rendering tests pass, including midnight, daylight-saving repeated hour,
night snoozing, morning yawns, gallery selection and daily-outfit persistence.
Chrome gallery and reload checks passed without captured console errors. Signed
version code 5 installed over paired TLS ADB. Gallery rendered on the physical
frame; New clothes every day enabled and selected beanie verified.

## Version 2.4 — YouTube, Calendar and distribution preparation

- Replaced Netflix with YouTube; the mobile site loads and search works on the frame.
  A public NASA video played, with elapsed time observed advancing from 0:43 to 1:05.
  Full-screen video and the Skylit return button both worked. Desktop layout is
  selectable but its video playback has not been separately verified.
- Added Google Calendar’s official web view with a saved, validated Calendar URL.
  Calendar URL rejection and persistence, plus YouTube layout persistence, checked
  in Chrome. The official “Sign in to continue to Google Calendar” screen renders correctly
  on the frame. Authenticated events/editing still require the owner’s frame sign-in.
- A clean browser starts without any album, household or location configured.
  An in-place frame upgrade preserved the existing weather/photo/Momo settings.
- Standard APK builds now use an asset allowlist and blank household config;
  private config requires explicit `--personal` and produces a differently named APK.
- Twelve JS tests and seven Python tests pass. Signature verification passes.
- Gitleaks 8.30.1 found no secrets in the original six commits or proposed source
  export. Additional all-blob and APK checks found no private album/account/household
  or device identifiers. This is a targeted publication check, not a full security audit.
- Commit metadata contains a personal author email. Public release must resolve it
  along with the upstream Android code’s missing license; no history was force-pushed.
- README, AGENTS, architecture, household setup, credits and release instructions
  are prepared. CI runs the source tests and privacy checks. Repository remains private.
- Android backup disabled and unused generic URL-handler intent filter removed.
  No system apps disabled, firmware changed, account permissions changed, or sessions copied.

### Hosted checks

The first GitHub Actions run did not execute any steps: GitHub reported that the
account’s Actions budget prevents further use. The equivalent 19 tests and privacy
checks passed locally. No billing settings were changed. Hosted CI success remains
unverified until the account permits a runner to start.

## Version 2.4.1 — Google sign-in redirect fix

The password-submit page remained dimmed with a progress bar. The last navigation
logged was to `gds.google.com`, a Google destination absent from the remote WebView’s
exact host allowlist. A test using the production navigation policy failed with
“Calendar password-submit redirect is blocked.” Adding this exact HTTPS hostname
for Google and YouTube sign-in made the test pass. Lookalike domains, HTTP and
unrelated hosts remain rejected. A blocked main-frame navigation now shows a notice.

After installing the upgrade, Calendar opened using the existing session without
another password entry. No credentials were inspected, copied or submitted by the
agent. Google displays an unsupported-browser banner for this frame’s WebView 95;
compatibility remains limited to the interactions actually verified.

The 12 JS and 8 Python tests pass, including a JDK-backed native navigation test.
Public-source/APK checks pass apart from the previously documented history metadata
review. This fix was installed over paired TLS ADB, preserving settings and app data.

Physical verification: dismissed the introductory notices, navigated from October
4–10 to October 11–17, and saw the Canadian Thanksgiving holiday render. Returned
to Today. No calendar events were created or edited. The sign-in stall is resolved;
full calendar feature compatibility and event editing are not yet certified.

## Version 2.5 — Integrated calendar

- Replaced the website shortcut with a themed month grid and two-week agenda, date
  navigation, event details and guided private Google iCal setup. No hosted service.
- Actual Android 12 / WebView 95 frame fetched Google's public Canadian holiday feed
  directly over HTTPS and showed Thanksgiving, Halloween and the DST transition.
  The temporary test source was labelled explicitly and removed after verification.
- Warm linen, Evening cocoa and Garden sage inspected on the physical frame at
  1920×1080. All six month rows fit. Original Warm linen preference restored.
- Feed configuration and saved events survived an in-place signed APK upgrade.
  Browser preview verified month navigation, details and the saved-data/error state
  using a public-data fixture; that fixture is not bundled in the application.
- 19 JavaScript tests and 9 Python tests pass. Calendar tests include all-day exclusive
  ends, overnight/floating times, weekly DST transitions, EXDATE, moved/cancelled
  occurrences, malformed feeds, unknown timezones, download size and URL boundaries.
- Isolated CalendarStore tests passed on Android using in-memory preferences and
  simulated downloads: network/parse failure keeps the prior cache, rejected/stale
  responses cannot overwrite it, removal deletes the URL and events, snapshots omit
  URLs, and removed calendars cannot be restored by in-flight responses. Run with
  `python3 scripts/test_calendar_device.py` when a paired frame is available.
- The standard APK has blank household configuration; signing and source/APK privacy
  checks pass. Private-feed detection was added to the publication check. ICAL.js
  2.2.1 is pinned, integrity-checked and bundled with its MPL-2.0 license.
- No household feed has been entered. Its private access and an owner-made event
  change must still be verified during setup. Actual Wi-Fi disconnection was not
  induced for this test; cache failure handling was tested without disrupting Wi-Fi.
- No accounts, router settings, system apps, firmware or HOME selection changed.
  The existing photo, weather, Momo and remote-service settings are preserved.

## Version 2.6 — Overview and appearance

- Added the default Overview with clock/date, shared forecast and a current-date
  upcoming list. Android Back returns there. Sidebar clock and calm link removed.
- Six paired palettes and Light/Dark/Automatic settings. The physical frame selected
  dark automatically before sunrise; manual Light and an Ocean/Automatic switch
  worked. Left on Linen + Automatic. Settings and daily Momo outfit survived upgrades.
- All seven tabs inspected on the 1920×1080 Android 12 / WebView 95 frame and Chrome.
  Desktop and narrow layouts inspected; the narrow calendar has no horizontal page
  overflow. Calendar grid, +N, month/Today navigation and event details checked with
  synthetic data; the actual frame remains unconfigured for household feeds.
- 29 JavaScript tests and 9 Python tests pass. Added solar/DST/polar/date-line cases,
  twelve palette contrast checks, overview selection/freshness, and calendar worker
  races/removal. The count is tests, not a coverage percentage.
- The synthetic forecast fixture initially intercepted unrelated fetches and caused
  intermittent preview module loading. Scoped the mock to its forecast endpoint;
  added a regression test and verified three consecutive complete reloads.
- Four public screenshots contain only explicitly synthetic data. README, agent
  directions, architecture, design critique and testing guide updated.
- Signed 2.6/version code 9 built and verified, installed in place over paired TLS
  ADB. Source/history/APK privacy check and Gitleaks history/source export pass.
  The ordinary APK has blank household configuration and excludes demo fixtures.
- Upstream GitHub still reports no license; repo remains private. Historical author
  metadata still needs a reviewed cleanup/clean export before publication. Hosted
  CI has not been certified successful; the latest prior run failed to execute
  because of the account's Actions budget. Local checks above ran successfully.
- No device clock, account, router, firmware, HOME selection or installed-app disable
  state changed. No live event editing, new account sign-in, Home operation or new
  video playback was claimed from this UI pass. Solar boundary transitions were
  tested with fixed unit dates, not by changing the frame's system clock.

## Version 2.6.1 — Softer regular palettes

- Restored original Linen, Cocoa (Linen dark), and Sage light colours. Softened
  text and dividers in the additional regular palettes. High contrast remains
  unchanged and opt-in, with focused AA text/control contrast tests.
- Preserved Overview, calendar layout, all themes and sunset switching. Settings
  now names the active palette and resolved mode. Browser origins and the frame
  store preferences independently; Ocean dark is blue, Linen dark is warm brown.
- 29 JavaScript tests and 9 Python tests pass; signed 2.6.1/version code 10 built,
  verified and installed in place over paired TLS ADB. All seven local tabs
  inspected on the 1920×1080 frame; Linen + Automatic retained and confirmed dark
  before sunrise. No household configuration, system settings or app data changed.
- Chrome screenshots refreshed for Linen overview/calendar/settings and Ocean
  dark using synthetic data only. Warm Linen dark also visually checked. Browser
  automation timed out during final preview preference cleanup; the frame's
  verified Linen/Automatic state is independent of that preview.
- Source/history/APK privacy checks pass. Public-release license and historical
  author-metadata limitations from 2.6 remain unchanged.

## Version 2.7 — Overview redesign

- Larger clock with separate AM/PM, full date, shared Weather landscape, current
  temperature/high/low and rain/wind/sunset. Removed redundant service shortcuts.
  Preserved the softer palette tokens, settings, Momo and current-date agenda.
- 29 JS and 9 Python tests pass. Signed version code 11 built and verified;
  source/history/APK privacy check passes.
- Inspected Chrome at 1280×720, 1920×1080 and 390×844; light, warm dark and Ocean dark,
  12/24-hour display and Weather/Calendar drill-downs checked. Refreshed both public
  overview screenshots using synthetic data. An initial preview load omitted Momo;
  reload rendered it normally, and the installed frame renders it correctly.
- Installed over paired TLS Wi-Fi with USB disconnected on the Android 12 frame.
  Overview and Weather render correctly at 1920×1080; real night forecast produces
  the moon artwork. Existing Linen/Automatic and household settings retained.
- The actual frame still has no household calendar feed configured. Populated
  overview events were visually checked only with the synthetic browser fixture.
  No system, account, router, firmware or launcher changes.

## Version 2.7.1 — Card-based overview

- Clock/date, weather and upcoming events now use matching cards; softer colour
  tokens, large clock, artwork and sidebar navigation preserved.
- 29 JS and 9 Python tests pass. Signed APK verified and installed in place over
  paired TLS Wi-Fi on the Android 12 frame; actual Overview inspected.
- Chrome inspected at 1280×720, 1920×1080 and 390×844. Five synthetic events fit
  without page overflow at frame resolution. Light and dark screenshots refreshed.
- Source/history/APK privacy and Gitleaks checks pass. No household, launcher,
  account or system settings changed; setup record updated privately.

## Version 2.7.2 — Overview spacing and agenda

- Compact clock/date card above the illustrated weather, with Upcoming beside both.
  Removed stretched weather whitespace, grouped event dates, enlarged supporting
  text and hid repeated single-calendar labels. Healthy refresh timestamps remain
  in detailed tabs; Overview retains stale/offline/missing-data warnings.
- 30 JS and 9 Python tests pass, including grouped dates and offline warning
  coverage. Signed APK version code 13 built and verified. Source/history/APK
  privacy scan and Gitleaks history scan pass.
- Light and Ocean dark previews checked at 1280×720 CSS pixels, plus desktop
  1920×1080 and narrow 390×844. Public overview screenshots use synthetic data.
  Calendar's populated layout inspected. As noted in 2.7, the first browser load
  omitted a module; reloading restored Momo and calendar. No such omission was
  seen on the installed frame.
- Installed in place on the Android 12 D156 frame over paired TLS wireless ADB.
  Overview and Calendar inspected at 1920×1080 physical resolution. Existing
  Linen/Automatic, household settings and app data retained; no system changes.
- No household calendar feed is connected; this pass does not claim live calendar
  synchronization. Private setup/restoration record updated on Mac and frame.


## Version 2.7.3 — Momo sidebar simplification

- Removed the hanger shortcut beside Momo. Clothing and daily wardrobe controls
  remain in Settings; tapping Momo still triggers his expressions.
- All 30 JS and 9 Python tests pass; signed APK and source/history/APK privacy
  checks pass. Inspected the sidebar across seven tabs in the synthetic preview,
  clothing selection, light/dark, frame-size, desktop and narrow layouts.
- Installed in place over explicitly selected USB on the Android 12 D156 frame.
  Calendar and Overview retain their settings; connected calendar data survives
  the upgrade. Public screenshots use synthetic fixtures only.
