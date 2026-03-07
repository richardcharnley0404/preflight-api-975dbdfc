

# Improve Multi-Page Spec UX in Submit Job Form

## What's Changing

The form already supports multiple page specs technically, but the UX doesn't guide users. We'll add:

1. **Editable label per page spec** -- a text input (defaulting to "Cover", "Text Pages", etc.) so users can name each spec for clarity
2. **Preset buttons** -- quick-add buttons like "Perfect Bound Book" that auto-populate two page specs (cover + text) with sensible defaults
3. **Collapsible page specs** -- each spec collapses after initial setup to reduce visual clutter
4. **Better "Add" dropdown** -- instead of just "Add Page", offer "Add Cover Spec" and "Add Text Pages Spec" with different defaults
5. **Helper text** -- explain that each spec targets a page range within the PDF

## Changes

### `src/pages/SubmitJob.tsx`

- Add a `label` field to `pageSchema` (optional string, UI-only, stripped before API call)
- Add preset constants: `COVER_PAGE` (425x297mm trim, 10mm safe zone) and `TEXT_PAGE` (210x297mm, 5mm safe zone)
- Add a "Presets" dropdown (DropdownMenu) next to "Add Page" with options:
  - "Perfect Bound Book (A4)" -- appends cover spec (range "1") + text spec (range "2-end")
  - "Saddle-Stitched Booklet (A4)" -- single spec, all pages same size
  - "Custom" -- appends a blank default page
- Wrap each page spec in a `Collapsible` that shows the label + trim summary when collapsed
- Add an editable label input at the top of each page spec card
- Strip `label` from each page in `buildPayload()` before sending to API

No schema or backend changes needed -- the `label` is UI-only.

