# Partial Prerendering (PPR) and Pushing Dynamic Reads Down

Traditionally, web frameworks forced an all-or-nothing choice per route: either prerender the entire page at build time (Static Rendering) or render the entire page on demand for every visitor (Dynamic Rendering). If a product page needed to read `cookies()` solely to display a personalized shopping cart count in the header, the entire route had to wait for request time.

Partial Prerendering (PPR) eliminates this binary trade-off by combining a **prerendered static shell** with **dynamic streaming holes** in a single HTTP response.

## How Partial Prerendering Works

During the build (or revalidation), Next.js prerenders as much of the route tree as possible. Whenever a component awaits a dynamic request API (`cookies()`, `headers()`, `searchParams`, or uncached data) inside a React `<Suspense>` boundary, Next.js captures the `<Suspense fallback={...}>` HTML into the static shell.

When a user requests the URL:

1. **Instant Static Shell**: The CDN or server immediately flushes the prerendered static HTML shell—including navigation, layout, static product descriptions, and Suspense fallback skeletons.
2. **Parallel Dynamic Streaming**: In the same HTTP response stream, the server executes the dynamic components inside `<Suspense>` boundaries using the incoming request's cookies and headers, streaming the resolved HTML chunks to replace the fallbacks.

```tsx
// app/products/[id]/page.tsx
import { Suspense } from 'react';
import { cookies } from 'next/headers';

// Good: The page itself does NOT await cookies() at the root level.
export default function ProductPage() {
  return (
    <main>
      <StaticProductHero />
      <Suspense fallback={<div data-fallback="cart">Loading cart...</div>}>
        <PersonalizedCartBanner />
      </Suspense>
      <StaticSpecificationsTable />
    </main>
  );
}

// Dynamic reads are pushed down into a child component wrapped in <Suspense>
async function PersonalizedCartBanner() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('session_id')?.value;
  return <div>Session cart for {sessionId ?? 'guest'}</div>;
}
```

## Pushing Dynamic Reads Down the Tree

The golden rule of Partial Prerendering is to **push `await cookies()`, `await headers()`, and `await searchParams` as deep into the component tree as possible**, always beneath a `<Suspense>` boundary.

Consider what happens if you await `cookies()` at the top of `app/layout.tsx` or `app/page.tsx` before returning any JSX:

```tsx
// Anti-pattern: Awaiting cookies() at the top of the layout blocks the static shell!
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies(); // <--- Blocks everything below it!
  const theme = cookieStore.get('theme')?.value ?? 'light';
  return (
    <html lang="en" data-theme={theme}>
      <body>{children}</body>
    </html>
  );
}
```

Because `RootLayout` awaits `cookies()` before returning `<html>`, there is no `<Suspense>` boundary above the dynamic read. Next.js cannot prerender a static shell above `await cookies()`, so the entire route falls back to request-time dynamic rendering.

## Common Pitfalls

- **Awaiting request APIs in `RootLayout` or above `<Suspense>`**: Calling `await headers()` or `await cookies()` in a parent component and passing the resolved string down to a child inside `<Suspense>` still blocks the parent! Pass the component down and perform the `await` inside the child component wrapped by `<Suspense>`.
- **Missing `<Suspense>` around a dynamic child**: Even if you extract an async `<UserMenu />` component that awaits `cookies()`, rendering `<UserMenu />` without a surrounding `<Suspense>` boundary forces the nearest parent boundary (or the whole page) to wait for the dynamic read.
- **Overly coarse `<Suspense>` boundaries**: Wrapping the entire `<main>` tag in a single `<Suspense>` boundary means the static shell only contains the header and footer, losing the benefit of prerendering static page sections.

## When to choose it

- **Use Partial Prerendering and `<Suspense>` holes** on pages that mix shared static content (marketing copy, product details, documentation chrome, shells) with per-user dynamic islands (cart badges, personalized recommendations, session banners).
- **Use full Static Rendering** when no component in the route reads request-time APIs (`cookies()`, `headers()`, `searchParams`) or uncached dynamic data.
- **Use full Dynamic Rendering** only when the outer document shell itself strictly depends on per-request headers or cookies that cannot be deferred into a `<Suspense>` boundary.
