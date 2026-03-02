

# Rebuild Submit Job Page for JSON API

The current Submit Job page uses file upload (multipart/form-data), but your API actually expects a **JSON payload** with an artwork URL, webhook config, proof options, and detailed print specifications. This requires a complete rewrite of the submission form.

## What Changes

### 1. Replace file upload with a structured form

The new form will have these sections:

**Artwork** - URL to the file and filename
- Artwork URL (required)
- Filename (required)

**Webhook** (optional, collapsible)
- Webhook URL
- Webhook secret

**Proof Settings** (optional, collapsible)
- Generate proof (toggle, default off)
- Expiry hours (number, default 24)

**Specifications**
- Units selector (mm / in)
- Min DPI (number, default 300)
- Colour space (any / CMYK / RGB)
- Font check (toggle, default off)
- Dimension tolerance (number, default 0.5)

**Page Count**
- Min pages, max pages
- Must be even (toggle)

**Pages** (dynamic list -- add/remove pages)
Each page entry:
- Type: combined / front / back
- Range: text input (e.g. "all", "1-4")
- Trim width & height
- Bleed: left, right, top, bottom
- Safe zone: left, right, top, bottom

### 2. Update the API layer

- Change `useSubmitJob` from file upload (`apiUpload`) to a JSON POST (`apiPost`)
- Define a `SubmitJobPayload` TypeScript interface matching the expected schema
- Remove the unused `apiUpload` function (or keep if needed elsewhere)

### 3. Form validation with Zod

- Validate artwork URL is a valid URL
- Validate numeric fields (DPI, dimensions, tolerances) are positive numbers
- At least one page spec is required
- Use `react-hook-form` + `@hookform/resolvers` (already installed) for form state management

## Technical Details

### Files to modify:
- **`src/pages/SubmitJob.tsx`** -- complete rewrite: remove drag-drop, build multi-section form with collapsible sections using Accordion/Collapsible components
- **`src/hooks/useApiData.ts`** -- change `useSubmitJob` mutation to accept `SubmitJobPayload` and use `apiPost` instead of `apiUpload`
- **`src/lib/api.ts`** -- no changes needed (`apiPost` already exists)

### New types (in useApiData.ts):
```text
SubmitJobPayload {
  job_id?: string
  artwork: { url: string, filename: string }
  webhook?: { url: string, secret: string }
  proof?: { generate: boolean, expires_hours: number }
  spec: {
    units: "mm" | "in"
    pages: Array<PageSpec>
    page_count: { min: number, max: number, must_be_even: boolean }
    min_dpi: number
    colour_space: "any" | "CMYK" | "RGB"
    font_check: boolean
    dimension_tolerance_mm: number
  }
}
```

### UI approach:
- Use existing shadcn components: Input, Switch, Select, Button, Card, Accordion
- Sensible defaults pre-filled (300 DPI, mm units, one "combined/all" page, etc.) so the form is quick to submit for simple jobs
- Dynamic "Pages" section with add/remove buttons
- Collapsible optional sections (webhook, proof) to keep the form clean

