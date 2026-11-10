In `dal.ts`, make sure `getProductsCatalog()` maps each raw product to `{ id, name, price, stock }` inside `readCached('catalog', ['catalog-products'], async () => ...)` so `supplierSecret` is never included in the returned array.
---
In `actions.ts`, check `if (role !== 'admin') throw new Error('Forbidden')` first, then check `if (newPrice <= 0) return { ok: false, error: 'Price must be positive' }`. After updating the database, call `updateTag('catalog-products')` before calling `await getProductsCatalog()` so the caller immediately reads the updated price.
---
In `App.tsx`, wire the `after` callback passed to `updatePriceAction` so that when `after` receives either a callback function or an audit entry object `{ productId, newPrice, event: 'PRICE_UPDATED' }`, it appends `{ productId, newPrice, event: 'PRICE_UPDATED' }` into your `auditLogs` state array and renders it under `"Audit Log"`.
