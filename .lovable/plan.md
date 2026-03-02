

# PrintPreflight — Customer Dashboard

A clean, professional SaaS dashboard for the PrintPreflight PDF preflight API service. Design inspired by the reference screenshot — light theme, card-based KPIs, subtle colors, and data-rich charts.

---

## 1. Landing Page
- Hero section explaining PrintPreflight's value prop (automated PDF preflight checks via API)
- Feature highlights (speed, accuracy, API-first)
- **Pricing section** with three plan cards:
  - **Free** — 50 jobs/month, 1 API key
  - **Pro** — 500 jobs/month, 5 API keys
  - **Enterprise** — Unlimited jobs, unlimited keys, priority support
- Call-to-action buttons leading to sign up

## 2. Authentication (Supabase)
- Sign up & login pages with email/password
- Extended user profiles table (company name, billing address)
- Password reset flow with dedicated reset page
- Protected routes for all dashboard pages

## 3. Dashboard Home
- Top KPI cards showing: jobs this month, plan limit, pass rate, average processing time
- Usage progress bar (jobs used vs. plan limit)
- Recent jobs list (last 10)
- Line chart showing daily job volume over the current month

## 4. API Keys Page
- List of active API keys (name, created date, last used, masked key value)
- "Create New Key" button — generates key, shows it once in a modal
- Revoke key action with confirmation dialog
- Key count limit based on plan tier

## 5. Job History Page
- Searchable, filterable table of all preflight jobs
- Columns: Job ID, filename, submitted date, status (processing/complete/failed), result (pass/fail), duration
- Filters by status and date range
- Pagination
- Click a row to open job detail

## 6. Job Detail Page
- Job metadata (filename, submitted by, date, processing time)
- Overall pass/fail status with badge
- Preflight check breakdown — list of individual checks (fonts, color space, resolution, bleed, etc.) each with pass/fail and details
- Option to download the original report/PDF

## 7. Billing Page
- Current plan display with usage summary
- Plan comparison cards for upgrading (integrated with Stripe)
- Upgrade/downgrade actions via Stripe Checkout
- Billing history / invoices list

## 8. Sidebar Navigation
- Collapsible sidebar matching the reference screenshot style
- Links: Dashboard, API Keys, Job History, Billing, Documentation (external link)
- User avatar and account dropdown in the sidebar

## Technical Approach
- **Backend**: Supabase for auth + profiles + plan tracking; Stripe for payments; Railway API (`preflight-api-production.up.railway.app`) for job data and API key management
- **Frontend**: React + TypeScript + Tailwind + shadcn/ui + Recharts for charts
- All API calls to the Railway backend will pass the Supabase JWT token in the Authorization header

