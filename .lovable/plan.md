

# Implement Preflight Proxy Edge Function

## What We're Building

A `preflight-proxy` edge function that sits between the Lovable dashboard and the Railway API. All dashboard API calls (stats, API keys, billing) route through this proxy instead of hitting Railway directly. This hides the Railway URL from the browser.

## Changes

### 1. Create `supabase/functions/preflight-proxy/index.ts`

A generic proxy that:
- Handles CORS preflight
- Reads the target path from `?path=` query parameter (e.g. `?path=/api/dashboard/stats`)
- Validates path starts with `/api/` to prevent open-proxy abuse
- Authenticates user via JWT using `getClaims()`
- Forwards the request (method, body, Authorization header) to Railway at `https://preflight-api-production.up.railway.app`
- Returns Railway's response (status + body) to the frontend

### 2. Update `supabase/config.toml`

Add the new function entry:
```toml
[functions.preflight-proxy]
verify_jwt = false
```

### 3. Update `src/lib/api.ts`

- Remove the hardcoded Railway URL
- Point all requests to the proxy edge function via `VITE_SUPABASE_URL`
- Each helper (`apiGet`, `apiPost`, `apiDelete`, `apiUpload`) constructs the URL as:
  `${VITE_SUPABASE_URL}/functions/v1/preflight-proxy?path=/api/...`
- Same function signatures -- no changes needed in any other files

### 4. No changes to existing edge functions

`submit-job` and `preflight-webhook` already work correctly and stay as-is.

## Request Flow

```text
Browser (preflight-api.com)
  → preflight-proxy edge function
    → validates JWT
    → forwards to Railway (https://preflight-api-production.up.railway.app + path)
    → returns response to browser
```

Source applications (external customers) continue to call Railway directly at `api.preflight-api.com` using their API key -- this proxy is only for the dashboard.

