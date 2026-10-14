# Skylit component system

React controls live in `src/components/ui/`; their shared visual rules live in
`web/components.css`. Palette roles continue to come from `web/appearance.js`.
Use these components for new React screens instead of writing another local control.
The interactive [showcase](reviews/2026-10-13-component-system/showcase.html)
uses these exact sources, not imitation markup.

| Component | Use |
| --- | --- |
| Button | Primary, secondary, quiet or explicit destructive actions. Default type is button. |
| NativeButton | Custom interactive surfaces and migrated forms; preserves native implicit submission. Prefer Button for new ordinary actions. |
| SegmentedControl | A short list of comparable choices, with Radix roving keyboard focus. |
| VisualChoiceControl | Illustrated choices where the appearance is the decision. |
| Input / Select / Textarea | Native form controls; forward refs, IDs and native properties. |
| Checkbox | Item selection or consent. Native input, never a decorative fake checkmark. |
| Switch | An immediate on/off preference; native checkbox storage/events with switch semantics. |
| Field | Visible label, associated help/error, invalid state and one control. |
| SettingRow | Preference description alongside its control. Give the control its accessible name. |
| Status | Atomic polite feedback; error/success are explicit tones. |
| Disclosure / DisclosureTitle | Native expandable details, generous summary target and keyboard focus. |

Use a 48 CSS-pixel ordinary action target, a consistent 10-pixel control radius,
12-pixel action gaps, palette-based focus rings and visible disabled states. Switches
have a 52×48 hit target around a 30-pixel track. Checkbox labels enlarge the target;
keep the checkbox associated with a label in product screens. Preserve hidden and
native disabled behavior. Honor reduced motion. Never communicate an error only
through its color.

Use segmented controls for a few short options, visual cards for layouts/styles,
and selects for longer lists. Use the existing app palette roles rather than
hard-coded light/dark colors. Keep descriptive text beside the relevant choice.
Do not add an additional confirmation for routine reversible preferences.

## Adoption and boundary

The React shell, canonical settings forms, calendar, photos, dashboard, household,
setup, updates and phone page use shared field/action primitives. Preference
switches have been adopted selectively; photo selection remains a checkbox.
Status paragraphs and native disclosures share components. The updater's hour
fields use the label/help wrapper. SettingRow is available in the showcase; existing
product row layouts still retain their feature-specific structure.

The Settings lightbox lifecycle, task navigation, staged editing and some dynamically
created legacy controls remain in their existing JavaScript controllers. This is
not a replacement of every layout/controller with a component. Phone curation uses
the same React primitives with its existing compact, self-contained stylesheet;
it does not load the full dashboard CSS. Illustrated choices retain their existing
art and geometry. This library does not imply a redesign of the dashboard editor.

## Verification

Run `npm run typecheck`, normal Node/Python tests and
`node scripts/check_settings_interactions.cjs` against the synthetic preview.
`node scripts/build_component_showcase.mjs` regenerates the review-only showcase.
`node scripts/check_components.cjs` tests native toggle/selection, action feedback,
field accessibility, disabled states and segmented keyboard behavior, and captures
light/dark at 1280, 1920 and 390 CSS pixels. It uses the same Playwright/Chrome
variables as the other rendered checks. The showcase is excluded from public app
assets and the APK.
