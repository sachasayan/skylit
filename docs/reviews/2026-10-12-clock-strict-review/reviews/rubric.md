# Locked clock concept review rubric

Established from `approved.png` alone, before viewing implementation captures. Only Analog (top-left), Landscape (top-middle), Flip (top-right), and Botanical (bottom-left) are in scope. Ring and Window are excluded. This rubric remains fixed for the first implementation review.

## Acceptance rule

Every selected concept must pass two independent gates in every supplied shape:

1. **Concept quality and aesthetic finish:** the implementation convincingly carries the reference's defining visual language, with finished typography, materials, lighting, art, curves, hierarchy, ornament, and warmth.
2. **Responsive composition and readability:** the particular shape has a deliberate, balanced composition and readable clock information. It must feel designed rather than compressed or merely made to fit.

Passing one gate cannot compensate for failing the other. Functional correctness (accurate time, valid labels, absence of clipping) is evaluated separately from fidelity and finish. There is no credit for improvement over an earlier implementation.

The square reference supplies visual language, not a mandatory layout. Dates may move, panels may stack, hills may be redrawn, and ornaments may shrink or be omitted when the resulting composition preserves the concept and its quality. Calm negative space is a positive feature when it supports hierarchy and balance; it is not a defect merely because the reference uses that space differently.

## Shared visual language

- **Warmth:** luminous ivory and cream surfaces, olive foliage and dark olive type, restrained copper/terracotta accents. The palette feels sunlit and domestic, with controlled tonal contrast rather than harsh black/white or saturated accent color.
- **Surface and lighting:** a soft, tangible paper/ceramic-like ground, subtly modulated rather than a sterile flat fill. Rounded containers have credible gentle edge light and shallow soft shadows. Depth remains restrained and coherent; bevels, texture, gradients, and shadows should reinforce an implied material instead of appearing as unrelated effects.
- **Curves:** generous clean corner radii, smooth hills and organic background shapes, delicate tapering foliage. Curves must be controlled and graceful, without mechanical kinks, blunt joins, or arbitrary bulges.
- **Hierarchy:** time or the analog face commands the composition. Date and AM/PM are distinctly secondary, with spacious tracking and sufficient contrast. Decorative art supports the clock without competing for its reading area.
- **Numeral scale:** display numerals are confident and substantial. Reducing type to a timid label, or filling a shape so aggressively that it loses breathing room, both undermine the reference. Numerals need balanced proportions, controlled spacing, and a type family that supplies the selected concept's character.
- **Ornament proportion:** the plants, shelves, and landscape layers are thoughtfully cropped and proportioned. They retain enough quality to merit their visual prominence. Decorative size should follow the composition, not a requirement to reproduce a fixed bounding box.

## Analog defining qualities

- A large, luminous circular dial integrated with the warm surface. Its shallow rim and gentle shading imply a real disc with soft depth; it should not read as a plain outline pasted onto a rectangle.
- Slender, warm brown cardinal numerals and restrained hour marks, with generous spacing around the face. Their scale makes the dial effortlessly readable without making the numerals heavy.
- Copper hour/minute hands with softly rounded ends and believable slight thickness, a small olive pivot, and a fine olive seconds hand. Proportions and hand contrast produce a composed, recognizable clock.
- The plant at the lower-right is a delicate trailing vine with varied leaves, fine stems, subtle leaf shaping/veins, and a believable warm terracotta pot. The wooden shelf has material and shallow depth. If retained, it must feel illustrated with care, rather than a stock icon or coarse repeating leaf glyph.
- Decoration may be smaller or omitted in constrained shapes, provided the remaining dial and material treatment still give the concept its warm tactile character.

Consequential gaps include a lifeless flat dial, heavy or generic marks, poorly proportioned hands, an oversized pivot, or conspicuous crude plant/pot/shelf art.

## Landscape defining qualities

