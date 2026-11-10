# Author the MercadoPulse Declarative Caching ADR

**MercadoPulse** is a multi-vendor marketplace migrating to `cacheComponents: true`. Your team needs an Architecture Decision Record (`adr`) and a structured domain caching plan (`cachingPlan`) covering four core data domains:

1. **`'navigation-taxonomy'`**: Category tree shared by all visitors; updated weekly when editors publish changes via a CMS webhook.
2. **`'product-catalog'`**: Public product listings shared by all visitors; updated hourly via a supplier sync webhook and tolerant to brief staleness.
3. **`'seller-price-edit'`**: Product pricing cached for fast storefront reads, but when a seller submits a price change in a Server Action, the seller must see their updated price immediately on screen.
4. **`'checkout-stock-hold'`**: Per-user live inventory lock verified on every checkout request; must never be served from a shared cache.

## Requirements

1. **`adr`**: Export an object matching `CachingADR`:
   - `id`: Non-empty string (e.g. `'ADR-003'`).
   - `title`: Descriptive title (>= 15 characters).
   - `status`: `'accepted'`.
   - `layer`: `'caching'`.
   - `context`: At least 80 characters explaining the problem, mentioning both `cacheComponents` and `stale`.
   - `decision`: At least 40 characters starting with `'We will'`.
   - `alternatives`: At least 2 distinct rejected options `{ option, reason }` with non-empty reasons.
   - `consequences`: `{ positive: string[], negative: string[] }` with at least 2 items in `positive` and at least 1 item in `negative`.

2. **`cachingPlan`**: Export an array of 4 `DomainCachingRule` items covering `'navigation-taxonomy'`, `'product-catalog'`, `'seller-price-edit'`, and `'checkout-stock-hold'`:
   - `'navigation-taxonomy'` and `'product-catalog'` must use `strategy: 'use-cache'` and `invalidation: 'revalidateTag'`.
   - `'seller-price-edit'` must use `strategy: 'use-cache'` and `invalidation: 'updateTag'`.
   - `'checkout-stock-hold'` must use `strategy: 'dynamic-suspense'` and `invalidation: 'none'`.
   - Every rule must include a `reason` of at least 25 characters.
