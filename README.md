# Skylit

A warm, touch-friendly dashboard for an Android photo frame. Live weather, family
photos, Google Calendar, Google Home, YouTube, and **Momo**, a tiny animated canvas
robot with a wardrobe and a daily rhythm.

Inspired by [Wes Bos’s photo-frame-dashboard](https://github.com/wesbos/photo-frame-dashboard).
His experiment showed the possibilities of turning a frame into a home dashboard.
See [credits and third-party notices](docs/credits.md).

[Download the latest signed APK](https://github.com/sachasayan/skylit/releases/latest).

## Screenshots

These screenshots use **synthetic events, weather and generated sample photos**,
not a household account. They demonstrate the interface, not a live service sign-in.

| Overview · Linen | Overview · Ocean dark |
| --- | --- |
| ![Overview with recent photos in Linen](docs/screenshots/overview-photos-linen.jpg) | ![Overview with recent photos in Ocean dark](docs/screenshots/overview-photos-ocean-dark.jpg) |

| Weather · Clear | Weather · Fog |
| --- | --- |
| ![Clear-sky weather scene](docs/screenshots/weather-clear-linen.jpg) | ![Fog weather scene](docs/screenshots/weather-fog-linen.jpg) |

| Photo library · Linen | Picture choices in Settings |
| --- | --- |
| ![Browsable photo library in Linen](docs/screenshots/photo-library-linen.jpg) | ![Favourite, Fit/Fill and caption controls](docs/screenshots/photo-options.jpg) |

| Falling prints | Photo collage |
| --- | --- |
| ![Falling-print slideshow](docs/screenshots/slideshow-falling-prints.jpg) | ![Three-picture collage slideshow](docs/screenshots/slideshow-collage.jpg) |

| Calendar | Appearance |
| --- | --- |
| ![Calendar](docs/screenshots/calendar-linen.jpg) | ![Appearance settings](docs/screenshots/appearance.jpg) |

[Android recovery shortcuts and screenshots](docs/reviews/2026-10-11-wireless-shortcuts/index.html).
[P1/P2 review fixes and screenshots](docs/reviews/2026-10-11-review-fixes/index.html).
[Clock visual critique across sizes](docs/reviews/2026-10-11-clock-critique/index.html).
[Modular dashboard report and screenshots](docs/reviews/2026-10-11-modular-dashboard/index.html).
[Settings navigation, gallery curation and APK](docs/reviews/2026-10-11-gallery-curation/index.html).
[Slideshow controls report](docs/reviews/2026-10-11-controls/index.html).
[October 11 refinement report with revised screenshots](docs/reviews/2026-10-11-refinement/index.html).
[Earlier implementation report](docs/reviews/2026-10-11-implementation/index.html).

## What works

| Feature | How it works |
| --- | --- |
| Overview | Configurable, responsive modules: clock/date, weather, photos, upcoming events, hourly forecast, note, shopping list, countdowns and timers |
| Weather | Live Open-Meteo forecast, city search, hourly and five-day outlook, saved forecast when offline, nine illustrated condition scenes with day/night variants |
| Photos | Shared Google album or a private Gmail picture cache; browse/zoom, favourites, persistent trash/exclusion with Undo, date/count retention, Fit/Fill and captions, three styles, shuffle/repeat, configurable mail checks and optional exact sender rule |
| Calendar | Read-only month and selected-date agenda, source visibility in Settings, editable labels/colours, loaded-date search, direct Google iCal feeds, offline cache and on-frame inviter review |
| Home | Google Home’s website, using its supported controls and your own session |
| YouTube | Touch-friendly mobile site or standard website, with full-screen video support |
| Momo | Procedural Canvas 2D character, reactions, accessory gallery, daily outfits, night snoozes and morning yawns |
| Settings | Lightbox over the current screen, left-side category navigation, six paired palettes, astronomical mode, larger text, draggable/resizable dashboard editor and module gallery, optional navigation, quiet hours/privacy pause, service recovery and non-secret display transfer |
| Household · optional | Local pinned note, shopping checklist with undo, countdowns and visible timers; no phone sync or background-alert promise |
| First-run guide | A three-step on-frame guide for city, photos and calendar; reopen it from Settings at any time |

The dashboard is plain HTML, CSS and JavaScript. No npm install, hosted backend,
Google API key, Play Store or Google Play services is required. The Android viewer
bundles the dashboard for offline startup; online services still need internet.
A Mac does not need to remain connected. Google decides whether its sign-in and
websites support a particular WebView; a shortcut is not proof of an authenticated
connection. See [verification and known limits](docs/verification.md).

## Try it in a browser

Requires Python 3.10+ (Node 18+ is needed only for tests):

```sh
python3 -m http.server 8765 --bind 127.0.0.1 --directory web
```

Open **http://127.0.0.1:8765**. A missing `local-config.js` is harmless in a fresh
checkout. A fresh browser opens the setup guide. Settings save on that browser/device; a desktop preview opens external
services in new tabs. Native idle switching is available in the Android app.

## Configure the dashboard

Open **Settings → Dashboard**. Drag a module by its name to move it and drag its
corner to resize. Modules snap to a 12 × 12 grid and cannot overlap. Select a
module to set its row, column, width and height precisely; keyboard arrows move
it, and Shift + arrows resize it.

The gallery has nine modules, with one of each per dashboard. Tap a card to add
it, or drag its grip into empty space in the preview. When a tap needs more room,
Skylit arranges the modules automatically; **Undo** restores the previous layout.
**Save dashboard** applies your draft; **Discard changes** keeps the saved layout.
Removing a module leaves its photos, calendars and Household data intact.

Select **Clock & date** in the preview to choose **Classic**, **Analog**,
**Stacked** or **Digital**. The live sample follows your city and 12/24-hour
preference; **Save dashboard** applies the style. Resizing, arranging and changing
a starting layout retain your choice.

Balanced, Photos first and Agenda first are starting layouts. Layout coordinates
adapt to 16:9 and 16:10 landscape screens; smaller modules simplify their content
or scroll internally. Narrow previews stack modules. Custom layouts are stored
locally and are excluded from display-preference transfer.

## Make it your household’s dashboard

On a fresh install, Skylit opens **Set up your frame**. Its three cards lead to the
existing city, Photos and calendar controls. You can choose **Use dashboard** at any
time and reopen the guide from **Settings → Device & status → Open setup guide**. An update over an
existing installation does not interrupt the current dashboard. The guide never
asks for a Google password or stores a private link in the public app bundle.

Before setup, connect the frame to Wi-Fi and confirm its clock is correct. Use the
on-frame controls for private information; a desktop preview is for layout only.

1. In **Settings → Weather & time**, find and select your city.
2. In **Settings → Photos**, choose a shared Google Photos album or pictures sent to a dedicated
   Gmail inbox. For an album, paste its sharing link in **Photos & idle mode**; keep
   that link out of source control. For email delivery, follow the [photo setup](docs/photos.md)
   and enter an app password only on the frame. Email photos can be browsed, zoomed,
   and played with Soft fade, Falling prints or Photo collage; choose a style in
   **Photos → Photo settings**. The shared album uses Google's own slideshow.
3. Open **Calendar → Calendar options**. On your computer, copy the calendar’s
   **Secret address in iCal format** from Google Calendar settings. Enter it on the
   frame with a name and colour. Repeat for each calendar (up to six). See the
   [guided calendar setup](docs/calendar.md); never make a private calendar public.
   To review which organizers appear on this frame, use **Calendar → Calendar options → Who appears on this frame** (Review inviters appears on Calendar when decisions are waiting).
4. Open **Home** and sign in to the account invited to your home. Google Home web
   capabilities vary by device. Do not expect every mobile-app feature.
5. Choose YouTube’s mobile or standard site. Sign-in is optional for public videos.
6. Choose a palette and **Light**, **Dark**, or **Automatic** under Appearance.
   Automatic uses your weather city’s sunrise/sunset, calculated offline. Until a city
   is set, it follows the device’s light/dark preference. High contrast is optional;
   the other palettes use softer colours. Palette/mode choices are saved per browser
   origin or frame; they do not sync between your computer and the frame.
7. Pick a Momo accessory or **New clothes every day**, and choose a motion level.

To verify email photos, send a picture to the dedicated inbox, tap **Photos →
Emailed pictures → Check now**, and wait for a saved-picture count. Start the
slideshow and confirm it advances. To verify Calendar, add or change an event in
Google Calendar, use **Settings → Device & status → Calendars → Retry**, and confirm
the event changes here. A saved
credential or a loaded page alone is not a completed setup. See [photo setup](docs/photos.md)
and [calendar setup](docs/calendar.md) for troubleshooting and removal.

Sessions live in Android WebView’s normal cookie store. Google pages share that
store, so signing in may also sign you into other Google pages on this frame.
Skylit never copies your computer’s cookies or stores your Google password.

Calendar is read-only and refreshes every 15 minutes. Manual retry is available in
**Settings → Device & status**.
Add and edit events in Google Calendar on your phone. Private feed addresses and
last-good event data stay in the app's private Android storage. The desktop preview
shows the interface but does not connect or store feeds. No hosted service is needed.
Inviter review is a frame-only display rule, not a Google Contacts or invitation
setting; [calendar setup](docs/calendar.md) explains the distinction.

For deployment defaults, you may copy `web/local-config.example.js` to the ignored
`web/local-config.js`. Normal APK builds deliberately ignore that file. The preferred
shareable workflow is to enter settings after installation.

## Landscape layouts and optional features

The interface adapts to landscape 16:9 and 16:10 screens. Overview and core Calendar
use the available screen height; long agendas, libraries and settings scroll within
appropriate sections. The synthetic rendered check covers 960×540 through
1920×1200, both text profiles, and a secondary narrow preview. This is browser
coverage, not certification of every Android display.

Household is off in the default rail. Open **Settings → Household** to try it and
optionally enable navigation or a one-line Overview note. Quiet hours and manual
privacy pause are under **Settings → Photos**. They hide content without changing
hardware brightness and leave active videos/manual photo browsing alone.

**Settings → Device & status** provides coarse service timestamps and recovery
controls. Display preference transfer includes only palette/mode/clock/units,
text size, Overview preset and Home/YouTube visibility; it excludes city, accounts,
feed/album links, pictures, notes and inviter identities. On the frame, use the
copy/paste JSON field; desktop browsers can download/import a small JSON file.

## Build the Android viewer

Tested: Skylight 150-FRM, Android 12, 1920×1080, Chromium/WebView 95. Other Android
hardware may work but is unverified. This repository does **not** unlock or flash a
frame. Start with a device that already permits Android app installation.

Install [JDK 17](https://adoptium.net/temurin/releases/?version=17) and the official
[Android SDK tools](https://developer.android.com/studio#command-tools), including
platform-tools, `platforms;android-34`, and `build-tools;34.0.0`. Verify downloads
against their publishers’ checksums. Accept SDK licenses yourself. On macOS/Linux,
`zip` must also be available. Windows is not tested.

Create your own signing key; keep it private and retain it for future upgrades:

```sh
mkdir -p .local
keytool -genkeypair -keystore .local/skylit.keystore -alias skylit \
  -keyalg RSA -keysize 3072 -validity 10000
```

Create `.local/build.json` (absolute paths, all local):

```json
{
  "java": "/path/to/jdk-17",
  "build_tools": "/path/to/android-sdk/build-tools/34.0.0",
  "android_jar": "/path/to/android-sdk/platforms/android-34/android.jar",
  "signing_key": "/private/path/to/skylit.keystore"
}
```

Set `SKYLIT_KEY_PASS` in your shell without putting its value into a command committed
to Git. Use the same password for the key and keystore. Alternatively, put
`key_password` in the ignored build config. Then:

```sh
python3 scripts/build.py
python3 scripts/check_public.py --history --apk dist/skylit.apk
adb -d install -r dist/skylit.apk
adb -d shell am start -n com.wesbos.homehq/.MainActivity
```

`dist/skylit.apk` has **empty household defaults**. `--personal` instead writes
`dist/skylit-personal.apk` with your ignored local config embedded. Never distribute
that personal APK. Installing an update preserves device settings and sign-in sessions.

The legacy package ID `com.wesbos.homehq` remains for upgrades from our initial
installation; it does not imply affiliation. The same signing key is required for
updates. Avoid installing over a different Home HQ build with the same ID.

After confirming the dashboard works, optionally make it the Android home screen:

```sh
adb -d shell cmd package set-home-activity com.wesbos.homehq/.MainActivity
adb -d shell input keyevent KEYCODE_HOME
```

Keep the original launcher installed. Record its component before changing HOME.
For the first USB-to-Wi-Fi handoff, pairing, unplugged verification and later
reconnection, follow [wireless setup](docs/wireless.md).

## Original app and recovery

Settings → **Open original Skylight app**, or a two-finger hold on the dashboard,
opens the installed stock app. Nothing in the build disables it. Restore the HOME
component you recorded for your own device. On the tested 150-FRM it was:

```sh
adb -d shell cmd package set-home-activity com.skylight/odesk.johnlife.skylight.activity.MainActivity
adb -d shell input keyevent KEYCODE_HOME
```

Do not assume that component or any firmware instructions apply to another model.

## Development and checks

```sh
node --test tests/*.test.cjs
python3 -m unittest discover -s tests
python3 scripts/check_public.py --history
```

For a safe demo with made-up events, forecast and generated photos, run `python3 scripts/preview.py`
and open **http://127.0.0.1:8767**. It stages only public assets, never reads household
config, and mocks the forecast, calendar and local photo status in that preview only. Stop with Ctrl-C;
restart after code changes. Demo preferences are isolated by the browser origin.
Do not enter real credentials into the demo. See [testing](docs/testing.md) and
[design decisions](docs/design.md) for review criteria and screenshot reproduction.

See [AGENTS.md](AGENTS.md) for agent setup, hardware boundaries and verification,
[architecture](docs/architecture.md) for service isolation, and
[release checklist](docs/releasing.md) for privacy, history and release checks.
Source and APK publication are separate steps. Ignoring a file does not remove it
from old commits, and an APK can contain data that was never committed.

For an agent-led installation: read those guides first; use a normal, empty-config
APK; verify the exact ADB device; install in place with the same signing key; then
walk the owner through the on-frame guide. Keep private links and app passwords on
the frame, test real refresh/playback, and record device changes and undo steps in
the private setup record. Never copy a household screenshot or test email into Git.

