# Checkpoint: Declarative Caching ADR

Designing a caching architecture in modern Next.js requires mapping each business domain's consistency, latency, and invalidation triggers to the right combination of `'use cache'`, `<Suspense>`, `cacheLife()`, `revalidateTag()`, and `updateTag()`. Rather than applying a blanket revalidation interval across an entire storefront, an Architecture Decision Record (ADR) documents which data domains belong to the shared cache, how they expire, and which domains must remain strictly dynamic per request.

---

## Classifying Data Domains Across Four Axes

Before adding `'use cache'` to a function or Server Component, evaluate the domain against four architectural questions:

1. **Scope (Shared vs. Request-Specific)**: Can the result be safely shared across multiple visitors, or does it depend on session cookies, per-user permissions, or a live transactional lock?
2. **Staleness Tolerance**: If an upstream database record changes, can readers tolerate seeing the previous value briefly while a background refresh completes, or must the very next read reflect the write?
3. **Mutation Origin (Webhook/Cron vs. User Server Action)**: Is invalidation triggered externally by a CMS or supplier webhook (`revalidateTag(tag, profile)`), or interactively by a user submitting a form who expects read-your-own-writes consistency (`updateTag(tag)`)?
4. **Fallback Latency Budget**: What should the user see while uncached dynamic data resolves inside `<Suspense>`?

```ts
// next.config.ts — Defining domain-aligned cacheLife profiles
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  cacheComponents: true,
  cacheLife: {
    taxonomy: {
      stale: 300,
      revalidate: 86400,   // 1 day background refresh
      expire: 604800,      // 7 days max idle lifetime
    },
    catalog: {
      stale: 120,
      revalidate: 900,     // 15 minutes background refresh
      expire: 86400,       // 24 hours max idle lifetime
    },
  },
};

export default nextConfig;
```

---

## Mapping Marketplace Domains to Primitives

Consider a multi-vendor marketplace like **MercadoPulse** with four distinct data domains:

| Domain | Update Pattern | Strategy | Invalidation Primitive |
|---|---|---|---|
| `navigation-taxonomy` | Weekly CMS webhook, shared globally | `'use cache'` + `cacheLife('taxonomy')` | `revalidateTag('taxonomy', 'max')` |
| `product-catalog` | Hourly supplier webhook, shared globally | `'use cache'` + `cacheLife('catalog')` | `revalidateTag('catalog', 'max')` |
| `seller-price-edit` | Cached product detail mutated by seller in a Server Action | `'use cache'` + `cacheTag('product-{id}')` | `updateTag('product-{id}')` |
| `checkout-stock-hold` | Live per-user inventory reservation lock on every checkout load | `<Suspense>` (`dynamic-suspense`) | `none` (never cached) |

```tsx
// lib/dal/marketplace.ts
import { cacheLife, cacheTag } from 'next/cache';

export async function getCategoryTaxonomy() {
  'use cache';
  cacheLife('taxonomy');
  cacheTag('taxonomy');
  return db.taxonomy.findMany();
}

export async function getSellerProductListing(productId: string) {
  'use cache';
  cacheLife('catalog');
  cacheTag('catalog', `product-${productId}`);
  return db.products.findUnique({ where: { id: productId } });
}
```

When a seller updates a price inside a Server Action, calling `updateTag(\`product-\${productId}\`)` expires that specific product's cache entry immediately so the seller sees their updated price on the next render, while external supplier sync webhooks call `revalidateTag('catalog', 'max')` so shoppers never wait on cold cache rebuilds. Meanwhile, `checkout-stock-hold` omits `'use cache'` entirely and streams inside `<Suspense>`, ensuring two concurrent buyers never read a cached inventory lock.

---

## Common Pitfalls

- **Caching transactional or lock-sensitive state**: Applying `'use cache'` to checkout stock holds or payment intents risks double-selling inventory or leaking another buyer's reservation state.
- **Using `revalidateTag` for interactive seller edits**: If a seller updates their listing price and the Server Action calls `revalidateTag` instead of `updateTag`, the post-save render serves the old cached price once while refreshing in the background.
- **Forgetting to document trade-offs**: Every caching strategy carries operational trade-offs (e.g., tag cardinality management, brief staleness windows during background SWR) that belong in the `consequences.negative` section of your ADR.

---

## When to choose it

- Draft a **Declarative Caching ADR** whenever migrating a project to `cacheComponents: true` or designing a multi-domain storefront where static shells, SWR catalogs, read-your-own-writes mutations, and live transactional streams coexist.
