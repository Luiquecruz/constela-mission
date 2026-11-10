# Capstone: Full-Stack Next.js Commerce Engine

Across this track, you have explored how modern Next.js unifies routing, Server and Client Component boundaries, `'use cache'` and tag invalidation, Server Actions, post-response `after()` hooks, and defense-in-depth security. In this capstone, we bring every piece together into a cohesive **Full-Stack Commerce Engine**.

## Architectural Blueprint

A production commerce storefront balances four competing forces:

1. **Instant Perceived Navigation**: Shoppers browsing the catalog expect sub-second responses served from a tagged cache (`'use cache'` + `cacheTag('catalog-products')`), while clicking a product card opens an intercepted `@modal` quick-view overlay without losing scroll position.
2. **Strict Data Access Layer (DAL) Serialization**: Database rows frequently contain sensitive fields such as `supplierSecret`, wholesale margins, or internal notes. The DAL queries the database, caches the public catalog, and maps every record to a clean Data Transfer Object (DTO) before anything crosses into UI rendering or Client Components.
3. **Read-Your-Own-Writes Admin Mutations**: When a store administrator updates a product's price via a Server Action, they must see the updated price immediately. Calling `updateTag('catalog-products')` expires the tagged cache entry synchronously within the action, whereas `revalidateTag('catalog-products', 'max')` serves stale data while revalidating in the background.
4. **Non-Blocking Post-Response Auditing (`after()`)**: Compliance and analytics logs (`PRICE_UPDATED`) should never slow down the user-facing mutation response. Scheduling side effects inside `after()` lets the Server Action return the updated catalog immediately while the audit record is persisted right after the response finishes.

```tsx
// app/actions/catalog.ts
'use server'

import { updateTag } from 'next/cache'
import { after } from 'next/server'
import { getProductsCatalog, updateProductPriceInDb } from '@/lib/dal'

export async function updatePriceAction(input: {
  productId: string
  newPrice: number
  role: 'admin' | 'customer'
}) {
  if (input.role !== 'admin') {
    throw new Error('Forbidden')
  }
  if (input.newPrice <= 0) {
    return { ok: false, error: 'Price must be positive' }
  }

  await updateProductPriceInDb(input.productId, input.newPrice)

  // Immediate read-your-own-writes cache invalidation
  updateTag('catalog-products')

  after(() => {
    console.info({
      event: 'PRICE_UPDATED',
      productId: input.productId,
      newPrice: input.newPrice,
    })
  })

  const products = await getProductsCatalog()
  return { ok: true, products }
}
```

## How the Layers Cooperate

| Layer | Responsibility | Key Next.js Primitive |
| --- | --- | --- |
| **Network Proxy (`proxy.ts`)** | Correlation IDs, subdomain rewrites, optimistic redirects | `export function proxy(req)` |
| **Catalog DAL (`dal.ts`)** | Tagged caching + stripping private `supplierSecret` fields | `'use cache'`, `cacheTag('catalog-products')` |
| **Quick-View Modal (`@modal`)** | Parallel + intercepting route dialog (`role="dialog"`) | `@modal/(.)products/[id]/page.tsx` |
| **Admin Mutation (`actions.ts`)** | Role check, DB write, immediate tag expiration, audit trail | `'use server'`, `updateTag()`, `after()` |

## Common Production Pitfalls

- **Leaking Raw ORM Models**: Returning raw database entities from `getProductsCatalog()` leaks internal fields (`supplierSecret`) into serialized RSC payloads whenever those objects are passed to Client Components.
- **Using `revalidateTag` Instead of `updateTag` for Admin Edits**: If an admin submits a price change and your Server Action calls `revalidateTag('catalog-products', 'max')`, the immediate re-render can still read the stale price while background revalidation runs. Use `updateTag('catalog-products')` when the caller expects immediate consistency.
- **Skipping Role Verification in Server Actions**: Hiding an admin form in the UI does not protect the compiled Server Action endpoint. Always validate `role === 'admin'` inside the action itself.

## When to choose it

- **Combine `'use cache'` in your DAL with DTO sanitization** for every shared catalog, feed, or dashboard query.
- **Pair `updateTag` with `after()` inside Server Actions** whenever an authenticated mutation must reflect changes immediately in the UI while offloading audit logging or webhooks out of the critical response path.
- **Use `@modal` intercepting routes** for detail previews (product quick-views, photo lightboxes, cart drawers) that benefit from shareable URLs and instant modal dismissal.
