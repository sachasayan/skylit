# Architecture

`src/` contains the React 18 / TypeScript rendering layer. `web/` contains bundled
assets, the reusable service and preference adapters, and the canvas companion. Settings are saved
under `skylit.settings` in localStorage; Momo maintains its own preferences. A fresh
install has no city, album, household identifier, calendar ID or account baked in.
The clock uses the device timezone until a city is selected.
`onboarding.js` opens the guide only when neither saved dashboard settings nor a
private local configuration exists and no explicit route was requested. Dismissing
it stores a small completion flag. Existing installations are not interrupted, and
Settings can reopen the guide. The guide reads only coarse setup status (city,
photo connection, calendar count), never a mail secret or calendar URL.

`android/` serves reviewed bundled assets from a virtual HTTPS origin. Only that
local, navigation-restricted WebView receives the small `Skylit` JavaScript bridge.
Google Photos opens in a separate full-screen WebView. Home and YouTube open directly from their tabs in a separate WebView beside the dashboard sidebar
without the bridge. Remote top-level navigation uses exact HTTPS host allowlists.
Third-party sites still load their own subresources. Remote pages share WebView’s
cookie store, but no login tokens are read or transferred by the dashboard.

The native viewer owns the idle timer. It is suspended while an external service is
open. Photo idle mode returns on the first touch. Docked Home/YouTube views retain the Skylit sidebar; full-screen remote views and video provide a return button. Momo stops animation while
hidden or covered. Android backup is disabled; remote debugging is opt-in per launch.

`build.py` uses JDK 17, aapt2, javac, d8, zipalign and apksigner without Gradle.
`assets.py` copies a fixed asset allowlist. Ordinary builds always overwrite local
config with an empty object; only explicit personal builds embed it. Signing keys,
SDKs, frame connection settings, logs and screenshots stay under ignored `.local/`.

No server receives your photo links or account credentials. Weather queries go to
Open-Meteo with your selected coordinates; each opened website receives its normal
web requests. External integrations depend on those services’ current compatibility.
Google Photos slideshow automation uses visible menu labels and may need maintenance.

## Calendar feeds

Calendar uses Skylit's own HTML/CSS month and agenda interface. `calendar-model.js`
uses the pinned ICAL.js parser in a worker, with bounded expansion and a time limit.
The worker resolves supplied VTIMEZONE data and recurrence exceptions. Calendar text
is rendered using textContent; feed content never becomes executable HTML.

`CalendarStore` keeps URLs and last-good ICS data in private Android SharedPreferences
(separate from dashboard localStorage, and excluded from Android backups). Its bridge
snapshots omit feed URLs. `CalendarFeed` downloads only the supported Google HTTPS
feed paths, with no redirects or browser-session transfer. Network failures retain
cached events. Successful downloads are staged until worker parsing succeeds; only
then does the native store replace its cache. Request IDs prevent deleted calendars
or responses from a previous renderer from restoring obsolete data.

No server or Google OAuth project is involved. The frame refreshes every 15 minutes
while the dashboard runs, retries failed/stale feeds on its minute timer, and refreshes
on startup or reconnection. Private setup is performed on the frame. Desktop browser
previews have no native feed bridge and cannot save calendar credentials.

The optional organizer rule is a local display policy. `calendar-model.js` retains
normalized organizer addresses, including on recurrence exceptions; `calendar-policy.js`
filters both visible-month events and the separately anchored Overview expansion.
The full parsed events remain in memory so approving an address restores them
without another download, while feed removal clears both full event lists.
Approved addresses and the owner's address live in the dashboard's localStorage;
ICS URLs remain in native private storage. The rule cannot make an invitation appear
if Google's account setting omitted it from the feed.

## Email photo cache (2.8)

`PhotoMail` connects to Gmail's TLS IMAP endpoint in read-only mode using a Google
app password entered on the frame. The password is sealed with an Android Keystore
AES-GCM key and bound to the account address. It never reaches web assets or the
remote service WebViews. `PhotoPolicy` centralizes limits; `PhotoStore` keeps only
deduplicated, resized JPEGs in app-private storage and deletes expired/excess files.
Successful checks set a last-checked time, and failures retain usable pictures.
Each check has a 120-second total deadline and a cancellation token that closes
its tracked TLS sockets using the default trust store and hostname verification.
IMAP attachment fetches use bounded 256 KiB chunks to avoid excessive round trips.
Disconnect/erase cancel immediately; stale workers cannot publish photos or mark
a later check successful. Malformed MIME/base64 parts are isolated within a
bounded walk, while connection failures still fail the check.
The Android viewer intercepts only exact local HTTPS photo paths for the local
dashboard; remote web content gets neither private photos nor the bridge.

