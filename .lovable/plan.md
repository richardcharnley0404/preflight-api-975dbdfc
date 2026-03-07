

## Analysis

Jobs submitted via the external API are working correctly -- they're stored with the right `user_id`, status `completed`, full check results, and proof URLs. The only missing field is `filename`, which is why they may look incomplete in Job History.

**Root cause**: The `api-jobs` edge function doesn't extract `filename` from the payload when upserting the initial job row. The `submit-job` function does this correctly via `payload.artwork?.filename`, but `api-jobs` was never updated to match.

Additionally, the `preflight-webhook` only sets `filename` if Railway sends it back in the callback -- which it doesn't appear to do.

There are also 2 older orphaned jobs (no `user_id`) from before the fix that should be backfilled.

## Plan

### 1. Update `api-jobs` to extract filename from payload on POST

In `supabase/functions/api-jobs/index.ts`, when building the upsert row after a successful Railway response, extract the filename from `payload.artwork?.filename` (matching the pattern in `submit-job`):

```typescript
if (payload.artwork?.filename) upsertRow.filename = payload.artwork.filename;
```

### 2. Backfill orphaned jobs

Run a migration to assign `user_id` to the 2 older jobs that were created before the API key mapping was in place:

```sql
UPDATE public.jobs 
SET user_id = '1c42114a-a6e9-4036-acc4-d8d8cc4aeded' 
WHERE user_id IS NULL;
```

### 3. Redeploy the `api-jobs` edge function

This ensures future API submissions capture the filename immediately.

