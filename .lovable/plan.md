

# Make the OpenAPI Spec Discoverable by AI

## Problem

When an AI fetches `/docs`, it gets rendered HTML. There's no machine-readable signal pointing to the JSON spec. An AI wouldn't know `/api-docs.json` exists unless it parses the button text.

## Solution

Two changes to make the JSON spec automatically discoverable:

### 1. Add a visible "For AI / Machine-Readable" banner at the top of `ApiDocs.tsx`

Add a prominent callout box near the top of the docs page with text like:

> **Machine-readable API spec available:** `https://preflight-api.lovable.app/api-docs.json` (OpenAPI 3.1)

This is visible to both humans and AI tools that fetch the page as markdown/text.

### 2. Add a `<link>` tag in `index.html` for spec discovery

```html
<link rel="describedby" type="application/openapi+json" href="/api-docs.json" />
```

This is the standard way to advertise an OpenAPI spec. AI tools and crawlers that check `<link>` tags will find it automatically on any page of the site.

### Files changed

- **`index.html`** -- add the `<link rel="describedby">` tag in `<head>`
- **`src/pages/ApiDocs.tsx`** -- add a callout/banner near the top with the direct JSON URL and a brief note that it's machine-readable

