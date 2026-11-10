Make sure `adr.status` is set to `'accepted'`, `adr.layer` is `'caching'`, `adr.context` has at least 80 characters and includes both `'cacheComponents'` and `'stale'`, and `adr.decision` starts with `'We will'`.
---
Provide at least two distinct `alternatives` (for example, caching everything statically with route-wide `revalidate = 3600` or disabling caching globally across all catalog routes) and include at least two `positive` and one `negative` consequence.
---
In `cachingPlan`, match each domain to its consistency contract:
- `'navigation-taxonomy'` → `strategy: 'use-cache'`, `invalidation: 'revalidateTag'`
- `'product-catalog'` → `strategy: 'use-cache'`, `invalidation: 'revalidateTag'`
- `'seller-price-edit'` → `strategy: 'use-cache'`, `invalidation: 'updateTag'`
- `'checkout-stock-hold'` → `strategy: 'dynamic-suspense'`, `invalidation: 'none'`