The Photos UI selects either the existing Google Photos website or Skylit's local
photo library and slideshow. Thumbnail browse opens at a bounded index, and the
native bridge serves only approved local photo URLs. Manual playback has five
presentation styles and theme-bound controls that fade after inactivity; idle
playback hides controls and returns on first touch. The source, speed and presentation
live locally; secrets stay
out of browser localStorage. No backend, Android account provider, Play services or
email body cache is involved. The importer is bounded to recent inbox messages,
and its app-password scope is broader than photo-only access; a dedicated account
keeps that exposure narrow. See [photo setup](photos.md) and [verification](verification.md).

## Appearance and overview (2.6)

`appearance.js` owns paired theme tokens, legacy preference migration, and solar
mode decisions. SunCalc 1.9.0 runs locally: solar altitude below -0.833° is night.
`weather-art.js` maps supported Open-Meteo codes to nine illustrated scene states;
`weather-art.css` renders them from palette colours in both the Overview and Weather
cards. The scene follows the forecast's current day/night flag, independently of
the dashboard's manual palette mode. No fetched image assets are needed.
The next sunrise/sunset label uses predicted times, formatted in the selected city
zone. The clock checks every 15 seconds and on visibility/remote return. Manual
Light/Dark overrides the sun; invalid/missing coordinates follow system appearance.
Polar night/day works without inventing a sunrise. This changes dashboard colours,
not panel brightness or third-party websites. Legacy Cocoa becomes Linen + Dark;
other old themes default to Automatic. Device time must be correct.

The default Overview consumes the same forecast/cache as Weather and shows up to
three private local photo thumbnails when available. Its read-only
calendar summary uses a separate bounded current-date expansion when the visible
calendar month is outside today's two weeks. Generation IDs discard stale worker
completions. Removing a feed immediately removes its overview events. The overview reuses the
Weather page’s day/night landscape and forecast, without another network request.
Clock numerals and day period are formatted separately from the selected timezone
and 12/24-hour preference. Service navigation stays in the sidebar.

`overview-model.js` holds event selection and weather freshness decisions. Preview
fixtures remain outside the APK allowlist. `scripts/preview.py` serves a disposable
public-asset copy on loopback with cache disabled; it never stages personal config.

## Focused settings and local utilities (2.12)

`workspace.js` arranges existing editors into Settings categories and provides shared
contextual return routes, coarse recovery status and optional Household tools.
`frame-model.js` holds bounded preference/utility/curation rules, date arithmetic,
quiet schedules and the explicit display-transfer allowlist. These remain plain
local JavaScript; no framework, hosted service or phone synchronization was added.

`skylit.frame` stores display/playback/quiet preferences; `skylit.household` stores
notes, shopping items, countdowns and visible timers. Timers survive restart as end
timestamps but promise no background alarm, sound or phone notification. Photo
favourite/framing/caption choices are bounded by current hashed IDs and a native
cache epoch, cleared when an account changes or its cache is erased. Native
exclusion hashes are separate, survive image pruning and are checked before an
attachment can enter the cache. They are bounded to 4,096 and clear only through
restore, account change or explicit cache erase/disconnect. Hidden items are excluded before every
playback/Overview selection. Calendar visibility is an independent display rule
applied after inviter approval; the month/selected-date agenda is the only view.
Legacy Week/Today choices are ignored. Source metadata stays in native private storage.

`MailImportPolicy` defines permitted intervals, automatic error backoff and exact
From-address matching before saving attachments. Delivery settings (including the
optional sender list) stay in private native preferences; coarse status snapshots
omit that list. Manual checks remain single-flight and may bypass automatic backoff.
The native minute checker schedules due work while the activity exists; this is not
a background Android service. Dedicated-inbox, TLS and read-only constraints remain.

Native idle checks ask the local dashboard whether quiet hours apply in the chosen
city zone, guarded against a touch/remote/player race before showing the quiet clock.
Manual privacy pause masks the shell and pauses Momo. Restore returns to Overview;
active external content/manual browsing is not interrupted automatically. Hardware
brightness is unchanged. Local calendar metadata edits preserve the private URL and
last-good feed and cannot be overwritten by a pending accepted refresh.

Owner-curated YouTube links are limited to canonical watch/playlist routes on the
exact supported hosts, checked in JavaScript and independently at the native bridge.
They open the existing isolated remote WebView and carry no privileged bridge.

