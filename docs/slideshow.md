# Local slideshows

Open **Settings → Photos → Pictures on this frame**. The main gallery stays simple:
Slideshow, Check now, thumbnails and reversible trash/exclusion. Configuration
stays in the Settings lightbox; the player has five icon controls and no captions.
A shared Google album continues to use Google’s player and its own capabilities.

## Playback

The default is Soft fade, 30 seconds and whole-picture Fit. Existing interval and
style preferences migrate. Five styles are available: Soft fade, Falling prints,
Photo collage, Gentle pan & zoom, and Still gallery. Choose theme mat, black or a
blurred picture surround; dissolve, cut, slide, reveal or varied transitions. Device
reduced-motion preferences override animation and show clip posters.

Automatic layout pairs portrait photos when a suitable partner exists. Explicit
one/two-picture layouts are available. Collage updates one region at a time when
three suitable pictures exist. Missing pictures are quarantined for the session.
Images are decoded before their full viewing interval begins. Refresh retains the
current picture, remaining time, history and shuffle queue; new arrivals can be
queued next without reshuffling the rest of a cycle.

Previous follows actual viewing history. Resume retains the last picture, rather
than always starting at the newest. Newest, oldest, shuffle and manual order are
available, with optional favourite weighting. Manual order supports a touch grip
and up/down buttons. Weighting deliberately gives favourites extra spaced turns.

Touch brings back controls, which fade after four seconds of playback. Swipe
pauses and browses; double tap, pinch or Zoom inspects a picture, with bounded pan.
Keyboard: arrows browse, Space plays/pauses, +/- zoom, Escape closes. Idle mode
hides controls and returns to the dashboard on the first touch. Excluded cached
pictures can be inspected deliberately without restoring them to automatic play.

## Curation and retention

Recent photos use received-date or count retention. Choices include last
7/30/90/180 days with a capacity, or last 10/20/30/40/50/100/200 non-excluded photos.
Defaults remain last 30 days / 30 photos. **Keepers** survive rolling retention,
up to 100 items / 128 MiB. All cached items share 300 items / 256 MiB, including at
most 20 muted clips. A full Keepers area is reported; older unpinned photos may
be replaced. Favourite status is a playback preference, not storage protection.

Library & collections offers title/note/date search, multi-select, Keep, Favourite,
Exclude/Restore, and up to 24 named collections. Collections reference cached IDs;
put important photos in Keepers to protect them from expiry. Empty filters never
fall back to another collection. Up to 12 presets save presentation settings.
Season ranges can cross the end of the year; they restrict the chosen presentation
and do not silently switch collections or presets.

Framing & photo details has Fit/Fill, rotation, crop positioning, a local title and
accessibility description, optional capture date, and per-picture duration. Face
position suggestions use Android’s local detector and do not identify people.
Similar-image suggestions use a local perceptual signature and require owner review;
they never delete pictures automatically. Exact-file exclusion survives mail refresh
and re-import. Different file bytes remain a different ID.

New emailed photos can wait for explicit approval. Enabling review affects new
imports; existing pictures remain. Explicit owner-selected local/phone imports are
approved. Capture-date retention is separately opt-in for new imports. Re-encoding
still strips GPS and raw EXIF; old discarded dates cannot be recovered. **On this
day** uses known capture dates from previous years, never received dates.

## Local media and presentations

Android’s file picker imports pictures privately, without requiring an inbox.
Supported image decoders depend on Android. GIF input is limited to 12 MiB, two
million canvas pixels, 150 frames and 16 million decoded frame pixels; it becomes a
muted AVC clip. MP4 input must have H.264 video, at most 30 seconds / 32 MiB and
2400 pixels on its longest edge. Audio and container metadata are removed. Clips
advance at their end or the configured viewing interval, whichever comes first.

An optional AAC/M4A soundtrack is limited to 20 minutes / 20 MiB, stored privately
and removable separately. It plays only while the slideshow is playing, at the
chosen volume. There is no supplied music library or streaming dependency.

Title cards are optional for deliberately titled presentations. Everyday playback
remains free of text. The closing card appears when Repeat is off and playback ends.
Export records up to 12 selected still photos / 120 seconds to WebM in Downloads,
with framing, composition, transitions, optional cards and soundtrack. It does not
embed clips or reproduce every live falling-print/gentle-motion effect. It runs in
real time and can be cancelled; leaving the app cancels it without publishing a
partial file. Exported Downloads videos are outside the private cache: delete those
separately when retiring the frame.

## Schedule and phone management

Schedule limits automatic photos in the chosen city’s timezone; manual browsing
remains available. Optional brightness changes only Skylit’s window. Disabling it
restores system brightness. Quiet hours remain independent. This does not promise
system sleep, wake-from-power-off or background playback.

**Manage photos with your phone** lives on the Photos page. Opening Photos automatically prepares an encrypted, temporary invitation; no Start step is needed. Unapproved invitations stop when Photos is left. Approved sessions retain their 15-minute deadline, and expired invitations renew while Photos remains visible. Stop phone access revokes access and pauses pairing until you resume or revisit Photos. Scan the locally generated QR code with a phone on the same Wi-Fi within five
minutes. Inspect its certificate and compare the SHA-256 fingerprint with the frame
before accepting the local certificate warning. The phone and frame show the same
random six-digit number. Compare them, then tap **Numbers match · Allow** on the
frame. No number is typed and no photo access is granted before this approval.
A pending request expires after two minutes (or the invitation deadline, if sooner).
Rejecting it revokes that browser and creates a fresh QR invitation while the
five-minute invitation window remains open. A consumed QR cannot pair another
browser. Stale approvals, expired requests and restarted sessions fail closed.
Ten invalid invitation attempts close the service. The QR invitation is created
offline, contains no household account information, and is cleared from the
phone’s address bar immediately after opening. Do not share it or screenshot a
real session for publication. The comparison number is not an access credential.

The phone can curate stored pictures, edit their details, create collections,
change the basic slideshow settings and upload a JPEG or muted H.264 MP4. It has
no debugging access, calendar feeds, account fields or mail credentials. Stop phone access
revokes access immediately. Privacy pause, account changes and erase/disconnect
also revoke it. There is no cloud account, router setup or remote access away from
the local network. A browser that does not allow inspecting/accepting this local
certificate cannot use the feature; use on-frame Settings in that case.

Disconnect or Erase saved pictures cancels active work and clears the entire private
photo library, Keepers and exclusions. Collection membership and local picture
choices reset with the cache epoch. Revoke the Gmail app password separately.
Uninstalling removes private media; an upgrade with the same signing key preserves
it. Exported files in Downloads remain until explicitly deleted.
