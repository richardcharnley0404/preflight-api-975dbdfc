

# Create `jobs` table and `preflight-webhook` Edge Function

## 1. Database Migration: Create `jobs` table

Create a `jobs` table with the columns you specified:

```text
jobs
  id              UUID (PK, default gen_random_uuid())
  user_id         UUID (references auth.users, not null)
  job_id          TEXT (unique, the external Railway job ID)
  filename        TEXT
  status          TEXT (default 'pending')
  passed          BOOLEAN
  proof_url       TEXT
  checks          JSONB
  submitted_at    TIMESTAMPTZ (default now())
  completed_at    TIMESTAMPTZ
```

RLS policies:
- Users can SELECT their own jobs (`user_id = auth.uid()`)
- Users can INSERT their own jobs (`user_id = auth.uid()`)

No user-facing UPDATE/DELETE policies needed -- updates come from the webhook via service role.

## 2. Create Edge Function: `supabase/functions/preflight-webhook/index.ts`

The function will:
1. Handle CORS (OPTIONS returns 200)
2. Reject non-POST requests with 405
3. Verify `X-Webhook-Secret` header against `PREFLIGHT_WEBHOOK_SECRET` secret -- return 401 on mismatch
4. Parse JSON body: `{ job_id, status, passed, proof_url, proof_expires_at, summary, checks }`
5. Use a Supabase **service role** client to update the matching job by `job_id` with: `status`, `passed`, `proof_url`, `checks`, and `completed_at = now()`
6. Return 404 if no job matches
7. Return 200 on success

## 3. Update `supabase/config.toml`

Add JWT bypass so Railway can call the webhook without a Supabase token:

```text
[functions.preflight-webhook]
verify_jwt = false
```

## 4. Request `PREFLIGHT_WEBHOOK_SECRET`

Use the secrets tool to ask you to set the shared secret that Railway will send in the `X-Webhook-Secret` header.

## Technical details

- The edge function uses `Deno.env.get('SUPABASE_URL')` and `Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')` (both already available) to create a service-role client that bypasses RLS for the update.
- The `job_id` column is marked `UNIQUE` so lookups are fast and we can use `.eq('job_id', ...)` confidently.
- No changes to frontend code in this step -- the webhook is a backend-only receiver.