In 2.12.1, Settings uses one editor column and a category selector above it. Inviter
review has a separate panel, sharing the existing controller and approval storage.
Photo source, per-picture choices and playback preferences stay in Settings; the
player exposes only transport and zoom. Overview prints and Weather presentation
return to their 2.11 arrangement while retaining adaptive landscape bounds.

In 2.12.3, `workspace.js` moves that editor into a body-level Settings dialog. The
active dashboard tab remains underneath. A fixed heading/category/close region
sits above an internally scrolling editor. The dialog traps keyboard focus, masks
the shell from accessibility navigation, and restores the original focus on
Close, backdrop click, Escape or Android Back. Explicit app navigation closes it.
The Android idle callback defers automatic photo/quiet entry while Settings is
open; browser quiet scheduling follows the same rule. No preference storage
format changes. The implementation uses APIs supported by WebView 95.

In 2.13.0, Settings has a left-side category rail inside its dialog and uses the
labelled selector only on narrow previews. Native photo retention accepts 7/30/90/180
days or a zero-day count mode. Count mode reads the most recent 1,000 inbox messages
without an age cutoff; all modes retain the existing 100-part per-check limit.
`PhotoStore` gives visible pictures their selected capacity first, retains excluded
cached copies for Undo only when space remains, and caps all images together at 50.
Network reads, decode/rotation, JPEG encoding and temporary-file writes happen
outside the cache monitor. Publication, exclusion and pruning share a short lock;
a generation fence prevents an erased cache from being repopulated by old work.
Active temporary files survive pruning; abandoned ones are removed at startup. Exclusion
hashes are available only to the local dashboard; stale callbacks reread current
native rules before rendering. Legacy hidden choices migrate to native exclusions.


In 2.14.0, `dashboard-model.js` validates a versioned layout with nine known module
types and integer positions/sizes on a 12 × 12 grid. It rejects overlaps, duplicate
types, invalid sizes and unknown records, and strips fields outside the layout
schema. An absent layout migrates the previous preset and optional note excerpt.
An explicitly empty dashboard is valid. `skylit.dashboard` stores only module
identifiers, coordinates and an optional allowed clock-style identifier; household
data remains in the existing stores.

`dashboard.js` moves the four existing Overview nodes into grid wrappers, retaining
their IDs, controllers, service state and event actions. Five additional modules
read existing hourly weather and Household state. Shopping actions use the same
storage/Undo path as Household. Countdown dates use the configured city zone and
update at local midnight; timers remain visible reminders without background alarms.
There are no new requests, permissions or service integrations.

The Dashboard Settings editor uses a transient gesture draft. Completed changes
save immediately; a storage failure restores the saved layout. Pointer capture,
cancellation, internal autoscroll and keyboard alternatives support placement and resizing. Tap-add can compact modules into a
three-column layout when necessary; direct drop requires free space. ResizeObserver
chooses compact styling from actual module dimensions, without container queries.
CSS grid scales coordinates across landscape sizes; narrow previews stack in visual
reading order. Existing display-transfer format v1 excludes custom dashboard layouts.


In 2.14.1, `clock.js` builds local SVG analog and stacked-number presentations.
Classic uses the original serif clock; Digital changes its typography. The
`skylit-clock` event carries the original tick instant, so all presentations use
the configured city zone, DST and 12/24-hour format together. The original clock
heading remains the accessible current-time label; decorative alternatives are
hidden from assistive technology. Clock style is staged with the layout and
preserved by presets, packing and geometry edits. Unknown styles fall back
to Classic. No seconds animation, remote fonts, requests or new permissions.

## Local slideshow suite (2.15)

`slideshow-model.js` owns bounded, normalized settings, library collections, queue
selection, portrait composition and framing. `slideshow-player.js` owns decoded
image buffering, real viewing history, paused timers, video, motion and gestures.
`photo-library.js` owns the Settings editor, batch choices, presets and bounded
canvas/MediaRecorder export. Settings stay in localStorage; native storage remains
the authority for persistent exclusions, Keepers, review and media files.

PhotoStore has a 300-item / 256 MiB total bound, including at most 100 Keepers /
128 MiB and 20 muted clips. Rolling retention defaults remain unchanged; Keepers
never silently evict a pinned item. JPEG re-encoding discards raw EXIF and GPS. An
opt-in normalized capture date, local face midpoint and perceptual signature are
derived without identity recognition or network requests. New arrivals can be
gated for owner review. A semaphore bounds concurrent image decoding; generation
fences prevent stale imports from restoring erased data.

