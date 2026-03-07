

## Problem

There are two issues:

1. **No job record created for external submissions**: The `jobs` table in the database is only populated when a user submits through the dashboard UI (`SubmitJob.tsx` lines 248-257). When a job is submitted directly to the Railway API (from another source), no record is ever inserted into the database. The webhook (`preflight-webhook`) only does an `UPDATE` on the jobs table — so if the row doesn't exist, the update silently matches zero rows and the result is lost.

2. **Proof URL goes nowhere**: The webhook stores `proof_url` on the job row, but since no row exists for external submissions, the proof URL is effectively discarded.

## Solution

Move job record creation into the `preflight-webhook` edge function so that **every** completed job (whether submitted from the dashboard or externally) gets recorded. This means using an **upsert** pattern instead of a plain update.

### Changes

**1. Update `supabase/functions/preflight-webhook/index.ts`**
- Change the `.update().eq("job_id", job_id)` to an **upsert**: first try to find an existing row by `job_id`, and if none exists, insert a new one.
- For external jobs (no existing row), we need the `user_id`. The Railway API should include `user_id` (the Supabase user ID from the JWT) in the webhook payload. If it doesn't currently, we can fall back to looking it up from the API key used, or accept it as a field in the webhook body.
- Use `supabase.from("jobs").upsert(...)` matching on `job_id` so dashboard-submitted jobs get updated and externally-submitted jobs get created.

**2. Update `supabase/functions/submit-job/index.ts`**
- Include the authenticated `user_id` in the payload sent to Railway, so Railway can pass it back in the webhook callback. This ensures the webhook knows which user owns the job.

**3. Add database migration**
- Add a unique constraint on `jobs.job_id` to support upsert on that column.

### Webhook upsert logic (simplified)

```typescript
// Instead of .update().eq("job_id", job_id):
const { data, error } = await supabase
  .from("jobs")
  .upsert({
    job_id,
    user_id,        // from webhook payload
    filename,       // from webhook payload
    status,
    passed,
    proof_url,
    checks,
    completed_at: new Date().toISOString(),
  }, { onConflict: "job_id" })
  .select()
  .single();
```

### Open question

Does the Railway API currently include `user_id` and `filename` in the webhook callback payload? If not, we need to either:
- **Option A**: Update the Railway backend to echo back `user_id` and `filename` in the webhook call
- **Option B**: Have the `submit-job` edge function always create the job row *before* forwarding to Railway (move the insert from `SubmitJob.tsx` into the edge function), and only use upsert in the webhook for external API submissions that include user identification

Option B is more robust — it ensures dashboard submissions always have a job row regardless of webhook timing, and external submissions get captured via upsert.

