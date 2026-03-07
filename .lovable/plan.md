
# Add Proof Viewer Option to Submit Job & Job Detail

## What changes

### 1. Submit Job form (`src/pages/SubmitJob.tsx`)
- Move the "Generate proof" toggle **out of the collapsible** section so it's always visible -- it's an important user-facing option, not an advanced setting
- Change the default `proof_expires_hours` from `24` to `72`
- When proof is enabled, show the expiry hours input inline; when disabled, hide it
- Update `buildPayload` so when `proof_generate` is false, send `generate: false` (already works)

### 2. Job Detail page (`src/pages/JobDetail.tsx`)
- Replace the current "View Proof" text link with a styled `Button` component that opens in a new tab
- Add an `ExternalLink` icon to make it clear it opens externally

### 3. Default values update
- Change `DEFAULTS.proof_expires_hours` from `24` to `72`

## Technical details

**`src/pages/SubmitJob.tsx`**:
- Remove the `Collapsible` wrapper around the Proof Settings card
- Replace with a simple Card containing a Switch for "Generate proof viewer" and a conditionally-shown expiry hours input
- Update `DEFAULTS.proof_expires_hours` to `72`
- `buildPayload` already maps `proof_generate` and `proof_expires_hours` correctly -- no change needed there

**`src/pages/JobDetail.tsx`**:
- Replace the `<a>` tag on line 212 with a `<Button asChild>` wrapping an `<a>` tag, using `variant="outline"` and `size="sm"` with an `ExternalLink` icon
- Import `ExternalLink` from lucide-react
