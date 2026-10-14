# Signed app updates

Skylit checks the public `sachasayan/skylit` GitHub repository's latest published,
non-prerelease release. It downloads that release's `update.json` and matching
`skylit-VERSION.apk`. Updating main alone does not publish an APK. Draft releases
are excluded. No GitHub token, hosted service or signing key is placed on the frame.

## Owner flow

1. Install the first updater-enabled APK (2.16.0+) with the existing signing key.
2. Open Settings → Frame → Software updates. Check now, read the release notes, then Download update.
   The sidebar shows Update only when an available/downloaded release needs attention.
3. Allow Skylit to install updates in Android's app-specific settings when prompted.
   This is separate from ADB and does not enable wireless debugging.
4. Tap Install update. Android may require confirmation. Existing app settings and
   private storage remain in place; the update never erases app data. Android closes
   the old process during an update. Reopen Skylit if it is not restored by HOME.

Settings independently exposes automatic checks, downloads and installation.
Checking defaults on, once per approximately 12 hours; downloads/install default off.
Enabling installation also enables downloading and checking. Turning checking off
turns the dependent options off; turning downloading off also turns installation off.
Android JobScheduler schedules connected checks and persists the job across reboot;
foreground startup also checks when the previous check is older than 12 hours.

Automatic installation requires a configured hour window, five minutes without a
touch (measured with a monotonic clock), a foreground activity and a recent native activity heartbeat. Times follow
Skylit's selected city timezone, including DST; cross-midnight windows work. Manual
photos, remote services and Settings defer installation. Automatic photo/quiet
ambient displays remain eligible, so a two-minute slideshow idle timer cannot starve
updates forever. Eligibility is checked again immediately before committing an
installation. Android 12 supports self-update without user action under qualifying
conditions; an OEM can still request confirmation, exposed as Confirm update.

## Trust and failure behavior

Release/metadata paths are fixed to this exact repository over HTTPS. Redirects
allow only GitHub and its exact release asset hosts. Metadata/release bodies are
bounded, APKs are limited to 64 MiB, connections time out and reads have a total
budget. Notes render as text. Downloaded APKs live in bounded app-private storage.

Before installation, Skylit verifies SHA-256, package name, exact version name/code,
a strictly newer version code, and the same single current signing certificate as
the installed app. The APK is verified again before PackageInstaller commit. No
caller-provided arbitrary URL or APK path is exposed by the native bridge. Only the
local asset dashboard gets that bridge. Installer callbacks must match the stored
session; the receiver is not exported. Failed/partial downloads do not replace a
verified APK. Failed installation remains retryable through Install update and pauses automatic
installation until a manual retry or newly verified download. A damaged cached APK
is discarded and can be downloaded again. The installed app keeps
working during offline/check/download failures.

## Release procedure and acceptance

Follow [releasing](releasing.md). Normal builds generate `dist/update.json`; personal
builds are never release inputs. The release helper checks source commit, APK
package/version/hash/signature and public source/history/APK scans. It prepares a
draft by default. Publishing a release is a separate explicit operation.

Version 2.16.0 has policy/unit and synthetic UI acceptance plus a signed APK build.
The paired frame was unreachable during this change. Actual download, unknown-source
permission, user-confirmed installation, idle installation, process return and
post-update private-data preservation remain hardware acceptance tasks. Run an
isolated signed test upgrade on the exact paired frame; never uninstall or clear
production app data to test an update. A successful policy test or simulated UI
screenshot is not evidence of a successful Android installation.

Android's documented behavior:
- [PackageInstaller user-action requirements](https://developer.android.com/reference/android/content/pm/PackageInstaller.SessionParams#setRequireUserAction(int))
- [App-specific install permission](https://developer.android.com/reference/android/content/pm/PackageManager#canRequestPackageInstalls())
- [GitHub latest published release endpoint](https://docs.github.com/en/rest/releases/releases#get-the-latest-release)
