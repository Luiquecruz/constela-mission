In `createRequestMemo(fn)`, create a local `const cache = new Map<string, ReturnType<T>>()` inside `createRequestMemo` so each memoized function has its own isolated cache.
---
Compute `const key = JSON.stringify(args);` inside the wrapper function. If `cache.has(key)`, return `cache.get(key)!`; otherwise call `const result = fn(...args)`, store it in `cache.set(key, result)`, and return `result`.
---
Inside `createTenantDal({ db, getSession })`, wrap `getCurrentUser` and `getOrdersByTenant` with `createRequestMemo`. In `getOrdersByTenant`, verify `user.tenantId === tenantId` before calling `db.findOrders(tenantId)` and map each row to `{ id: o.id, total: o.total, status: o.status }`.
