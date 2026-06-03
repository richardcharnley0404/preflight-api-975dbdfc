## Goal

Every account gets a system-provided configuration called **"Print Pre-flight Standard"** that:
- Applies to **all products**, including any added later
- Is **always available** in the submission wizard
- Is **read-only** (can't be edited or deleted) so it can't drift
- Sits alongside any custom configurations the user creates

## Approach

Treat the standard as a **frontend synthetic preset**, not a row in the Railway presets store. This means:
- It exists in code, so it automatically covers every product the catalogue ever returns — no resync needed when new products ship.
- No backend migration, no seeding logic on signup, no risk of partial rollout to existing accounts.
- When a user submits a job with it selected, we send the spec values inline (the backend already accepts an inline spec without a `preset` name), so it works without the Railway side knowing about the ID.

## Standard defaults

Matches the current dialog defaults:
- units: mm
- min_dpi: 300
- colour_space: cmyk
- font_check: true
- bleed_default: 3
- safe_zone_default: 5
- dimension_tolerance_mm: 0.5
- No page-count / TAC / stroke enforcement

## Changes

**New file `src/lib/standardPreset.ts`**
- Export a `STANDARD_PRESET` object (id `printpreflight_standard`, name "Print Pre-flight Standard", description "System default — applies to all products", the spec above).
- Export a helper `isStandardPreset(id)`.

**`src/components/submit/StepConfig.tsx`**
- In `filterPresetsForProduct`, prepend the standard preset to `custom` (or a new `system` group) for every product, regardless of `product.id`.
- Mark its card with a "System" badge and a short hint ("Always available").
- When the wizard auto-selects a default and the user has no configs, pre-select the standard.

**`src/pages/SubmitJob.tsx`**
- When the selected preset is the standard, build the submit payload with the inline spec values from `STANDARD_PRESET.spec` instead of `spec.preset`. Custom presets keep using `spec: { preset, product: { type } }`.

**`src/pages/Configurations.tsx`**
- Render the standard as the first row in the table, with an "System" badge.
- Hide the Edit and Delete buttons for it; show a small "Read-only" label instead.
- Empty-state copy updated: "You always have the Print Pre-flight Standard. Create your own configurations to override it for specific products."

**`src/components/configurations/ConfigurationDialog.tsx`**
- No functional change. (The dialog is never opened for the standard.)

**Tests**
- `src/test/config-filter.test.ts`: add a case asserting the standard preset is present for any product, and is not duplicated when a user also has a custom preset.
- New `src/test/standard-preset.test.ts`: asserts `STANDARD_PRESET` has the documented defaults so accidental edits are caught.

## Out of scope

- No database migration or backend changes.
- No edits to the Configurations CRUD endpoints — the standard is never POSTed.
- No change to webhook / proxy functions.

## Open question

If you'd rather the standard be a real backend record (so it's also visible to API-only customers hitting `/api/dashboard/presets/custom/list` directly), say the word and I'll swap to a backend-seeded version instead — but that needs a Railway-side change and a backfill for existing accounts.
