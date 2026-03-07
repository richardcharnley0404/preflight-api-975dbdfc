

# Add API Documentation Page + OpenAPI JSON Spec

## Summary

Create an interactive API documentation page in the dashboard and serve a machine-readable OpenAPI 3.1 JSON spec at `/api-docs.json`.

## Changes

### 1. Create `public/api-docs.json` -- OpenAPI 3.1 Specification

A complete OpenAPI spec covering all Preflight API endpoints that external source applications use:

- **Authentication**: `X-API-Key` header
- **POST /v1/jobs** -- Submit a preflight job (artwork URL, spec, webhook, proof config)
- **GET /v1/jobs/{job_id}** -- Get job status and results
- **GET /v1/jobs** -- List jobs with pagination/filtering
- **Webhook callback schema** -- What gets POSTed to the customer's webhook URL
- **Response schemas** for job results, checks, proof links

Base URL placeholder: `https://api.preflight-api.com`

### 2. Create `src/pages/ApiDocs.tsx` -- Dashboard Documentation Page

A well-structured docs page with sections:

- **Quick Start** -- 3-step guide (get API key, submit job, get results)
- **Authentication** -- Show `X-API-Key` header usage with code snippet
- **Submit a Job** -- Full `POST /v1/jobs` request/response example with all spec fields explained
- **Get Job Result** -- `GET /v1/jobs/{job_id}` with response example showing checks array and proof URL
- **Webhooks** -- How to configure webhook URL/secret, example payload
- **Proof Viewer** -- How proof links work, custom `base_url` option
- **Error Codes** -- Common HTTP status codes and meanings

Use existing Card components, code blocks with copy-to-clipboard, and tabbed sections for curl/JS examples.

### 3. Update `src/App.tsx` -- Add route

Add `/dashboard/docs` route inside the dashboard layout.

### 4. Update `src/components/AppSidebar.tsx` -- Add nav item

Add "API Docs" link with `BookOpen` icon to the sidebar navigation, between "Job History" and "Billing".

