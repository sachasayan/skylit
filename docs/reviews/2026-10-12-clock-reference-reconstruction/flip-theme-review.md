# Flip — theme and sampled-motion presentation gates

Direct visual inspection only; no source or implementation descriptions. Theme scope is all **12 native 496×300 medium captures** in `themes/`: `stacked-{linen,sage,stone,ocean,plum,contrast}-{light,dark}.png`. Motion scope is actual browser captures in `motion/`: `flip-before.png` and frames `000, 010, 014, 018, 024, 031, 041`.

**Theme presentation gate: PASS for all 12 supplied captures. Sampled minute-change visual gate: PASS for the supplied 10:24 → 10:25 sequence.** These are separate gates from the approved-concept light-theme fidelity review and from runtime/device verification.

## Theme audit

| Pair | Light | Dark | Concrete observation |
|---|---|---|---|
| Linen | PASS | PASS | Light uses cream numerals on olive plates; dark keeps cream on darker olive with a fine pale perimeter. Date/AM remain legible against each ground. |
| Sage | PASS | PASS | Light cream-on-deep-green and dark dark-green-on-pale-sage glyphs are distinct. Midline/rectangular hinges remain visible on both. |
| Stone | PASS | PASS | Neutral dark plates in light and pale plates in dark retain clear numerals, gap and seam. Date/AM stay readable and secondary. |
| Ocean | PASS | PASS | Blue-toned plate/ground relationships preserve glyph contrast and edge components; pale-blue dark plates distinguish from the dark panel. |
| Plum | PASS | PASS | Plum light plates and pale-plum dark plates preserve numeral/seam separation. Date/AM hue does not obscure their reading. |
| Contrast | PASS | PASS | Near-black/white plate inversion strongly separates numerals. Thin seam and small hinges remain visible; very subtle face modeling is compatible with this high-contrast variant. |

Across **each** supplied capture:

- Two portrait plates remain independent, with background gap visible. Cream/dark numerals preserve the large regular sans forms and closed `4`; no glyph clipping or half misregistration.
- Midline seam stays a fine continuous separator through the glyphs. Hinges are small vertical edge parts with local contrast, visible in light and dark; no thick bar fills the tile gap. Pale rims/edge separation adapt to the palette without becoming heavy housings.
- Date above and tracked AM below remain fully visible and subordinate. No text/decorative collisions, truncated date, or AM overlap.
- Botanical growth remains attached to the vase neck, with rising right stem and low leftward fan. Dark themes mute the olive foliage relative to the ground, but broad/narrow leaf silhouettes and open branch gaps remain distinguishable; the foliage stays secondary rather than disappearing into an undifferentiated dark patch.
- The pale pear-shaped vase retains neck/lip, rounded belly, sparse speckles and soft volume. Bright vase on dark ground does not hide its base contact.
- Shelf still has a visible oblique top plane and darker front face, fine directional grain and grounding contact under the vase. Right/bottom cropping is coherent. No new unintended clipping occurs.

**Scoped limitations:** This is visual medium-size presentation acceptance, not measured contrast-ratio certification. All-theme checks at every responsive shape, actual frame brightness/viewing distance, automatic switching and rendering performance are not established by these twelve images. Theme colors are allowed to adapt; dark inversion is not incorrectly penalized for failing to remain the approved light concept's exact olive/cream palette.

## Sampled motion audit

| Sample | Observed state | Judgment |
|---|---|---|
| `flip-before.png` | Stable `10 / 24` with coherent midline and aligned halves | Baseline established visually. |
| `frame-000.png` | `10 / 24`; minute plate retains baseline layout | No premature final value or disturbed hour tile. |
| `frame-010.png` | Old `24` upper face is visibly rotating/foreshortened around the middle hinge line; old lower half remains | Plausible old-upper departure. Projected flap extends slightly beyond plate side bounds, consistent with perspective; not lasting overflow. |
| `frame-014.png` | New upper `25` is revealed; lower still contains old `24` while the departing flap becomes almost edge-on at seam | Correct old/new ordering for a flipping transition. Temporary mixed numeral is mechanically coherent, not a settled half-alignment fault. |
| `frame-018.png` | `25` has both halves visible; slight transient lower-face shading remains | New value is assembled without duplicated digits or displaced baseline. |
| `frame-024.png` | Stable `10 / 25`, ordinary seam/hinges/face geometry | Settled state coherent. |
| `frame-031.png` | Stable `10 / 25` | No reversion, repeat flap or residual ghost. |
| `frame-041.png` | Stable `10 / 25` | Final state preserves tile layout, digit alignment and surrounding composition. |

The hour `10`, date, AM, panel and corner decoration remain fixed throughout the supplied samples. The projected moving upper flap retains the minute tile's pivot zone; seam/hinges remain at the same location. Edge-on passage briefly thickens that local line, which is a transient physical flip shape rather than a final seam mismatch. In final samples, upper/lower `25` halves meet without lateral or vertical offset, and no old `4` fragment remains.

**Scoped limitations:** Discrete frames establish the visible ordering, pivot and settled alignment of this one light-theme minute change. They do not establish frame pacing/smoothness, total duration, hour rollover, double-digit carry, rapid repeated updates, every theme, reduced-motion behavior or actual Android/WebView execution. No inferred FPS or timing claim is made.

**Decision:** accept the supplied theme presentations and sampled minute-change visual sequence independently within these scopes.
