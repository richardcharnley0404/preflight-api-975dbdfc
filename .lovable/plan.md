

# Document Multi-Page Specifications in API Docs

## Summary

Add a dedicated "Multi-Page Specifications" section to both the interactive docs page and the OpenAPI JSON spec, explaining how to define different trim sizes, bleed, and safe zones per page range -- using a perfect bound book as the primary example.

## Changes

### 1. `src/pages/ApiDocs.tsx`

- Add a new TOC entry: "Multi-Page Specs" (between "Submit a Job" and "Get Job Result")
- Add a new `<Section>` with:
  - **Explanation**: The `pages` array accepts multiple entries, each targeting a different page range within the PDF. This lets you define different dimensions and margins for covers vs text pages.
  - **Perfect Bound Book example** (curl + JS tabs) showing two page specs:
    - Cover: range `"1"`, trim 425x297mm, bleed 3mm all sides, safe_zone 10mm all sides
    - Text: range `"2-100"`, trim 210x297mm, bleed 3mm all sides, safe_zone 5mm all sides
  - **`type` field explained**: `"combined"` = cover and text in one PDF, `"front"` / `"back"` = separate artwork files for each side
  - **Page range syntax**: `"1"`, `"1-4"`, `"2-100"`, `"all"`
- Update the existing submit example's description to mention that `pages` supports multiple entries (brief cross-link to the new section)

### 2. `public/api-docs.json`

- Add a `description` field to the `PageSpec` schema explaining multi-spec usage
- Add a second request body example to `POST /v1/jobs` showing the perfect bound book payload with two page specs
- Add descriptions to `PageSpec.type`, `PageSpec.range`, and `PageSpec.safe_zone` properties for clarity

