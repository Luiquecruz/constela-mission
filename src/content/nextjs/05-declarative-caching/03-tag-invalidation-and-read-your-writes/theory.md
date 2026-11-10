# Dynamic Invalidation: cacheTag, revalidateTag vs updateTag

Time-based expiration with `cacheLife()` works well when staleness is acceptable for a fixed window, but event-driven applications often need on-demand cache invalidation the moment a CMS publishes an article or a user submits a form. Next.js pairs `cacheTag()` inside `'use cache'` scopes with two distinct invalidation APIs: **`revalidateTag(tag, profile)`** for background stale-while-revalidate and **`updateTag(tag)`** for immediate read-your-own-writes consistency.

---

## Attaching Tags with `cacheTag()`

Inside any `'use cache'` function or component, call `cacheTag()` from `'next/cache'` to associate one or more string tags with that cache entry:

```tsx
// lib/dal/products.ts
import { cacheLife, cacheTag } from 'next/cache';

export async function getProductById(productId: string) {
  'use cache';
  cacheLife('days');
  cacheTag('products', `product-${productId}`);

  return db.product.findUnique({ where: { id: productId } });
}
```

You can attach both collection-wide tags (`'products'`) and entity-specific tags (`'product-42'`) in a single call, allowing either surgical single-item invalidation or broad catalog refreshes.

---

## `revalidateTag(tag, profile)`: Background Stale-While-Revalidate

In modern Next.js, `revalidateTag` takes **two arguments**: the target `tag` and a `cacheLife` profile (such as `'max'` or a custom profile defined in `next.config.ts`). The single-argument signature is deprecated because it obscured whether invalidation was purging synchronously or serving stale content.

```ts
// app/api/webhooks/cms/route.ts
import { revalidateTag } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const payload = await request.json();

  // Marks matching entries as stale; next visitor gets cached copy immediately
  // while Next.js refreshes the entry in the background.
  revalidateTag(`article-${payload.slug}`, 'max');

  return NextResponse.json({ revalidated: true });
}
```

Passing `'max'` as the second argument is the recommended default: it tells Next.js to keep serving the existing cached payload to incoming readers while regenerating the fresh value asynchronously in the background. Visitors never experience a cold-cache latency spike after a webhook fires.

---

## `updateTag(tag)`: Immediate Read-Your-Own-Writes in Server Actions

Background revalidation is ideal for background webhooks, but it creates a jarring user experience when an author edits their own profile or a seller updates a product price in a form: if the redirect or re-render after the mutation serves the stale cached value while refreshing in the background, the user thinks their save failed.

For mutations inside **Server Actions**, Next.js provides `updateTag(tag)`:

```ts
// app/actions/update-price.ts
'use server';

import { updateTag } from 'next/cache';
import { db } from '@/lib/db';

export async function updateProductPrice(productId: string, cents: number) {
  await db.product.update({
    where: { id: productId },
    data: { priceCents: cents },
  });

  // Immediately expires 'product-{id}' so the very next read awaits fresh data
  updateTag(`product-${productId}`);
}
```

### Comparing `revalidateTag`, `updateTag`, and `refresh`

| API | Allowed Context | Cache Behavior | Primary Use Case |
|---|---|---|---|
| `revalidateTag(tag, profile)` | Server Actions & Route Handlers | Marks tagged entries stale; serves stale while refreshing in background | CMS webhooks, background syncs, high-traffic shared catalogs |
| `updateTag(tag)` | Server Actions **only** | Immediately expires tagged entries; next read blocks for fresh data | Read-your-own-writes after user form submissions |
| `refresh()` | Server Actions **only** | Re-renders uncached dynamic data on the current page without touching tagged caches | Refreshing live notification badges or uncached session state |

---

## Common Pitfalls

- **Calling `revalidateTag(tag)` without a second `profile` argument**: Omitting the second argument triggers deprecation warnings and ambiguous expiration semantics. Always supply `'max'` or a named `cacheLife` profile.
- **Using `revalidateTag` when the acting user expects to see their edit immediately**: Because `revalidateTag(tag, 'max')` serves the stale entry once while refreshing in the background, the mutating user will see their old data right after submitting. Use `updateTag(tag)` instead.
- **Calling `updateTag(tag)` inside a `route.ts` webhook**: `updateTag` is designed exclusively for Server Actions that coordinate with the caller's immediate UI transition. Webhooks and Route Handlers should use `revalidateTag(tag, 'max')`.

---

## When to choose it

- Choose **`revalidateTag(tag, 'max')`** when invalidating shared caches from webhooks, cron jobs, or administrative actions where keeping response latency near zero matters more than instantaneous global blocking.
- Choose **`updateTag(tag)`** inside Server Actions whenever the user performing the mutation immediately views the affected resource and must see their own write reflected on screen.