- Large, elegant serif display time in dark olive. The reference's fine/thick stroke contrast and broad, poised numeral shapes are central to its character; generic small sans-serif digits would lose the concept.
- A small, widely tracked uppercase date above, with a separate restrained AM/PM below. The clock occupies the quiet sky with ample breathing room.
- A warm cream/peach sky, a softly glowing ochre sun, and smoothly layered rolling hills in terracotta and olive. The layers have gentle texture and tonal variation, giving them a paper/painted character instead of generic flat clip art.
- The landscape is low and calm, with measured asymmetry and believable overlaps. Hill silhouettes and sun placement must create an intentional scene rather than a decorative stripe or arbitrary overlapping ovals.
- Hills may be redrawn for each aspect ratio and the date/period may move. Retain confident typography, warm depth, and a composed relationship between sky and land.

Consequential gaps include timid numerals, weak serif character, stiff or arbitrary hill curves, a harsh flat sun, conspicuously generic art, or loss of the quiet sky/time hierarchy.

## Flip defining qualities

- Two substantial dark olive flip panels with warm ivory, large clean sans-serif numerals. The numeral weight, scale, centering, and open shapes carry the immediate readability of the concept.
- Rounded panel corners, restrained upper/lower tonal differentiation, a precise midline seam, and small edge hinges express a plausible physical mechanism. Shallow highlights, shadows, and surface variation give the panels weight and thickness.
- The seam is subordinate to the digits; hinges are small convincing details, not large visual interruptions. Panel spacing is narrow and deliberate, and the pair reads as one clock.
- AM/PM is secondary, widely tracked, and visually attached to the panel group.
- The lower-right olive sprig in a softly modeled pale ceramic vase and warm wood shelf adds quiet domestic detail. Its leaves are varied and tapered, the stems fine, and the vase has a credible neck/base and softly shaded volume. If retained, it must be more than a coarse icon.
- Stacking panels is allowed when it yields a purposeful compact composition. The resulting group still needs balanced numeral scale, coherent material depth, and a clear reading order.

Consequential gaps include flat featureless panels, flimsy panel proportions, shallow or generic digits, oversized mechanical details, miscentered halves, or coarse vase/sprig art.

## Botanical defining qualities

- Very large warm terracotta serif display numerals with confident weight and rounded, elegant contours. This is a strong typographic composition, not a small clock with a plant added.
- Small widely tracked olive weekday/date text, and a secondary AM/PM. Alignment and spacing create a calm editorial hierarchy.
- Soft, translucent organic cream/beige shapes add subtle depth to the ground. Their asymmetry and curvature feel natural and composed, not like random overlapping circles or a conspicuous unrelated badge.
- A delicate olive branch rises from the lower-right. It uses thin curving stems, varied pointed leaves, graceful angle changes, and subtle leaf veins/tonal modeling. The branch is airy and botanically expressive, rather than thick, blunt, symmetrical, or mechanically repeated.
- Foliage acts as a substantial but subordinate counterweight to the time. It may be reduced, simplified carefully, or omitted in a constrained shape, but the warm typographic and organic-surface identity must remain convincing.

Consequential gaps include timid or characterless time type, overly dark/heavy foliage, coarse leaf geometry, visually dominant background blobs, or a generic unmodulated background that loses the reference's softness.

## Responsive gate

For every supplied aspect ratio, inspect:

- Time is readable first, with useful display scale, sufficient contrast, and balanced spacing. Analog hand/dial readability and Flip digit order remain clear.
- Date and AM/PM retain a distinct secondary relationship and comfortable distances; they neither float accidentally nor collide with numerals/art.
- The clock group is intentionally positioned within the shape. Visual weight, margins, and negative space form a stable whole, including when decoration is absent.
- Ornament and illustration are proportioned and cropped with purpose. No near-tangencies, accidental edge cuts, cramped leaves, trapped labels, or residual fragments from an unsuitable square layout.
- Materials and art survive the new scale. Tiny details may be removed, but remaining shapes, seams, curves, and textures must still be clean and expressive.
- Wide, square, and narrow variants may use different arrangements. A responsive layout succeeds through its own compositional quality, not resemblance to the reference's coordinates.

## Review discipline

Judge consequential visible gaps, not gratuitous differences. Give each blocker a concrete correction linked to this rubric. Flat vector rendering is not automatically sufficient, and aesthetic defects are not automatically waived as subjective preferences. Conversely, do not reject a successful intentional adaptation solely because it differs from the square reference. Report both gates independently, with the affected concept and shape identified. Screenshot evidence supports visual conclusions only; it does not establish runtime correctness.
