# Preparing a public release

## Release preparation

The owner has confirmed public release may proceed without the former
license-clarification gate. Preserve the attribution and third-party notices in
[credits](credits.md), and complete the privacy and artifact checks below.

The public repository was created from a clean source export with a GitHub noreply
commit identity. Earlier private development history is kept in a separate private
archive because its commit metadata contains a personal author email. Keep that
archive private; do not push its refs into the public repository.

## Source checks

1. Review tracked files and `git status --short`; keep all household configuration,
   photos, calendar captures, diagnostics, credentials and device records outside Git.
2. Run tests and `python3 scripts/check_public.py --history`. This checks working source
   and every blob reachable from all Git refs, including old versions and deleted files.
   Its patterns cover common household links/identities and some token formats; it is
   an additional guard, not a complete security audit.
3. Run an independently maintained secret scanner, for example Gitleaks:
   `gitleaks git . --redact=100 --log-opts="--all"`. Verify its official download checksum.
   Scan an export of the proposed source too, since Git mode excludes uncommitted changes.
4. Review commit metadata, tags, branches, remotes, release assets and issues for private
   details. Automated secret scanners do not establish that all content is appropriate
   for publication. A public author name/GitHub noreply address is intentional metadata.
5. If sensitive data was ever committed, rotate exposed credentials where relevant and
   prepare a reviewed history cleanup before public visibility. A deletion commit alone
   does not remove the original content.

CI checks the actual PR head or pushed commit with complete branch/tag history.
GitHub-generated PR merge objects use account metadata and are not the published
branch history. Do not push those synthetic refs. Merge locally with the verified
GitHub noreply identity and run the history check before pushing main.

## APK checks

```sh
python3 scripts/build.py
python3 scripts/check_public.py --history --apk dist/skylit.apk
```

The ordinary build includes only a fixed asset allowlist and a blank local-config.js.
The pinned mail libraries' license and notice files are copied into the APK.
Inspect the built artifact itself. Never distribute `skylit-personal.apk`, an old
pre-2.4 APK, a device backup, your keystore, or an exported signed-in WebView profile.
Tests exercise the packaging boundary with a private sentinel value.

Record the release commit, build tools, APK hash and signature verification. Test a
fresh install and an upgrade on intended hardware. Verify weather, settings persistence,
photo return, remote-page isolation, video/Calendar behavior, HOME and recovery paths.
On a fresh install the setup guide should open; an upgrade with existing settings
must land on the previous dashboard, with the guide available from Settings.
For email photo delivery, verify that a fresh install has no mailbox credential,
that a dedicated test account can import and erase a picture, and that the normal
APK contains no account address, app password or cache image. Verify inviter
review against a real test invitation without publishing its details.
Use synthetic data for any public screenshots. Clearly label unverified service flows.

## Publishing

After the privacy and artifact checks pass, push the intended refs, check
GitHub settings and change visibility. Treat uploading binary releases as a separate
reviewed operation. CI runs source/privacy tests; it does not publish anything or use
household credentials, and it does not build with a private signing key.
