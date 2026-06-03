
# Plan: Product-led submission flow + Configurations management

Restructure the customer submission flow to be product-led (customers don't fill in spec internals), add an org-admin Configurations management page backed by the new PrintPreflight user-preset API, and wire the four webhook events into a progressive status indicator.

## 1. Proxy + API client wiring

PrintPreflight exposes two relevant endpoints we don't proxy today:
- `GET /v1/products` — public, no auth needed
- `GET/POST/PUT/DELETE /api/dashboard/presets/custom[/...]` — requires Supabase JWT (already what `preflight-proxy` forwards)

Changes:
- `supabase/functions/preflight-proxy/index.ts`: relax path guard to also accept `/v1/...`. For `/v1/products` specifically, skip the JWT requirement so the products catalogue can be fetched before login state matters (still safe — read-only public).
- `src/lib/api.ts`: no surface changes needed (`apiGet`/`apiPost`/`apiDelete` already cover it), but add a sibling `apiPut<T>(path, body)` helper.
- `src/hooks/useApiData.ts`: add typed hooks
  - `useProducts()` → `GET /v1/products`
  - `useCustomPresets()` → `GET /api/dashboard/presets/custom/list`
  - `useCreateCustomPreset()`, `useUpdateCustomPreset(preset_id)`, `useDeleteCustomPreset(preset_id)` (mutations that invalidate `["custom-presets"]`)

## 2. Configurations management page (Task 1)

New route `/dashboard/configurations` (added to `App.tsx` + `AppSidebar.tsx` as "Configurations" with a `Settings2` icon).

- `src/pages/Configurations.tsx`: list view
  - Table of org configs from `useCustomPresets()` — columns: name, preset_id, applies-to (chips of product types), updated_at, actions (Edit / Delete).
  - "New configuration" button opens the editor dialog.
- `src/components/configurations/ConfigurationDialog.tsx`: shared create/edit dialog
  - Fields: `name`, `description`, `preset_id` (auto-slugged from name on create, read-only on edit), `for_product_types` (multi-select from `useProducts()`).
  - Spec editor section: `units`, `min_dpi`, `colour_space`, `font_check`, default bleed (l/r/t/b), default safe-zone (l/r/t/b), `dimension_tolerance_mm`, optional `page_count` block (min/max/must_be_even), severity overrides (collapsed by default), and **opt-in toggles** for `tac_max` and `min_stroke_pt` that reveal numeric inputs when enabled.
  - Build the canonical `spec` payload and POST/PUT through the new hooks. Use the standardized error toast from existing `throwIfError`.
- Delete uses an `AlertDialog` confirm and calls `useDeleteCustomPreset`.

Migration note: there are no existing app tables storing these configs (we only have `api_keys`, `jobs`, `profiles`), so nothing to migrate — the new page is the source of truth via the upstream API.

## 3. Product-led submission wizard (Task 2)

Replace `src/pages/SubmitJob.tsx` with a 4-step wizard. Break it into small components to keep the page readable:

```
src/pages/SubmitJob.tsx                 (orchestrator + step state)
src/components/submit/StepProduct.tsx
src/components/submit/StepFiles.tsx
src/components/submit/StepConfig.tsx
src/components/submit/StepReview.tsx
src/components/submit/Stepper.tsx       (visual progress header)
```

Flow state held in `SubmitJob`:
```ts
type WizardState = {
  step: 1 | 2 | 3 | 4;
  product?: Product;                      // from /v1/products
  files: Record<string, UploadedFile>;    // keyed by role
  presetId?: string;                      // chosen config
  customSpecOverrides?: Partial<Spec>;    // only when "customize" used
};
```

Step 1 — Product selection (`StepProduct`):
- Grid of `Card`s, one per product from `useProducts()`. Card shows `name`, `description`, an icon (Lucide pick by `binding`/id), keyboard + click selectable. Selecting sets `product` and auto-advances to step 2.

Step 2 — File upload(s) (`StepFiles`):
- Render one drop zone per entry in `product.files`. Slot label = `role` (humanized), inline help = `help`. Required slots marked `*`.
- Reuse current Supabase Storage upload logic (factored into a `useArtworkUpload()` hook in `src/hooks/useArtworkUpload.ts`).
- After upload, use `pdfjs-dist` (already a transitive option; otherwise add it) to read page count locally and validate against the file's `min_pages`, `max_pages`, `exact_pages`, `page_count_divisible_by`. Show inline error and block "Next" until valid.
- Each uploaded file shows a chip with its role. Allow remove/replace.

Step 3 — Configuration (`StepConfig`):
- Fetch `useCustomPresets()`, filter by `for_product_types.includes(product.id)`.
- Combine with `product.suggested_presets` (built-ins) — org configs listed first under "Your configurations", built-ins under "Suggested defaults".
- Default-select the first org config if any, else the first built-in.
- Power-user "Customize" link expands a collapsible with the same advanced spec editor used in the Configurations dialog. Overrides are stored in `customSpecOverrides` and merged at submit-time. Default UX hides all of this.

Step 4 — Review & submit (`StepReview`):
- Summary card: product name, file list (filename + role chip + page count), chosen configuration name.
- "Submit for preflight" button calls `useSubmitJob` with:
  ```ts
  {
    job_id: generatedId,
    artwork: filesArray.map(f => ({ url: f.url, filename: f.name, role: f.role })),
    proof: { generate: true, thumbnails: { count: 4 } },
    spec: {
      preset: presetId,
      product: { type: product.id },
      ...customSpecOverrides,  // only present if user customized
    },
  }
  ```
- The submit-job edge function and webhook injection stay as-is. On 200, navigate to the job detail page where the progressive status (Task 3) renders.

`SubmitJobPayload` in `useApiData.ts` is widened so `spec` can be the minimal `{ preset, product }` shape (existing full-spec shape stays valid for backwards compat / the customize path).

## 4. Progressive status indicator (Task 3)

Backend webhook (`preflight-webhook/index.ts`) currently only persists the terminal upsert (`completed_at`, `passed`, `checks`). We need to:

a. Persist intermediate events. Add a nullable `status_event` text column to `jobs` (migration) and update the webhook to:
   - Treat `event` field on the payload: `processing_started`, `checking_artwork`, `proof_ready`, `job_completed`.
   - For non-terminal events, update only `status` + `status_event` + `proof_url` (when present), skip `completed_at`.
   - For `job_completed`, keep the current full upsert.

b. Frontend: in `src/pages/JobDetail.tsx`, render a 4-step progress stepper driven by `status_event`:
   - `processing_started` → "Processing your artwork"
   - `checking_artwork`   → "Checking your artwork"
   - `proof_ready`        → "Proof ready — review now" (link to `proof_url`)
   - `job_completed`      → "Preflight complete" (show verdict badge + checks)
   Use a Realtime subscription on the `jobs` row (already public RLS-scoped to owner) so the UI updates live without polling.

## 5. Tests

Add `vitest` tests under `src/test/`:
- `configurations.test.tsx` — round-trip create→list→update→delete using mocked `apiGet`/`apiPost`/`apiPut`/`apiDelete`.
- `wizard-validation.test.tsx` — `StepFiles` rejects file with wrong page count before submit (mock page-count reader to return e.g. 7 against `page_count_divisible_by: 4`).
- `config-filter.test.tsx` — picker filters custom presets by `for_product_types` and concatenates built-ins from the selected product.

## Out of scope / assumptions

- We keep `src/pages/SubmitJob.tsx`'s current submit + storage upload plumbing; only the UX shell changes.
- We don't migrate any existing app-side presets (none persisted today).
- We don't change `api_keys` / `jobs` RLS aside from the new `status_event` column.
- "Org" = the single Supabase user account for now; the API treats each user as their own org for `custom presets`, matching today's auth model.

## File checklist

New:
- `src/pages/Configurations.tsx`
- `src/components/configurations/ConfigurationDialog.tsx`
- `src/components/submit/Stepper.tsx`
- `src/components/submit/StepProduct.tsx`
- `src/components/submit/StepFiles.tsx`
- `src/components/submit/StepConfig.tsx`
- `src/components/submit/StepReview.tsx`
- `src/hooks/useArtworkUpload.ts`
- `src/test/configurations.test.tsx`
- `src/test/wizard-validation.test.tsx`
- `src/test/config-filter.test.tsx`
- Migration: add `status_event text` to `public.jobs`

Edited:
- `src/App.tsx` (route)
- `src/components/AppSidebar.tsx` (nav item)
- `src/lib/api.ts` (`apiPut`)
- `src/hooks/useApiData.ts` (new hooks + widened `SubmitJobPayload.spec`)
- `src/pages/SubmitJob.tsx` (rewritten as wizard orchestrator)
- `src/pages/JobDetail.tsx` (progressive stepper + Realtime)
- `supabase/functions/preflight-proxy/index.ts` (allow `/v1/...`, skip JWT for `/v1/products`)
- `supabase/functions/preflight-webhook/index.ts` (handle intermediate events)
