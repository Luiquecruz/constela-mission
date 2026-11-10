# Async Request APIs: params, searchParams, cookies and headers

In the Next.js App Router, request-specific context—route parameters (`params`), URL query parameters (`searchParams`), incoming HTTP headers (`headers()`), cookies (`cookies()`), and draft mode state (`draftMode()`)—is accessed asynchronously through Promises.

```tsx
// app/[tenant]/dashboard/page.tsx
import { cookies, headers } from 'next/headers';

type DashboardPageProps = {
  params: Promise<{ tenant: string }>;
  searchParams: Promise<{ view?: string; page?: string }>;
};

export default async function DashboardPage({
  params,
  searchParams,
}: DashboardPageProps) {
  const [{ tenant }, query, cookieStore, headerStore] = await Promise.all([
    params,
    searchParams,
    cookies(),
    headers(),
  ]);

  const theme = cookieStore.get('theme')?.value ?? 'light';
  const userAgent = headerStore.get('user-agent') ?? 'unknown';
  const view = query.view ?? 'overview';

  return (
    <main data-theme={theme}>
      <h1>Tenant: {tenant}</h1>
      <p>Active view: {view} (Client: {userAgent})</p>
    </main>
  );
}
```

## Why Request APIs Are Asynchronous

Historically, frameworks exposed `params`, `searchParams`, and request headers synchronously. However, synchronous access couples component tree execution directly to an active HTTP request. If a layout or page can read a cookie synchronously at any line of code without signaling it via `await`, the rendering engine must wait for the full request context before preparing any part of the route.

By making `params`, `searchParams`, `cookies()`, `headers()`, and `draftMode()` return Promises:

1. **Static Shell Preparation**: Next.js can begin rendering static portions of a route before request-specific data is read, or pre-render the static shell at build time for Partial Prerendering (PPR).
2. **Explicit Dynamic Boundaries**: The moment a component `await`s a request API, Next.js knows that specific subtree depends on runtime request state.
3. **Parallel Resolution**: Multiple async request APIs and downstream database queries can be awaited concurrently with `Promise.all` rather than sequentially blocking each other.

## Consuming Async `params` and `searchParams` in Client Components

While Server Components can `await` Promises directly, Client Components (`'use client'`) cannot be `async` functions. To read `params` or `searchParams` passed as props to a Client Component, unwrap the Promise with React's `use()` hook:

```tsx
'use client';

import { use } from 'react';

type ClientFilterProps = {
  params: Promise<{ tenant: string }>;
  searchParams: Promise<{ view?: string }>;
};

export function ClientFilterBar({ params, searchParams }: ClientFilterProps) {
  const { tenant } = use(params);
  const { view = 'overview' } = use(searchParams);

  return (
    <nav aria-label={`${tenant} navigation`}>
      <span>Current view: {view}</span>
    </nav>
  );
}
```

Note that `cookies()` and `headers()` from `next/headers` are **Server-only** APIs. If a Client Component needs a value derived from a cookie or header, resolve it in a Server Component and pass the serialized value down as a prop.

## Common Pitfalls

- **Treating `params` or `cookies()` as synchronous objects**: Accessing `params.tenant` or `cookies().get('theme')` without `await` reads properties off a `Promise` instance, resulting in `undefined` or a TypeError at runtime.
- **Sequential waterfall awaits**: Writing `const p = await params; const sp = await searchParams; const c = await cookies();` one after another works, but using `Promise.all` expresses independent reads clearly and avoids sequential delays when combined with async I/O.
- **Mutating cookies in a Server Component**: `await cookies()` provides read access during rendering, while `.set()` and `.delete()` are only permitted inside Server Actions or Route Handlers because HTTP response headers cannot be modified after streaming has begun.
- **Unvalidated `searchParams` values**: Query parameters are user-controlled strings (or `string[]` when repeated). Always normalize and validate numbers, pagination offsets, and enum values before passing them to database queries.

## When to choose it

- **Use `await params` and `await searchParams`** in Server Components whenever your page, layout, or `generateMetadata` function needs dynamic route segments or URL query strings.
- **Use `React.use(params)` or `useParams()` / `useSearchParams()`** when a Client Component needs access to route parameters or query strings on the client.
- **Use `await cookies()` and `await headers()`** inside Server Components, Server Actions, or Route Handlers when reading session tokens, locale preferences, themes, or client metadata from the incoming HTTP request.
