# Clock visual review — round 3

**Verdict: REVISE — one remaining geometry defect.** Independently inspected the target, all four six-shape sheets, and all 24 original crops. The previous main composition blockers are resolved. This review covers the supplied synthetic 10:24 light-theme renders only.

## Remaining blocker

**Botanical top leaf is clipped flat.** Wide, medium, tall and full each show a conspicuous horizontal cut across the tip of the uppermost leaf. This is unintended SVG clipping, unlike a stem/branch intentionally running out of the card's bottom/right edge. It weakens the now otherwise coherent illustration. Source corroborates the pixels: the branch has `viewBox="0 0 260 330"`, while the leaf based at `[158,73,-6,.9]` extends above y=0. Expand the branch's top drawing bounds/bleed or move that leaf fully into bounds; preserve its current modest size and text separation. Recapture all decorated Botanical shapes and check the rounded leaf tip and neighboring leaves for complete silhouettes.

## Per-style / per-shape review

| Style | Minimum | Wide | Medium | Tall | Strip | Full |
| --- | --- | --- | --- | --- | --- | --- |
| Landscape | Pass: strong time, useful abbreviated date, unclipped rising sun. | Pass: intentional text/art split; dominant time. | Pass: circular sun and rolling hills; clean text region. | Pass: improved hierarchy and balanced upper text/lower scenery. | Pass: large time and inline period, separate scenery. | Pass: coherent spacious composition and readable hierarchy. |
| Analog | Pass: clean dial/date, decoration omitted. | Pass: plant no longer crowds date; fine face/date composition. | Pass: quiet cream dial, terracotta hands, subordinate plant. | Pass: centered face/date with intentional calm space. | Pass: horizontal date, dial uses most available height. | Pass: refined dial and contained supporting plant; no collisions. |
| Flip | Pass: legible tiles, clear seam and date/period. | Pass: plant is now distinct and clear of text. | Pass: tiles/date/plant no longer intersect. | Pass: vertical tile stack is a coherent adaptation and uses the height well. | Pass: tile group is balanced across the strip, date beside tiles. | Pass: strong tile hierarchy, independent corner plant, clean date. |
| Botanical | Pass: clear time and inline period, no stray miniature plant. | Revise: clipped upper leaf; otherwise clear typography and subordinate branch. | Revise: clipped upper leaf; text/plant separation now adequate. | Revise: clipped upper leaf; branch size now supports rather than dominates. | Pass: prominent centered time/date/period, no remote miniature plant. | Revise: clipped upper leaf; typography, wash and branch balance otherwise pass. |

## Non-blocking refinements / preferences

- Analog strip's face/date group sits somewhat left of the card center; centering the combined visible group would be tidier, but current scale is readable and the calm whitespace is acceptable.
- Landscape wide's art is a strong geometric interpretation, and all scenery remains flatter than the generated target. The curves/gradients retain sufficient warmth; literal paper texture is not required.
- Botanical wash remains a broad diagonal organic form rather than matching the target's exact silhouette. Its reduced contrast and clear text area make this acceptable.
- The approved square Flip concept does not require horizontal tiles in a narrow tall module. The new vertical composition is successful.
- Card-edge cropping of scenery and a branch stem is intentional composition; truncating an internal leaf tip is a genuine defect.

Fix the single Botanical SVG clipping issue without reopening the successful layouts, then provide a focused new capture for acceptance.
