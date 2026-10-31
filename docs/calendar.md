# Calendar setup

## Available in version 2.5

Calendar now renders inside Skylit, with a month grid, a two-week agenda from the
selected date, and expandable event details. **Calendar → Calendar options** opens
the setup form. Up to six Google iCal feeds are supported, each with its own colour.
The desktop browser preview does not connect feeds; enter private links on the frame.

The chosen design is a read-only calendar inside Skylit's own themes, with the frame
fetching Google Calendar's private iCal feeds directly and refreshing periodically.
There must be no maintained hosted service, Google Cloud project, API key, or Google
Play services requirement. The household continues creating and editing events in
Google Calendar on its phones or computers. Refresh is periodic, not instant push.

## Review inviters on the frame

**Calendar → Calendar options → Review who appears on this frame** controls which event organizers appear in Skylit.
Enter the calendar account's email first, then turn on **Review new inviters before
showing their events**. Its own events remain visible. Other organizers wait in a
review list until their exact email address is approved. Remove an address to hide
its events again. Events with no organizer address stay hidden unless **Show events
without an organizer address** is enabled. The same rule applies to the Calendar
page and Overview; it is off by default so existing calendars keep working.

This is a display filter on the frame. It does **not** approve an invitation in
Google Calendar, add a Google Contact, stop invitation email, or prevent events
from being stored in the Google account. The review list includes only events in
the dates Skylit has loaded. Organizer addresses are stored in the frame's local
dashboard data and should not be copied to public screenshots or setup records.

Google's [invitation settings](https://support.google.com/calendar/answer/13159188)
can prevent unknown senders' invitations from reaching the calendar feed. If the
owner wants Skylit to review unfamiliar inviters, they can choose **From everyone**
in Google Calendar → Settings → Event settings → Add invitations to my calendar.
That account-wide choice applies to new invitations and may bring unwanted events
into Google Calendar itself. Do it only if that tradeoff suits the dedicated
household account; Skylit does not change it automatically. Google Contacts
management is not required for this local display filter.

Verify with a real invitation from a new organizer: it should wait in Review,
appear after approval, and disappear after approval is removed. Then cancel or
uninvite the event in Google Calendar and confirm it disappears after the next refresh.
Until that test is done, organizer extraction is covered by synthetic feed tests,
not verified against this household's live invitation feed.

## Views and source choices

Calendar keeps one six-row month grid beside a selected-date two-week agenda. The
Today button returns to the current month/date; it does not change to a separate
view. Week/Today agenda modes were removed in 2.12.1. Saved legacy mode choices are
ignored on upgrade. Source visibility lives beside each calendar in Settings and
also applies to Overview, which remains anchored to today while browsing months.

**Search** filters titles only within the loaded 70-day month window. It does not
search all calendar history and does not filter Overview. Event details can add a
local Household countdown; this does not modify the source calendar.

Calendar options opens the shared Calendars Settings category with **Back to
Calendar**. The Settings area selector sits above a single editor column. Edit a label/colour independently of its secret address; cache acceptance
preserves metadata edited during a refresh. Removal still deletes the feed and its
saved data locally, with Google-side revocation handled separately. Inviter decisions
have their own Settings view; setup is collapsed below them. Calendar connections
remain in Calendars, with the add form collapsed until needed. The prominent review button
appears only when loaded events are waiting.

## Guided household setup

Agents should guide the owner through this flow:

1. On the owner's computer, open Google Calendar in the account that owns the calendar.
   Prefer the household account for a calendar managed by the household. Do not change
   existing ownership or sharing just to configure Skylit.
2. Open **Settings**, select the calendar under **Settings for my calendars**, then
   **Integrate calendar**. Copy **Secret address in iCal format**. This is different
   from a public calendar address, sharing link, embed code or Calendar website URL.
3. On the frame, open **Calendar → Calendar options** and enter the link into
   **Secret iCal address**. Choose **Connect calendar**. The agent should not ask for it in chat or print
   it in tool output. Give the calendar a friendly label and colour.
