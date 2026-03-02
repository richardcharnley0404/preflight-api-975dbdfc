

# Fix Job Detail Page: Show Full Preflight Check Breakdown

## Problem

The `checks` data from Railway is an **object** (keyed by check name), not an array. The current code tries to render it as an array, so no checks are displayed. The Proof URL card also just shows "Available" or a dash instead of a clickable link or "Not generated".

## Actual data structure from Railway

```text
checks = {
  dimensions:   { passed: bool, details: [{ message, page, ... }] }
  page_count:   { passed: bool, expected_min, expected_max }
  bleed:        { passed: bool, details: [{ message, page, edge, ... }] }
  safe_zone:    { passed: bool, warnings: [] }
  resolution:   { passed: bool, pages_failed: [{ message, dpi, page, ... }], min_required_dpi }
  colour_space: { passed: bool, required, pages_failed: [{ message }] }
  fonts:        { passed: bool, details: [...] }
}
```

Each check has `passed: boolean` and failure details in varying fields (`details`, `pages_failed`, or `warnings` arrays, each item having a `message` string).

## Changes (single file: `src/pages/JobDetail.tsx`)

### 1. Update TypeScript interfaces

Replace the flat `JobCheck` interface with types matching the real structure:
- `CheckEntry`: `{ passed: boolean; details?: { message: string }[]; pages_failed?: { message: string }[]; warnings?: { message: string }[]; message?: string }`
- `ChecksMap`: `Record<string, CheckEntry>`

### 2. Parse checks as an object

Replace the current `Array.isArray(job.checks)` logic with:
- Cast `job.checks` to `ChecksMap` (an object)
- Convert to an ordered array of `[name, checkData]` entries using a display-order list: Dimensions, Page Count, Bleed, Safe Zone, Resolution, Colour Space, Fonts
- Format the key names nicely (e.g., `colour_space` becomes "Colour Space")

### 3. Render each check with pass/fail and expandable details

For each check entry:
- Show a pass (green check) or fail (red X) icon based on `passed`
- Show the check name (formatted)
- If failed, show the detail messages from whichever array is present (`details`, `pages_failed`, or `warnings`), collapsible if more than 3 items to avoid overwhelming the UI

### 4. Fix the Proof URL metadata card

Replace the current `{ label: "Proof URL", value: job.proof_url ? "Available" : "-" }` with:
- If `proof_url` exists: render a clickable link ("View Proof")
- If not: show "Not generated"

Remove the separate standalone proof card since the metadata card will handle it.

## Technical details

- Uses Radix `Collapsible` component (already installed) for expandable detail lists
- No database or backend changes needed
- Normalizes the varying detail field names (`details` / `pages_failed` / `warnings`) into a single messages array for rendering

