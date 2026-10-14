# Credits and third-party notices

Skylit was inspired by **Wes Bos’s photo-frame-dashboard**:
https://github.com/wesbos/photo-frame-dashboard

The original frame exploration and full-screen kiosk starting point came from that
project, initially checked out at `adcbc38411ae0e653fbcdd078076eadaadacb313`.
The web dashboard, Momo, settings, service integration and local build/deployment
work were developed here. The Android activity and manifest were adapted from
Wes’s kiosk, and the package ID remains compatible with our initial installation.
This is an independent project, not an official Wes Bos or Skylight product.

## Release direction

The project owner confirmed on October 10, 2026 that public release should proceed
without the previously recorded license-clarification gate. That gate is removed
from the project's setup and release instructions. Preserve the attribution above
and the bundled third-party license notices below when distributing the project.

## Services and assets

- Forecasts and geocoding: [Open-Meteo](https://open-meteo.com/), also credited in the UI.
- Photos and Home: Google’s official websites; YouTube’s official mobile/web site.
- Calendar data: owner-configured Google iCalendar feeds.
- Email photo import: [Jakarta Mail for Android 1.6.7](https://central.sonatype.com/artifact/com.sun.mail/android-mail/1.6.7)
  and [Jakarta Activation for Android 1.6.7](https://central.sonatype.com/artifact/com.sun.mail/android-activation/1.6.7),
  EPL-2.0 OR GPL-2.0 with Classpath exception. Unmodified JARs are pinned in
  `vendor/mail/` and checked by SHA-256 in `scripts/build.py`. Their embedded
  `META-INF/LICENSE.md` and `NOTICE.md` are copied into every APK's assets.
- iCalendar parsing: [ICAL.js 2.2.1](https://github.com/kewisch/ical.js/tree/v2.2.1),
  MPL-2.0. The unmodified ES5 distribution is bundled as `web/ical.js` with its
  license in `web/ical-LICENSE.txt`. Source is available at the linked tagged release.
  npm package integrity was checked before vendoring. SHA-256 of the bundled file:
  `02b0ab420c2b3af5bd0829b12b8becdffdc2311e62070c381cc0c60b52b0b365`.
- Offline sunrise/sunset: [SunCalc 1.9.0](https://github.com/mourner/suncalc/tree/v1.9.0),
  BSD-2-Clause. The unmodified classic browser bundle and license are included as
  `web/suncalc.js` and `web/suncalc-LICENSE.txt`. npm SHA-512 integrity was verified;
  this pinned version uses radians, unlike newer API revisions.
- Local QR generation: [qrcode-generator 1.4.4](https://github.com/kazuhikoarase/qrcode-generator),
  MIT, copyright Kazuhiko Arase. The unmodified npm distribution is bundled as
  `web/qrcode.js`, with `web/qrcode-LICENSE.txt`. npm SHA-512 integrity verified;
  bundle SHA-256: `18ae399f81182bc9de916e9c77b195df20cc58d6f2d55a62b085a299f1bf1780`.
  No external QR service receives the invitation.
- Clock-widget concept reference: AI-generated; the hills, dial and live hands use local SVG/CSS. Analog's transparent `clock-analog-plant.png` vignette was generated and refined with the built-in OpenAI image generator against the approved concept; the clock itself stays live. Flip's transparent `clock-flip-plant.png` vase/shelf vignette and Botanical's `clock-botanical-branch.png` sprig were also generated with the built-in OpenAI image generator against the approved reference, with genuine alpha preserved. The time, dial, hands, Flip plates and hills remain live SVG/CSS/HTML. The small bundled `clock-grain.png` is original deterministic procedural grain, used as a local static surface tile.
- Clock typography: locally bundled, unmodified [Cormorant Garamond](https://github.com/google/fonts/tree/main/ofl/cormorantgaramond) by Christian Thalmann and [Jost](https://github.com/google/fonts/tree/main/ofl/jost) by Owen Earl, both under the SIL Open Font License 1.1. Their notices are bundled as `clock-serif-OFL.txt` and `clock-sans-OFL.txt`. SHA-256: Cormorant Garamond `b20b7d9626dd956b2c5e558692ad328b1f19e3275e2782db4fa07670d83f35e0`; Jost `6343b70971000b04c5d401c96ae08ce371086135e999d5e1e1413039c0213076`. No external font requests.
- Momo: original procedural Canvas 2D art. The design reference is AI-generated;
  the shipped character uses geometry, not an external image or font asset.
- Public photo-preview fixtures: five AI-generated sample pictures under
  `tests/fixtures/demo-photos/`. They appear only in the isolated synthetic preview,
  README screenshots and the project website, never in a normal APK or the household photo cache.
- Additional portrait, clip, GIF and soundtrack test fixtures are original procedural art and generated test tones. They remain confined to synthetic previews and private test APKs.
- Android SDK and JDK are development dependencies with their own license terms;
  their toolchains are not included in this repository.

## Website

- `site/` reuses Momo, the palette data and the bundled Lora and Jost fonts from `web/` at
  staging time; their notices above apply. Screenshots come from the synthetic preview.

Product names belong to their respective owners. No affiliation or endorsement is implied.

Landscape retains Cormorant Garamond's lining numerals. Botanical uses locally
bundled, unmodified [Lora](https://github.com/google/fonts/tree/main/ofl/lora)
by Cyreal under SIL Open Font License 1.1, with `clock-display-OFL.txt` bundled.
Pinned Google Fonts commit: `186331d77cc99caaa9c3b52391fd2b519c9e1ee8`.
Font SHA-256: `822a6621ccbe8d97d20ac88c1c41f5615c9c2c202eaa75f272cd452aac6475a7`.
No external font or illustration requests at runtime. Exact illustration prompts
are in the clock reference reconstruction report.

## React frontend

React 18, React DOM, Radix UI primitives, class-variance-authority and clsx are
MIT-licensed. The owned Button and segmented-control components follow the
shadcn-style composition pattern while using Skylit’s existing warm CSS.
Complete installed production-dependency notices are bundled in
[`frontend-LICENSES.txt`](../web/frontend-LICENSES.txt); esbuild also preserves
linked legal comments beside both generated bundles. TypeScript and esbuild
are development-only build tools.