PhotoMail keeps a bounded hash-only IMAP UID ledger for immutable messages. It
skips attachments already cached/excluded, but missing or corrupt cache files can
be fetched again. Inbox access stays read-only with the existing deadline and TLS
validation. No filenames, body text or sender data enter the ledger.

LocalMedia accepts owner-selected content URIs and copies media privately. AVC
MP4 is remuxed without audio/container metadata; bounded GIFs become muted AVC
clips. AAC soundtrack containers are rebuilt too. Export stages a bounded WebM
in private cache before publishing a scoped Downloads item; cancellation removes
staged output. The private test APK is a separate UID and never distributed.

PhoneManagement is an optional **on-frame** TLS listener, off by default. The owner
starts a 15-minute session bound only to a private wlan IPv4 address. A Keystore
certificate is pinned by owner comparison. A five-minute single-use QR invitation
creates a pending Secure cookie with no photo access. PhonePairing generates a
random comparison number, and the local bridge alone can approve its exact request
ID. Pending requests expire within two minutes; rejection refreshes the invitation
and revokes the pending cookie. Ten invalid invitations close the service. Secure HttpOnly SameSite cookies,
exact Host/Origin checks and bounded JSON/media routes constrain access. Stopping,
erasing, changing accounts or privacy pause revokes the session and queued writes.
The remote page has no JavaScript bridge. Its state contains only photo choices,
collections and slideshow settings; mail secrets and calendars are never exposed.
No hosted service, LAN discovery daemon or Android debugging access is added.

## Warm clock widgets (2.15.2)

Landscape, Analog, Flip and Botanical replace the four original presentations.
Existing identifiers remain compatible, including `stacked` for Flip. Local SVG
art supplies hills, a circular sun and a small plant; palette decisions remain in
`appearance.js`. Actual bounds select type scale, dial diameter, decoration and a
side-by-side Flip layout for shallow strips. The original time heading/date and
city/DST/12/24-hour formatting remain authoritative and accessible.

Flip uses a short Web Animations top-flap transition only on a changed visible
number during a normal clock tick. Initial render, unchanged ticks, time jumps,
hidden documents and reduced motion use immediate correct values. Old animations
are cancelled on subsequent changes; no timer, sound, remote asset or permission
is added. The Dashboard Settings sample shares the same renderer.

## Native signed updater

`AppUpdates` owns one worker, the fixed public GitHub release source, private APK
cache, preferences and PackageInstaller sessions. `UpdatePolicy` holds pure trust,
version and schedule boundaries. `UpdateJob` performs periodic connected checks;
`UpdateReceiver` handles explicit session-matched installer callbacks. Updates are
never supplied to a remote WebView. `update-model.js` normalizes native status;
`updates.js` paints a conditional sidebar action and Settings controls. It does
not fetch release binaries in JavaScript. See [updates](updates.md).

## Live dashboard workbench

`dashboard.js` retains the 12×12 collision model, with a transient gesture preview and immediate persistence on release. Style, add, remove and template choices save immediately. A shared contextual rail alternates between the palette and selected-widget options. `dashboard-preview.js` creates a
script-free same-origin sandboxed document using the production CSS and cloned
current widget data. Native bridges/services are never invoked by its document;
no second weather/calendar/photo controller runs. A dedicated clock renderer uses
the same parent tick and responsive sizing. The preview updates with draft bounds
and theme changes; Save alone updates the production layout. The overlay owns
pointer/keyboard gestures and keeps 44px resize targets independent of the scaled
preview. Selectable logical landscape sizes use the actual full viewport CSS, rail/header
geometry and grid gap; the canvas crops to the widget area. Rendered checks compare
those metrics against the real dashboard at each selected size. Palette and inspector scroll independently; short/narrow Settings can
scroll without covering the canvas with the Save row.


## Task-based Settings presentation

`settings-interactions.js` reorganizes the canonical Settings controls into task
workspaces, and presents small exclusive choices with visible buttons and visual
selectors. Existing service and preference handlers remain the single write path.
Picture crop/details stay staged; a shared departure guard
requires Apply, Discard or Keep editing. Normal gallery browsing has no permanent
batch checkboxes. File transfer uses Android's document picker and a strict native
non-secret whitelist (`DisplayTransfer`), then a browser-side review before apply.
The application and APK release metadata share `web/version.js`.

## React rendering boundaries

