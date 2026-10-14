# Photos by email

Skylit can play either a Google Photos shared album or a private slideshow made from
pictures mailed to a dedicated Gmail account. Choose the source in **Settings → Photos → Receiving photos**. The
shared-album route remains the default and requires no extra account setup.

## Set up email delivery on the frame

1. Use a dedicated Gmail account for pictures meant to appear on the frame. Anyone
   who can send it a picture can put that picture on the display. Avoid using a
   personal inbox with private mail.
2. On a trusted phone or computer, enable [Google 2-Step Verification](https://support.google.com/accounts/answer/185839)
   and create an [app password](https://support.google.com/accounts/answer/185833).
   Google may not offer app passwords for every account or security configuration.
3. On the frame, open **Settings → Photos → Receiving photos → Pictures on this frame**, then **Connect or change Gmail account**. Enter the
   Gmail address and 16-character app password there. Never
   put either credential in chat, source code, screenshots or the setup record.
4. Tap **Connect and check mail**. The app stores the credential first, then checks
   Gmail via encrypted IMAP. A saved credential is not proof of successful sign-in:
   wait for a last-checked time, an error, or a received picture.
5. Send a JPEG, PNG, WebP or HEIC image to the account. Tap **Check now** and confirm
   the picture appears in the Photo library and advances in the full-screen slideshow.
   Tap a thumbnail to browse, use Next/Previous, and tap Zoom to inspect it. Choose
   **Soft fade**, **Falling prints**, **Photo collage**, **Gentle pan & zoom**, or **Still gallery** in Photo settings. Set
   **Show photos after** to the desired idle time. The first touch exits idle mode.

Slideshow controls use the current palette and fade after four seconds without
interaction. Touch, pointer movement or a key brings them back. The five styles
apply to emailed pictures; a Google Photos shared album uses Google's own player.

Google says personal Gmail accounts have IMAP access enabled. Its ordinary account
password is not accepted by this route; the app password requires 2-Step
Verification. [Gmail client guidance](https://support.google.com/mail/answer/7126229)
recommends Google sign-in when available; this optional local-only integration uses
an app password because it requires no hosted OAuth service or Google developer
project. An app password grants mail access beyond just picture attachments, so use
a dedicated account and revoke its app password in Google Account settings if the
frame is lost or retired.

## What Skylit stores

The Android app checks the inbox read-only when opened and on the selected
15-minute, hourly or daily schedule (daily remains the upgrade/default value).
Only one check runs at a time, with a 120-second total deadline. Invalid MIME/image
parts are skipped so other pictures can still import. A failed or timed-out check
keeps pictures already saved and does not claim a successful last-checked time.
Automatic failures back off from five minutes to
one hour; the last good cache is retained. **Check now** starts an immediate check. It scans recent inbox
messages, accepts image parts with sane dimensions and size, resizes them to at most
2400 pixels on the long edge, removes EXIF metadata by re-encoding, and keeps a
private rolling library of up to 200 unique pictures plus up to 100 Keepers, sharing a 256 MiB total budget. Gallery retention can use the last
7, 30, 90 or 180 days (by email received date), with a separate 5–200-picture
capacity, or the last 10, 20, 30, 40, 50, 100 or 200 non-excluded photos regardless of age.
Keepers have a separate 100-item / 128 MiB budget and survive rolling retention. The default remains 30 pictures from 30 days; existing preferences are retained. Email bodies and sender data are
not saved. Other mail folders and cloud photo albums are not scanned. A picture
deleted from email may remain until its retention window expires or the user
disconnects. When offline, the last saved pictures remain playable.

The app password is encrypted using Android Keystore with the address bound as
authenticated data. Backups are disabled. **Disconnect email and erase saved
pictures** cancels any running check and removes the saved credential and local
photo cache. **Erase saved pictures** also cancels a running check; later work from
that check cannot restore erased pictures. Revoke the app
password in Google as well to terminate its account authorization. Upgrading with
the same signing key retains settings; uninstalling removes the private cache.

## Presentation, local choices and delivery policy

**Photo settings** opens the shared Photos category in the Settings lightbox.
Its left-side navigation stays available while the editor scrolls. Presentation
contains style, speed, shuffle, repeat, favourites-only playback and an Overview
favourite preference. These apply to cached emailed pictures; a shared album uses
Google's player. Open **Settings → Photos → Photo library**, open a
picture, and favourite/exclude it, choose **Fit** (the default, whole image) or **Fill**,
or edit photo information. Existing local captions are retained but are not shown in the slideshow. Received dates appear there; Capture-date retention is opt-in for new imports, or entered manually. Skylit does not invent dates or identify people. The photo viewer has only Previous, Play/Pause, Zoom/Fit,
Next and Close, each shown as an icon with an accessible name.

Each gallery thumbnail has a trash icon. It **excludes** that picture from this
frame's gallery, Overview and every slideshow; it never deletes email. Undo is
available immediately. Exclusions are stored privately by the original image's
SHA-256 ID, so Check now, restart, cache expiry, pruning and a later import of the
same file do not restore an unwanted photo. Different file bytes have a different
ID; this is not a visual-similarity or person-recognition filter.

Use **Photo settings → Framing & photo details** to show excluded pictures still
cached, restore one, or restore all exclusions. If its cached copy has expired,
restoring permits the next Check now to import it again. Excluded pictures do not
consume the selected gallery count. A cached excluded copy can remain for Undo
when space permits, but all cached items together stay bounded to 300 and 256 MiB. Hash-only
exclusions remain when their image is removed, with a limit of 4,096 exclusions.
At the limit, new exclusions are refused rather than silently forgetting old ones.
Changing the Gmail account, disconnecting or explicitly erasing the cache also
clears exclusions and local choices. Favourite, framing and caption choices are
kept for currently cached IDs and are pruned when those pictures expire.

**Gallery retention** lives under **Photo settings → Storage**. Date choices use
received time rather than capture dates. Count choices keep the newest eligible,
non-excluded unique files without an age cutoff. Each check still scans at most
1,000 inbox messages and 300 image parts, so a very large inbox may yield fewer
than the requested number. The optional sender rule applies before import. Lowering
retention/capacity removes old cached files immediately; expanding it does not
restore them until Check now imports eligible files again. Favourites-only playback
and favourite preference on Overview affect presentation, not retention.

Delivery's optional trusted-sender list accepts up to 50 exact addresses. When
switched on, all From addresses must match before attachments are saved. Empty or
unknown senders are skipped. Counts are coarse; sender data and email bodies are
not saved with pictures. Changing the rule preserves existing pictures; **Erase
saved pictures only** clears the cache while retaining the connection. Disconnect
also removes the credential. Both erase routes require a second tap; revoke the
app password in Google separately. Connection fields remain empty when reopened.

Retention, pruning, deduplication, exclusion persistence and restore are exercised
by the actual PhotoStore on the frame using isolated synthetic images. Live mail
checks and household UI acceptance are recorded separately in [verification](verification.md);
these tests do not establish long-term unattended mail reliability.

## Limits and verification

This is a one-way picture importer, not a general email client. It does not send
mail, manage labels or import Google Photos albums. An optional exact-address
sender rule is available; it does not establish cryptographic sender identity.
Checks require network access and may take time in a large inbox. The implementation
limits a pass to 1,000 recent messages, 300 image parts, 12 MiB per source image
and 4 MiB per saved JPEG. It reports a generic network or sign-in error without
logging message contents or credentials. Google can change its IMAP/app-password
support. The downloaded Android mail libraries are pinned and credited in
[credits](credits.md).

Before calling household email delivery verified, test sign-in, a real sent
picture, browser/zoom and slideshow advance, offline playback, idle entry and return
on the physical frame. Age pruning needs a separate aged-message test. A
desktop preview only checks layout and browser logic. See [verification](verification.md).

## Local slideshow and media tools (2.15)

See [the slideshow guide](slideshow.md) for collections, Keepers, arrival review,
portrait pairing, motion, local file import, soundtrack, presentation export,
brightness scheduling and temporary encrypted phone management. Those features
apply to **Pictures on this frame**. Google shared albums retain their separate
Google player. Choosing local pictures does not require connecting an inbox.

The phone page clears its photos and editing state when its session deadline is
reached or the connection fails. While connected, it checks the frame every ten
seconds and when the page becomes visible again. Stopping access on the frame
revokes server access immediately; the phone reflects this on its next check.
A disconnected phone must scan a new invitation. Slideshow edits are kept separate
from server refreshes, including edits made while an earlier save is still pending.

## Phone companion

Open **Photos** on the frame and scan its QR code. Compare the number on both
screens and approve on the frame before any photo access. The phone has three
destinations: **Photos**, **Collections** and **Slideshow**. The connection line
shows remaining access time; stopping access on the frame or expiry clears the
phone workspace.

Tap a thumbnail to edit with a visible framing preview, or **Select** pictures for
collection, hide/restore, favourite and retention actions. Hidden pictures stay
separate from the on-frame library. Collections use the same saved groups as the
frame. Picture edits and slideshow changes have explicit Save actions and retain
unsaved drafts during polling; other curation actions save immediately.

**Add** accepts up to 20 JPEG, PNG or WebP pictures at once, at most 12 MiB each.
PNG/WebP are converted locally to JPEG before sending; HEIC must first be exported
as JPEG. The bounded sequential queue reports per-file results and retries only
unsaved files. The separate video option keeps the native muted H.264 MP4 limits. No hosted
service or new phone access to accounts, mail or calendars is introduced.
