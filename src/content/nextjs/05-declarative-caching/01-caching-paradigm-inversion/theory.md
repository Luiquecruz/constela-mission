# The Uncached-by-Default Model and cacheComponents

Early revisions of the App Router defaulted to aggressive, implicit caching: `fetch()` calls cached responses indefinitely unless configured with `{ cache: 'no-store' }`, `GET` Route Handlers were pre-rendered as static files unless they read request headers, and the client-side Router Cache held onto visited route segments for 30 seconds. While fast on synthetic benchmarks, implicit caching caused subtle production bugs where users saw stale data after mutations or developers spent hours hunting down which layer was holding onto an outdated payload.

Modern Next.js inverts this model completely. **All I/O is dynamic and uncached by default**, and caching is an explicit, compiler-enforced opt-in powered by `cacheComponents`.

---

## What Changed in the Default Caching Behavior

Three foundational defaults shifted from implicit caching to fresh execution:

| Layer | Legacy App Router Default | Modern App Router Default |
|---|---|---|
| `fetch()` requests | `cache: 'force-cache'` (cached indefinitely) | Uncached per request unless inside `'use cache'` or explicitly configured |
| `GET` Route Handlers (`route.ts`) | Static at build time unless dynamic APIs were read | Dynamic on every request unless opted into `'use cache'` |
| Client Router Cache (`staleTime`) | 30s for dynamic pages, 5m for static pages | `staleTime: 0` for dynamic page navigations (always re-fetches server data) |

Because dynamic pages have `staleTime: 0` in the client Router Cache, navigating between routes via `<Link>` always reflects live server state unless a segment or data loader explicitly opts into caching. Note that shared layouts remain preserved across sibling navigations to avoid redundant layout re-rendering, and `<Link>` prefetching still caches prefetched payloads briefly to keep transitions responsive.

---

## Enabling `cacheComponents` in `next.config.ts`

To unify static rendering, Partial Prerendering (PPR), and function-level caching under a single model, enable `cacheComponents` in `next.config.ts` (known in earlier experimental phases as `dynamicIO`):

```ts
// next.config.ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  cacheComponents: true,
};

export default nextConfig;
```

Enabling `cacheComponents: true` activates a strict build-time and development-time invariant: **every asynchronous operation during rendering must declare whether it belongs to the cached shell or the dynamic stream.**

---

## The Compiler Rule: `'use cache'` or `<Suspense>`

When `cacheComponents: true` is active, Next.js prerenders every route into an instant static HTML shell while streaming dynamic holes in parallel. If an async Server Component performs I/O—such as querying a database, calling `fetch()`, or reading `cookies()`—without telling the framework how to handle the boundary, Next.js throws an uncaught dynamic data error during development and build.

You resolve this boundary by choosing one of two explicit contracts:

```tsx
// app/dashboard/page.tsx
import { Suspense } from 'react';
import { getCatalogMetrics, getLiveAccountBalance } from '@/lib/data';

// Contract 1: Opt into caching with 'use cache' (included in the prerendered shell)
async function CatalogMetricsBanner() {
  'use cache';
  const metrics = await getCatalogMetrics();
  return (
    <section aria-label="Catalog summary">
      <p>Active SKUs: {metrics.totalSkus}</p>
    </section>
  );
}

// Contract 2: Keep dynamic I/O uncached, wrapped in <Suspense> by the parent
async function AccountBalanceCard({ accountId }: { accountId: string }) {
  const balance = await getLiveAccountBalance(accountId);
  return <div className="card">Available Balance: {balance.formatted}</div>;
}

export default function DashboardPage() {
  return (
    <main>
      {/* Part of the instant static shell */}
      <CatalogMetricsBanner />

      {/* Streamed dynamically per request */}
      <Suspense fallback={<div className="skeleton">Loading live balance...</div>}>
        <AccountBalanceCard accountId="acct_99" />
      </Suspense>
    </main>
  );
}
```

### Legacy Segment Exports Are Superseded

Route segment config flags like `export const dynamic = 'force-static'`, `export const dynamic = 'force-dynamic'`, and `export const revalidate = 60` were blunt instruments that forced an entire route subtree into a single mode. Under `cacheComponents`, caching happens at the **component or function boundary** via `'use cache'` and `cacheLife()`, allowing static and dynamic components to coexist seamlessly inside the same route.

---

## Common Pitfalls

- **Awaiting uncached I/O at the top of `page.tsx` without `<Suspense>`**: With `cacheComponents: true`, awaiting a database query directly inside `Page` without either `'use cache'` or a parent `<Suspense>` boundary fails the build because Next.js refuses to silently block the entire route's prerendered shell.
- **Stacking `fetch(..., { next: { revalidate } })` inside `'use cache'`**: Mixing legacy `fetch` cache options with `'use cache'` creates conflicting lifetime rules. Prefer standard `fetch()` or direct ORM calls inside `'use cache'` functions and govern lifetimes with `cacheLife()`.
- **Reading `cookies()` or `headers()` directly inside a `'use cache'` scope**: Request-specific APIs cannot run inside a shared cache boundary. Read cookies or headers outside in a dynamic component and pass only the required serializable arguments into the cached function.

---

## When to choose it

- Enable **`cacheComponents: true`** on all modern App Router projects to gain deterministic prerendering and compiler-verified boundaries between cached and live data.
- Wrap components in **`<Suspense>`** when data must be fresh on every single request, depends on user-specific session cookies, or represents real-time inventory and financial state.
- Apply **`'use cache'`** when data is shared across requests or tolerates bounded staleness, allowing Next.js to bake the result into the prerendered shell or reuse it across requests.
