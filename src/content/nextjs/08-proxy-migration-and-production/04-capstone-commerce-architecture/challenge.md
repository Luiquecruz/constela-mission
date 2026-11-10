# Challenge: Full-Stack Next.js Commerce Engine

Complete the four modules of the Next.js Commerce Engine (`cache.ts`, `dal.ts`, `actions.ts`, and `App.tsx`) so that catalog caching, DTO sanitization, admin price mutations, `after()` audit logging, and the `@modal` quick-view dialog work together seamlessly.

## Requirements

1. **Tagged Cache Store (`cache.ts`)**:
   - `readCached(key, tags, compute)`:
     - On a cache miss (no entry for `key`), await `compute()`, store the value with `tags` and `stale: false`, record status `'MISS'`, and return `{ value, status: 'MISS' }`.
     - If an entry exists and `entry.stale === true`, await `compute()` to refresh the stored value (`stale: false`), record status `'STALE'`, and return `{ value: previousValue, status: 'STALE' }` (stale-while-revalidate semantics) OR refresh and return `{ value, status: 'STALE' }`.
     - If an entry exists and `entry.stale === false`, record status `'HIT'` and return `{ value: entry.value, status: 'HIT' }` without calling `compute()`.
   - `updateTag(tag)`: Immediately deletes all cache entries tagged with `tag` (so the next read is a fresh `'MISS'` with updated data).
   - `revalidateTag(tag, _profile?)`: Marks all cache entries tagged with `tag` as `stale: true` (so the next read reports `'STALE'`).
   - `getLastCacheStatus()`: Returns the most recent `'HIT' | 'MISS' | 'STALE'` status.
   - `resetCacheStore()`: Clears all cache entries and resets status to `'MISS'`.

2. **Data Access Layer (`dal.ts`)**:
   - Maintain the initial catalog records:
     - `{ id: 'p1', name: 'Quantum Keyboard', price: 180, stock: 5, supplierSecret: 'margin-42' }`
     - `{ id: 'p2', name: 'Studio Display', price: 620, stock: 2, supplierSecret: 'margin-55' }`
   - `getProductsCatalog()`: Uses `readCached('catalog', ['catalog-products'], ...)` and strips `supplierSecret` from every returned product DTO (`{ id, name, price, stock }`).
   - `updateProductPriceInDb(id, newPrice)`: Updates the matching product's price in the database store.

3. **Server Action (`actions.ts`)**:
   - `updatePriceAction({ productId, newPrice, role, after })`:
     - If `role !== 'admin'`, throw `new Error('Forbidden')`.
     - If `newPrice <= 0` or `Number.isNaN(newPrice)`, return `{ ok: false, error: 'Price must be positive' }`.
     - Call `await updateProductPriceInDb(productId, newPrice)`.
     - Call `updateTag('catalog-products')` for immediate read-your-own-writes consistency.
     - Invoke `after?.(() => ({ productId, newPrice, event: 'PRICE_UPDATED' }))` (or pass the audit payload `{ productId, newPrice, event: 'PRICE_UPDATED' }` to `after`).
     - Return `{ ok: true, products: await getProductsCatalog() }`.

4. **Storefront UI (`App.tsx`)**:
   - Render heading `"Next.js Commerce Storefront"`, a cache status badge showing the current status (`MISS`, `HIT`, or `STALE`), and the list of products with their prices (`$180`, `$620`) without ever rendering `supplierSecret`.
   - Clicking a product opens an intercepted `@modal` quick-view dialog (`role="dialog"`) displaying that product's details and a `"Close quick view"` button.
   - Render an inline admin price update form for each product (`aria-label={`New price for ${product.name}`}`, submit button `"Save price"`) that calls `updatePriceAction` with `role: 'admin'`, immediately updates the displayed price on screen, and appends the `PRICE_UPDATED` entry to the `"Audit Log"` section.