`src/main.tsx` mounts the frame shell and exposes the rendering boundary used by
existing local service adapters. React owns weather, calendar/event lists, calendar
source editing and inviter decisions, dashboard editor tiles and palette, household
lists, photo galleries/collections/order, shared simple and visual choices, setup,
updates and the separate phone-curation page. The canonical Settings/photo/editor
forms are JSX components in `src/components/form-templates.tsx`; their existing
adapters bind the native and persistence actions. UI values are escaped by JSX.
`src/lib/mount.tsx` gives each stable surface one root; repeated updates reconcile
that root instead of replacing its children. Do not manually replace children of
those hosts. Service callbacks supply view models and actions.

Existing JavaScript adapters still coordinate routing, Settings layout/form writes,
dashboard positioning/dragging, native callbacks and preference persistence. The
Settings forms are uncontrolled inputs with a single existing write path. Momo,
clock artwork, the live dashboard mirror, crop transforms and the slideshow scene
engine retain imperative rendering. This is a hybrid React integration, not a claim
that every controller or DOM operation has been rewritten. A follow-up that removes
these adapters must preserve draft recovery, focus restoration and native callback
ordering, rather than adding a second state/write path.

The shared controls use Radix Toggle Group and an owned shadcn-style Button/Slot
composition with the current CSS. Tailwind 4 is not used: the build targets Chrome
95, and no newer CSS/browser baseline is assumed. `scripts/build_frontend.mjs`
produces two local IIFE bundles and their notices. Both the APK builder and synthetic
preview rebuild before staging, using the pinned npm lockfile. Native mail/calendar,
TLS phone authorization, signed updates, private media URLs and remote WebViews
retain their existing boundaries. The phone server serves only the explicit React
bundle path; the read bound accommodates that bundle without allowing other files.

## Shared React controls

`src/components/ui/` owns action, input, checkbox, switch, status and disclosure
primitives. `web/components.css` maps those controls to existing appearance tokens.
Native form elements and IDs preserve the service-adapter boundary. See
[component rules and adoption](components.md). The interactive review showcase is
not an APK asset. Existing lightbox and task-navigation controllers are retained.

## React state and recovery contracts

- `src/types/services.ts` declares the native methods used by React and its app/update
  service contracts. `src/types/views.ts` declares shared dashboard, calendar and
  household view models. The `SkylitUI` interface is inferred from actual component
  props, so new render entry points must not accept arbitrary objects.
- Validate untrusted weather/cache and phone JSON in `src/lib/weather-data.ts` and
  `src/lib/phone-data.ts` before publishing it. Type assertions alone do not validate
  a network or native response. Bad forecasts never replace a valid cached forecast.
- Each independently mounted feature has a recovery boundary. Adapter-driven roots
  retry on new render data or an explicit Try again; subscribed Weather views use
  the store revision so a valid forecast also recovers without a page reload.
- `useDraft` separates an editable value from server refreshes. A save acknowledges
  only the revision it submitted, preserving edits made while that save was pending.
  Phone slideshow and picture-details forms are controlled presentation components;
  session and persistence coordination stays in their parent.
- Phone sessions have a generation and a non-extending deadline, derived from native
  remaining milliseconds to avoid device/phone clock differences. Expiry, HTTP 403
  and network failure clear displayed photos and drafts. Focus/visibility rechecks
  and ten-second polling detect a stopped server. Late responses cannot reopen an
  expired session. A transient disconnection requires scanning a new invitation.
- Transient calendar removal confirmations reset on Settings navigation/close and
  have an explicit Cancel. Hiding a mounted React root is not an unmount.
- Legacy controllers remain the only persistence path for their canonical forms.
  React render hosts must not have their children replaced by those controllers.
  Do not add a parallel React writer without transferring ownership explicitly.

All React source is formatted with the pinned Prettier version (`npm run format`).
CI installs pinned dependencies, type-checks, checks formatting, rebuilds and checks
bundle drift, then runs browser recovery checks against synthetic data. Production
assets continue to target Chromium 95; desktop browser checks do not replace frame
acceptance.

The General Settings entry owns colour mode, text size, City & time and Daily routine. Palettes/Momo remain in Appearance, and updates/Android recovery remain in Frame. A header breadcrumb replaces repeated section headings and provides parent navigation. Dashboard reset uses a modal visual template picker. Photo styles (Prints, Mosaic, Spotlight) and weather styles (Landscape, At a glance, Sky) are allowlisted layout metadata; rendering reuses existing curated pictures and forecast state.

The widget gallery uses visual previews with centred names and overlapping green check badges for included widgets. The preview itself is draggable: horizontal touch intent starts dragging while vertical gestures retain native scrolling. Dashboard edit history and Undo/Redo controls are removed; completed changes save live. Prints preserve each photograph’s natural content proportions and adapt spacing and overlap across the slot.
