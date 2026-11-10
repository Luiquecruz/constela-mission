# Challenge: Tenant Data Access Layer and Per-Request Memoization

In this challenge, you will implement a per-request memoization helper (`createRequestMemo`) and use it to build an isolated Data Access Layer (`createTenantDal`) that enforces authentication, checks tenant authorization, deduplicates queries within a single request scope, and strips sensitive internal fields into safe DTOs.

## Requirements

1. Implement `createRequestMemo(fn)`:
   - Returns a wrapper function with the same signature as `fn`.
   - Caches the returned result (including in-flight Promises) keyed by `JSON.stringify(args)` for the lifetime of that memoized function instance.
   - If the underlying call rejects/throws, or if it resolves, repeated calls with identical arguments within the same instance must reuse the cached Promise so the underlying `fn` is only invoked once per unique argument list.

2. Implement `createTenantDal({ db, getSession })`:
   - Each call to `createTenantDal(...)` represents an isolated **per-request** DAL scope (so two separate `createTenantDal` instances never share cached user or order state).
   - `getCurrentUser()`:
     - Memoized per DAL instance using `createRequestMemo`.
     - Calls `await getSession()`.
     - If the session is `null` or `undefined`, throws `new Error('Unauthorized')`.
     - Otherwise returns `{ userId: session.userId, tenantId: session.tenantId, role: session.role }`.
   - `getOrdersByTenant(tenantId: string)`:
     - Memoized per `tenantId` within the DAL instance using `createRequestMemo`.
     - Calls `await getCurrentUser()` first to authenticate.
     - If `user.tenantId !== tenantId`, throws `new Error('Forbidden: tenant mismatch')`.
     - Calls `await db.findOrders(tenantId)` and maps each raw order to a safe DTO `{ id, total, status }`, stripping sensitive fields (`internalNotes` and `supplierCost`).
