# The 'use cache' Directive, Cache Keys and cacheLife Profiles

In modern Next.js with `cacheComponents: true`, the `'use cache'` directive is the single primitive for caching Server Components, data-fetching functions, and computations. Unlike the legacy `fetch` wrapper, `'use cache'` caches the return value of any asynchronous function—whether it queries PostgreSQL via Prisma, reads from the filesystem, transforms a large JSON payload, or renders a JSX subtree.

---

## Three Granularities of `'use cache'`

You can place `'use cache'` at three levels depending on your architecture:

```tsx
// 1. File level: every exported async function/component in this file is cached
'use cache';

export async function getGlobalNavigation() {
  return db.navigation.findMany();
}
```

```tsx
// 2. Component level: caches the rendered RSC payload for a specific UI boundary
export async function PricingTable({ currency }: { currency: string }) {
  'use cache';
  const tiers = await fetchPricingTiers(currency);
  return <TierGrid tiers={tiers} />;
}

// 3. Function level: caches raw data inside a Data Access Layer
export async function getProductBySlug(slug: string) {
  'use cache';
  return db.product.findUnique({ where: { slug } });
}
```

---

## How Automatic Cache Keys Work

Next.js constructs a deterministic cache key for every `'use cache'` boundary without manual key arrays. The compiler combines four inputs:

1. **Build ID**: Ensures cache entries from previous deployments do not collide with new code changes.
2. **Function ID**: A compiler-generated hash uniquely identifying the file location and function signature.
3. **Serializable Arguments**: Every argument passed to the cached function or component is serialized via the React Flight protocol and hashed into the key.
4. **Captured Closure Variables**: If an inner `'use cache'` function closes over variables from an outer scope (such as a `tenantId` read in a parent component), the compiler automatically extracts and serializes those closed-over values into the cache key.

### Pass-Through `children` Are Excluded from the Key

A powerful property of `'use cache'` on components is how it handles non-serializable React elements like `children` or render slots. So long as the cached component **passes `children` through to its returned JSX without inspecting or reading it**, Next.js treats `children` as an opaque reference excluded from the cache key hash. This allows a cached layout shell to wrap dynamic, uncached `<Suspense>` children without invalidating the outer cache on every request.

---

## Controlling Lifetimes with `cacheLife` Profiles

Every `'use cache'` scope is governed by a three-window lifetime profile called `cacheLife`:

- **`stale` (seconds)**: How long the **client-side Router Cache** may serve the segment without asking the server.
- **`revalidate` (seconds)**: After this server age is reached, incoming requests still receive the cached value immediately (`STALE`) while Next.js triggers a background revalidation to refresh the entry.
- **`expire` (seconds)**: Maximum age a cached entry can sit idle without traffic before it is evicted; a subsequent request must wait synchronously for a fresh computation (`MISS`).

Next.js provides built-in profiles (`'seconds'`, `'minutes'`, `'hours'`, `'days'`, `'weeks'`, `'max'`), and you can define domain-specific named profiles in `next.config.ts`:

```ts
// next.config.ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  cacheComponents: true,
  cacheLife: {
    catalog: {
      stale: 300,       // 5 minutes in client router cache
      revalidate: 1800, // 30 minutes before background SWR refresh
      expire: 86400,    // 24 hours hard expiration
    },
  },
};

export default nextConfig;
```

Inside a `'use cache'` scope, call `cacheLife()` from `'next/cache'` using either a named profile or an inline object:

```tsx
import { cacheLife } from 'next/cache';

export async function getFeaturedCatalog(category: string) {
  'use cache';
  cacheLife('catalog');
  return db.products.findFeatured({ category });
}
```

### Nested Cache Scope Propagation

When a `'use cache'` component calls another function or component that also declares `cacheLife()`, the outer cache entry automatically adopts the **most restrictive (shortest)** `stale`, `revalidate`, and `expire` durations among its nested calls unless isolated in its own independent cache entry.

---

## Common Pitfalls

- **Capturing non-serializable objects in closures**: If an inner `'use cache'` function references a database connection instance or a class with methods from an outer scope, serialization fails. Only close over serializable values (strings, numbers, plain objects).
- **Setting `expire` shorter than `revalidate`**: `expire` must always be greater than or equal to `revalidate`; otherwise, the entry expires before background stale-while-revalidate can ever occur.

---

## When to choose it

- Use **`'use cache'` + `cacheLife('hours' | 'days')`** for shared marketing pages, navigation menus, and catalog listings where predictable time-based freshness is ideal.
- Define **custom `cacheLife` profiles in `next.config.ts`** so product engineers reference semantic policies (`'catalog'`, `'editorial'`, `'fx-rates'`) rather than scattering raw second counts across files.
