

# Fix API Keys page to match Railway backend

The frontend types and table columns need to align with the actual API response shape.

## Changes

### 1. Update types in `src/hooks/useApiData.ts`

**`ApiKey` interface** (for GET /api/keys list):
```text
{
  id: string
  name: string
  prefix: string       // was "key" -- backend only returns prefix after creation
  created_at: string   // was "created"
  last_used_at?: string // was "last_used" (may be null)
  active: boolean
}
```

**`CreateKeyResponse` interface** (for POST /api/keys):
```text
{
  id: string
  name: string
  key: string          // full key, shown only once
  prefix: string       // new field
  created_at: string   // was "created"
}
```

### 2. Update `src/pages/ApiKeys.tsx`

- Table columns: show `k.prefix` instead of `k.key` (masked display)
- Show `k.created_at` and `k.last_used_at` instead of `k.created` / `k.last_used`
- Format dates nicely (they come as ISO strings now)
- After creating a key, show `result.key` (full key) in the dialog -- this part already works correctly

