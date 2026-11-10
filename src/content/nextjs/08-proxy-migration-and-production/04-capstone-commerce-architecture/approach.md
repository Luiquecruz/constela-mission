# Step-by-Step Approach

1. **Implement the Tagged Cache Store (`cache.ts`)**:
   - Store cache entries in a `Map<string, { value: unknown; tags: string[]; stale: boolean }>`.
   - In `readCached(key, tags, compute)`, return `{ value: existing.value, status: 'HIT' }` when a non-stale entry exists. When `existing?.stale` is true, recompute the fresh value, update the entry with `stale: false`, and return `{ value: freshValue, status: 'STALE' }`. On a miss, compute and store the value and return `{ value: freshValue, status: 'MISS' }`.
   - In `updateTag(tag)`, delete any entry whose `tags` array includes `tag`.
   - In `revalidateTag(tag)`, set `entry.stale = true` for any entry whose `tags` array includes `tag`.

2. **Sanitize Product DTOs in `dal.ts`**:
   - Inside `getProductsCatalog()`, call `readCached('catalog', ['catalog-products'], async () => dbProducts.map(({ id, name, price, stock }) => ({ id, name, price, stock })))` and return `result.value`.

3. **Enforce RBAC, `updateTag`, and `after()` in `actions.ts`**:
   - Validate `role === 'admin'` and `newPrice > 0`.
   - Update the database via `updateProductPriceInDb(productId, newPrice)`, call `updateTag('catalog-products')`, trigger `after` with `{ productId, newPrice, event: 'PRICE_UPDATED' }`, and return `{ ok: true, products: await getProductsCatalog() }`.

4. **Connect Quick-View `@modal` and Admin Form in `App.tsx`**:
   - Track `selectedProduct` for the `role="dialog"` quick-view modal and close it when `"Close quick view"` is clicked.
   - Handle form submission for `"New price for Quantum Keyboard"` by calling `updatePriceAction`, updating `products` state with the returned list, and pushing the audit event into `"Audit Log"`.
