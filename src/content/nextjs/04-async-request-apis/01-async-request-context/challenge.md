# Challenge: Resolve Async Request Context

In the Next.js App Router, page components receive `params` and `searchParams` as Promises, and request helpers like `cookies()` and `headers()` also return Promises. Before rendering a tenant dashboard, you need to await these asynchronous sources in parallel and normalize their values with safe fallbacks.

## Requirements

1. Implement `resolveTenantContext(input)`:
   - `input` has the shape:
     - `params`: `Promise<{ tenant: string }>`
     - `searchParams`: `Promise<{ view?: string; page?: string }>`
     - `cookies`: `() => Promise<{ get(name: string): { value: string } | undefined }>`
     - `headers`: `() => Promise<{ get(name: string): string | null }>`
   - Resolve `params`, `searchParams`, `cookies()`, and `headers()` concurrently.
   - Return an object `{ tenant, view, page, theme, userAgent }`:
     - `tenant`: the `tenant` string from `params`.
     - `view`: `searchParams.view` if non-empty, otherwise `'overview'`.
     - `page`: parsed integer from `searchParams.page`, clamped so that invalid, `NaN`, zero, or negative values resolve to at least `1` (`Math.max(1, Number(page) || 1)`).
     - `theme`: the value of the `'theme'` cookie if present and non-empty, otherwise `'light'`.
     - `userAgent`: the `'user-agent'` header if present and non-empty, otherwise `'unknown'`.
2. Ensure `TenantDashboardView({ context })` renders the resolved `tenant`, `view`, `page`, `theme`, and `userAgent` values so the interactive preview and component tests can verify them.
