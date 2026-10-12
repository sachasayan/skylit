# Landscape theme presentation gate — direct native visual review

Inspected all twelve native medium (496×300) theme captures in themes/: classic-{linen,sage,stone,ocean,plum,contrast}-{light,dark}.png. Direct images only: no source, geometry-derived conclusion, or prior gate assumed. This is a separate color/material presentation gate from the seven-shape review.

## Result

**FAIL across the complete theme set.** Linen light and dark pass this visual presentation check. The other ten variants weaken a defining feature: the sun is a faint near-sky-colored ghost rather than a distinct disk. Dark variants make its exposed upper arc almost disappear. The text remains readable in all twelve, and there is no clipping or collision. Theme adaptation may change the hues; it must preserve the visible sun and distinguishable land layers.

## Per-capture evidence

| Native capture | Text / clipping | Sun | Land separation / material | Gate |
|---|---|---|---|---|
| Linen light | Readable olive time/date/AM; no clipping | Clearly visible muted golden disk behind hill | Three warm/green layers legible; soft matte variation | Pass |
| Linen dark | Readable light olive lettering; no clipping | Clearly visible warm brown/gold disk against dark sky | Terracotta sweep, lighter right hill and green foreground distinguishable | Pass |
| Sage light | Readable dark green lettering; no clipping | Very faint pale circle, close to sky value | Layer contours visible; subdued green variation remains matte | Fail: sun distinction |
| Sage dark | Readable light green lettering; no clipping | Almost absent; a dim cloudy arc with a tiny right-edge sliver | Left sweep/right rear hill close in value; foreground still distinguishable | Fail: sun distinction; rear layers weakened |
| Stone light | Readable gray-green lettering; no clipping | Faint gray circle against pale sky | Silhouettes distinguishable; soft monochrome material | Fail: sun distinction |
| Stone dark | Readable pale gray-green lettering; no clipping | Almost absent against dark gray-green sky | Rear land layers very close in value, though contour can be followed | Fail: sun distinction; rear layers weakened |
| Ocean light | Readable blue lettering; no clipping | Very faint blue-gray circle | Blue sweep/right hill/foreground distinguishable | Fail: sun distinction |
| Ocean dark | Readable pale blue lettering; no clipping | Almost absent; only vague low arc | Rear light-blue layers close in value; foreground distinct | Fail: sun distinction; rear layers weakened |
| Plum light | Readable plum lettering; no clipping | Faint pink/purple disk blends into sky | Plum land contours readable; soft matte tonal variation | Fail: sun distinction |
| Plum dark | Readable pale pink lettering; no clipping | Almost absent against dark plum sky | Rear pale-pink layers close; foreground remains distinguishable | Fail: sun distinction; rear layers weakened |
| Contrast light | Clearly readable dark lettering; no clipping | Very faint pale green circle despite strong text contrast | Land contours clear, especially dark left sweep | Fail: sun distinction |
| Contrast dark | Clearly readable bright pale-green lettering; no clipping | Almost absent against dark green sky | Rear pale-green layers very close; foreground distinct | Fail: sun distinction; rear layers weakened |

## Cross-theme observations

- **Text passes the direct visual check.** Time is the primary readable object in each capture; date and AM are legible, with no color-induced disappearance. Contrast variants are visibly stronger. This is a visual assessment, not a numerical WCAG measurement.
- **Sun fails in the non-linen palettes.** Its position and exposed arc can be found when deliberately inspecting the images, but that is weaker than the approved concept's clear colored disk. In dark sage/stone/ocean/plum/contrast, the sun resembles a barely visible shadow/blob with a thin pale sliver at its right edge. Finding a ghost outline after searching does not satisfy the defining sun/sky distinction.
- **Hill silhouettes generally remain visible.** Green/blue/plum/gray adaptation is acceptable; the theme need not retain the literal linen colors. In the five non-linen dark variants, the left sweeping hill and the right rear hill use similar pale values, so their meeting/division is soft and sometimes difficult to follow. The front foreground remains distinguishable. This is weakened layer separation rather than complete loss of the landscape.
- **Material remains matte.** Soft mottling and broad tonal variation are visible, with no gloss, ray effects, contour outlines, or artificial hill bevels. Texture remains broader/cloudier than the approved pigment/grain, a smaller material deviation. Nothing in this theme check requires adding a hard outline or stronger shadow to manufacture separation.
- **No clipping or collision is visible.** Text, panel corners, sun/terrain boundaries, and lower land clipping are intact in these medium captures. This finding does not extrapolate to other sizes or actual hardware.

## Required correction and recheck

Give the sun a visibly distinct value/tint from its surrounding sky in each non-linen light and dark palette, retaining a matte disk with clean round arc rather than relying on a thin outline. Strengthen the two rear land values enough that their overlap remains legible in the non-linen dark palettes, without demanding a large contrast ratio for decorative hill boundaries. Preserve the readable text colors and soft material.

Re-inspect all twelve medium theme captures after the palette correction. The complete theme presentation gate remains **unaccepted** until the ten non-linen sun distinctions are resolved; the prior shape gates do not override this finding.
