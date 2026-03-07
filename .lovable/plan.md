

## Current State

The callback mechanism already exists in `preflight-webhook`. When Railway calls back with results, the webhook:
1. Saves the job to the database
2. Checks if the job has a `callback_url`
3. If yes, forwards the results (including `proof_url`, `checks`, `passed`, `filename`, etc.) to that URL

The `api-jobs` function correctly captures the caller's webhook URL from `payload.webhook.url` and stores it as `callback_url` in the jobs table before overwriting `payload.webhook` with the internal webhook URL.

**This flow should already be working.** The callback payload sent to the caller includes: `event`, `job_id`, `status`, `passed`, `checks`, `proof_url`, `filename`, `completed_at`.

## Potential Issue

The caller's webhook URL is stored correctly (`callerWebhookUrl`), but we should verify:
1. The caller is actually sending a `webhook.url` in their POST payload
2. The `callback_url` is being persisted (the upsert includes it)
3. The `preflight-webhook` is successfully forwarding to it

## Plan

### 1. Add logging to `preflight-webhook` callback forwarding

Add `console.log` statements before and after the callback fetch to confirm:
- Whether `callback_url` exists on the job row
- The payload being sent
- The response status from the caller

### 2. Add logging to `api-jobs` for caller webhook capture

Log the captured `callerWebhookUrl` value to confirm it's being extracted from the incoming payload.

### 3. Verify the callback payload is complete

The current callback payload in `preflight-webhook` (lines 83-92) already includes all the key fields. No structural changes needed -- just need to confirm the data flows end-to-end.

This is primarily a debugging/verification task. The architecture is correct; we just need visibility into whether the callback is firing and what data reaches the caller.

