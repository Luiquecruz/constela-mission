# Data Access Layer (DAL) and Per-Request Memoization

In a React Server Components architecture, many components in the same render tree—such as `<TopNav />`, `<SidebarPermissions />`, and `<OrdersTable />`—independently need the current authenticated user or tenant records. Passing user objects down through five layers of Server Component props couples layout structure to data requirements. Conversely, calling `await cookies()` and querying the database directly inside UI components scatters authentication checks and risks leaking internal database columns.

A **Data Access Layer (DAL)** solves both problems by centralizing session verification, authorization checks, Data Transfer Object (DTO) shaping, and **per-request memoization** (`React.cache`) in dedicated server-only modules.

## Building a Server-Only Data Access Layer

Every DAL module starts with `import 'server-only'` so the bundler fails the build immediately if a Client Component ever imports it. Inside the DAL, functions wrapped in `React.cache()` memoize their return values for the lifetime of a **single server request render pass**:

```tsx
// lib/dal/orders.ts
import 'server-only';
import { cache } from 'react';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';

export const getCurrentUser = cache(async () => {
  const cookieStore = await cookies();
  const token = cookieStore.get('session_token')?.value;
  if (!token) throw new Error('Unauthorized');

  const user = await db.users.findByToken(token);
  if (!user) throw new Error('Unauthorized');

  // Return a safe DTO, never raw database rows
  return { id: user.id, tenantId: user.tenantId, role: user.role };
});

export const getOrdersByTenant = cache(async (tenantId: string) => {
  const user = await getCurrentUser();
  if (user.tenantId !== tenantId) {
    throw new Error('Forbidden: tenant mismatch');
  }

  const rawOrders = await db.orders.findMany({ where: { tenantId } });

  // Strip sensitive fields like supplierCost or internalNotes
  return rawOrders.map((order) => ({
    id: order.id,
    total: order.total,
    status: order.status,
  }));
});
```

## Why Per-Request Memoization (`React.cache`) Matters

While Next.js automatically deduplicates identical `GET` requests made with `fetch()`, direct database queries via an ORM (Prisma, Drizzle) or SQL client are **not** deduplicated by `fetch`. Wrapping DAL functions in `React.cache(fn)` guarantees that:

1. **Zero Redundant Queries**: If `generateMetadata`, `Layout`, and `Page` all call `await getCurrentUser()`, the session cookie and database lookup execute **once** during that HTTP request.
2. **Strict Request Isolation**: Unlike a module-level `new Map()` in Node.js (which persists across all users handled by the server process!), `React.cache` scopes its cache to the active server render pass and discards it when the request finishes.
3. **Co-located Authorization**: Every data query calls `await getCurrentUser()` first. Because `getCurrentUser()` is memoized per request, verifying permissions inside every DAL function has zero extra database cost.

## Common Pitfalls

- **Using a global module `Map` for user data**: Storing `const userCache = new Map()` at module scope caches data across different HTTP requests in long-lived Node.js or Edge processes, leaking one user's data to another visitor.
- **Returning raw ORM models from DAL functions**: Even if a Server Component does not render `order.supplierCost`, passing the full object to a Client Component (`<OrderCard order={order} />`) serializes every property into the client RSC payload visible in the browser network tab.
- **Relying solely on Middleware/Proxy for authorization**: Checking a cookie in `middleware.ts` is useful for fast redirects, but your Data Access Layer must still verify session validity and tenant ownership right before querying data.
- **Passing non-primitive arguments to `React.cache`**: `React.cache` uses `Object.is` reference equality for arguments. Passing inline objects like `getOrders({ tenantId: 'acme' })` creates a new object reference on every call and misses the cache; prefer primitive arguments (`getOrdersByTenant('acme')`) or deterministic key serialization.

## When to choose it

- **Use a Data Access Layer with `React.cache`** whenever your Server Components query databases, internal microservices, or SDKs that require authentication or tenant isolation.
- **Return explicit DTOs from every DAL function** whenever data might be passed down as props or rendered in views, ensuring sensitive fields (`passwordHash`, `supplierCost`, `internalNotes`) never leave the DAL boundary.
- **Avoid global in-memory caches for user-scoped queries**; reserve cross-request caching (`use cache` or external Redis/CDN caches) strictly for data that is either public or explicitly keyed by verified tenant/user identifiers.
