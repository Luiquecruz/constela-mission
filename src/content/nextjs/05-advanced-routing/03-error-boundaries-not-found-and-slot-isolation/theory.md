# Granular Error Recovery: error.tsx, not-found.tsx and Slot Isolation

When a single analytics query times out or a user requests an invoice ID that does not exist, your entire application shell should not crash into a blank screen. The Next.js App Router wraps route segments and parallel `@slot` branches in nested React Error Boundaries (`error.tsx`) and Not Found boundaries (`not-found.tsx`) so failures are contained to the smallest possible UI region.

## Segment Error Boundaries with `error.tsx`

An `error.tsx` file defines a React Error Boundary around its sibling `page.tsx` and all child segments below it. Because recovery requires interactive event handlers and state transitions in the browser, **`error.tsx` must always be a Client Component (`'use client'`)**:

```tsx
// app/dashboard/@analytics/error.tsx
'use client';

export default function AnalyticsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div role="alert" className="rounded border border-red-300 p-4">
      <h2>Analytics failed to load</h2>
      <p className="text-xs text-slate-500">Digest: {error.digest ?? 'local'}</p>
      <button type="button" onClick={() => reset()}>
        Retry analytics
      </button>
    </div>
  );
}
```

- **`error.digest`**: In production builds, Next.js strips sensitive server-side error messages before serializing the error to the client and provides a hash `digest` that correlates with server logs.
- **`reset()`**: Prompts the boundary to re-render its segment contents. When combined with `router.refresh()` for Server Component failures, users can recover without losing client state in sibling slots.

## Layout Nesting Order and `global-error.tsx`

Next.js nests the generated component hierarchy for a route segment in a specific order:

```
<Layout>
  <Template>
    <ErrorBoundary fallback={<Error />}>
      <Suspense fallback={<Loading />}>
        <NotFoundBoundary fallback={<NotFound />}>
          <Page />
        </NotFoundBoundary>
      </Suspense>
    </ErrorBoundary>
  </Template>
</Layout>
```

Notice that `<Layout>` sits **outside** the `<ErrorBoundary>` at the same folder level! This is intentional so navigation menus and headers inside `layout.tsx` remain visible and interactive when `page.tsx` throws. However, it also means **`app/dashboard/error.tsx` cannot catch an error thrown inside `app/dashboard/layout.tsx`**. Errors thrown in a layout bubble up to the **parent** segment's `error.tsx`.

To catch errors in the root `app/layout.tsx`, you must create `app/global-error.tsx`. Because `global-error.tsx` replaces the root layout when active, it is required to render its own `<html>` and `<body>` tags.

## Expected Missing Resources with `notFound()` and `not-found.tsx`

Uncaught exceptions (`throw new Error(...)`) represent unexpected failures, whereas a missing database record (such as `/invoices/inv_999`) should trigger `notFound()` from `next/navigation`:

```tsx
// app/dashboard/invoices/[id]/page.tsx
import { notFound } from 'next/navigation';
import { getInvoice } from '@/lib/invoices';

export default async function InvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const invoice = await getInvoice(id);

  if (!invoice) {
    notFound();
  }

  return <article>Invoice #{invoice.number}</article>;
}
```

Calling `notFound()` halts rendering of that segment and activates the nearest `not-found.tsx` boundary, returning an HTTP 404 status for streamed or non-streamed responses without tripping `error.tsx`.

## Isolating Parallel Slots

When you combine Parallel Routes (`@analytics`, `@billing`, `@children`) with per-slot `error.tsx` and `not-found.tsx` files, each slot becomes an independent fault domain. If `@analytics/page.tsx` throws a timeout error, only `@analytics/error.tsx` renders—the user can keep filtering invoices, editing forms, or incrementing state inside `@children` without losing work.

## Common Pitfalls

- **Calling `notFound()` inside a `try / catch` block**: `notFound()` (like `redirect()`) works by throwing an internal Next.js control-flow error. Wrapping it in a generic `try / catch` that rethrows a custom `Error` accidentally routes a 404 into `error.tsx` instead of `not-found.tsx`.
- **Expecting `app/error.tsx` to catch `app/layout.tsx` errors**: Always provide `app/global-error.tsx` (with `<html>` and `<body>`) for root layout failures.

## When to choose it

- **Slot-level fault isolation**: Place `error.tsx` inside each `@slot` directory when third-party widgets or slow analytics endpoints must never take down the primary workspace.
- **Resource-specific 404 UI**: Place `not-found.tsx` inside dynamic route folders (`invoices/[id]/not-found.tsx`) to offer contextual recovery links back to `/invoices`.
- **Root crash safety net**: Add `app/global-error.tsx` to ensure even root layout failures render a branded recovery screen.