4. Wait for **Connected** in the calendar list, then open **Calendar** to see events. Repeat for
   additional calendars. Do not assume one feed includes every calendar visible in
   that Google account; configure each desired calendar separately.
5. Confirm a known event with the owner. Verify its local date/time, an all-day event
   and a recurring event where available. Check that an owner-made event change
   appears after refresh before reporting synchronization as working.
6. Explain that events are edited in Google Calendar. The view shows its last refresh
   time; updates run every 15 minutes and **Settings → Device & status → Calendars → Retry** retries immediately. To remove
   a calendar, open **Calendar options → Remove → Tap to confirm**. To replace a
   revoked or incorrect address, remove the old entry and connect the current link.

If the secret address is unavailable, check calendar ownership and any Workspace
administrator restrictions. Do not make the calendar public as a workaround or
promise that a calendar shared with the household account exposes its secret feed.

Google documents this read-only workflow in
[Sync your calendar with computer programs](https://support.google.com/calendar/answer/37648?hl=en).

## Privacy and implementation requirements

- Treat the entire secret feed URL as a credential. Keep it in private device settings,
  never source control, documentation examples, screenshots, logs, setup records,
  public builds or a third-party proxy. Never copy browser cookies to obtain it.
- Fetch directly over HTTPS in the Android layer; do not depend on browser CORS
  access or an always-running Mac. Limit destinations and redirects to supported
  calendar providers. Keep the native bridge restricted to the local dashboard.
- Use a maintained iCalendar parser with recurrence, exceptions, timezones and all-day
  date handling. Treat event fields as untrusted text, not executable HTML.
- Persist the last successful data privately for offline display, clearly mark stale
  data, and retry failures without discarding a previously working calendar.
- Removing a calendar must delete its local URL and cached events. If a URL was exposed,
  the owner can reset the secret address in Google Calendar, then reconnect devices
  that used the old address. Removing it from Skylit alone does not revoke the URL.
- Verify refresh, persistence after restart, offline behaviour, removal and all three
  themes on the actual frame before marking the feature complete. Use synthetic
  events and placeholder URLs in automated tests and public screenshots.
- Record setup results and undo steps in the private setup log and its on-device copy,
  using labels only, without URLs or private event details.

## Current limits and verification

Only Google iCal endpoints ending in `basic.ics` are accepted. Existing public Google
feeds can also be added, but never change a private calendar's sharing for this.
Downloads require HTTPS, reject redirects, and are capped at 2 MiB per feed. Complex
recurrences are bounded; parsing runs in a worker with a six-second timeout. Feeds
with unsupported/missing timezone definitions fail explicitly rather than guessing.
Google normally includes VTIMEZONE definitions in its exports.

The actual frame fetched and rendered a temporary public Google holiday feed. Tests
cover recurrence exceptions, DST, date boundaries, download restrictions, cache
retention after failed refresh and removal. Household-specific feed access and event
changes still need verification with the owner. See [verification](verification.md).


## Retaining displayed events after parse failures

The controller keeps a bounded in-memory last-good expansion per calendar for the
visible month window and today's Overview window. A parser error or worker timeout
retains events only when the cached date bounds and timezone exactly match that
view. Month navigation and timezone changes never borrow events from another
range; the Overview can retain its own matching expansion independently.

Successful empty results replace the cache, so canceled events can disappear.
Calendar removal clears its expansions immediately, and superseded renders cannot
publish cache changes. Visibility and inviter filters still apply to saved events.
Render errors clear after a successful retry without clearing unrelated download
errors. An empty failed view reports unavailable rather than asserting no events.

These expansions live only for the current dashboard session; the existing private
native ICS cache remains the source after restart. This does not bypass the parser
or remove its six-second timeout. Controller regressions exercise timeout, recovery,
empty updates, multiple sources, range/timezone isolation and stale completions.
Live household-feed/device acceptance is still required for a signed release.
