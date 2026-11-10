# Loading UI, Error Recovery and Not Found

Real applications wait on databases, encounter network hiccups, and receive requests for records that no longer exist. Rather than crashing the entire browser tab or blocking navigation on slow queries, the Next.js App Router turns special segment files into nested React boundaries that keep outer layouts responsive.

## `loading.tsx`: Automatic `<Suspense>` Streaming

When you add `loading.tsx` inside a route folder, Next.js automatically wraps `page.tsx` and nested child segments inside a React `<Suspense fallback={<Loading />}>` boundary:

- Navigating to that route displays `loading.tsx` **immediately** while async Server Components fetch data on the server.
- Sibling navigation stays interruptible: a user can click a different link before the slow page finishes streaming.
- Surrounding `layout.tsx` chrome stays interactive and rendered without waiting for the inner segment.

## `error.tsx`: Client-Side Error Boundaries and `reset()`

Adding `error.tsx` wraps the segment inside a React Error Boundary. Because React Error Boundaries rely on client component lifecycles and recovery handlers, **`error.tsx` must begin with `'use client'`**:

```tsx
'use client';

export default function CourseError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div role="alert">
      <h2>Something went wrong</h2>
      <p>{error.message}</p>
      <button type="button" onClick={() => reset()}>
        Try again
      </button>
    </div>
  );
}
```

When an unexpected error throws during rendering inside that segment, `error.tsx` isolates the failure so the root layout and sidebar keep working. Calling `reset()` attempts to re-render the segment without reloading the browser page. Note that a segment's `error.tsx` does **not** catch errors thrown inside the same folder's `layout.tsx` (because `layout.tsx` sits outside `error.tsx`); root layout crashes require `app/global-error.tsx`.

## `not-found.tsx` and Programmatic `notFound()`

An unknown slug such as `/courses/deleted-course` is an **expected** 404 outcome, not an unhandled crash. Inside a Server Component, query the data source and call `notFound()` from `next/navigation` when the record is `null`:

```tsx
import { notFound } from 'next/navigation';
import { getCourseBySlug } from '@/lib/courses';

export default async function CoursePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const course = await getCourseBySlug(slug);

  if (!course) {
    notFound();
  }

  return <article>{course.title}</article>;
}
```

Calling `notFound()` aborts rendering and renders the nearest `not-found.tsx` file (returning an HTTP `404` status). Unlike `error.tsx`, `not-found.tsx` can remain a Server Component by default.

## The App Router Boundary Nesting Order

Within a single route segment, Next.js composes all special files in a strict hierarchy:

```text
<Layout>              (app/courses/layout.tsx)
  <Template>          (app/courses/template.tsx)
    <ErrorBoundary>   (app/courses/error.tsx)
      <Suspense>      (app/courses/loading.tsx)
        <NotFound>    (app/courses/not-found.tsx)
          <Page />    (app/courses/page.tsx)
```

Understanding this nesting explains every runtime rule: `layout.tsx` and `template.tsx` stay mounted during loading, error, and 404 states; `error.tsx` catches failures thrown inside `loading.tsx` or `page.tsx`; and `not-found.tsx` sits inside `Suspense` for expected missing resources.

## Common Pitfalls

- **Forgetting `'use client'` in `error.tsx`**: Leaving off `'use client'` causes a compile error because Error Boundaries cannot be pure Server Components.
- **Placing `error.tsx` in the same folder as a failing `layout.tsx`**: Because `layout.tsx` wraps `error.tsx`, an error inside `app/dashboard/layout.tsx` bubbles up to `app/error.tsx` (or `app/global-error.tsx` for the root layout).
- **Throwing `new Error('Not found')` instead of calling `notFound()`**: Generic errors trigger `error.tsx` (HTTP 500 semantics) instead of `not-found.tsx` (HTTP 404 semantics).

## When to choose it

- **Choose `loading.tsx`** whenever a route segment performs async data fetching and you want instant navigation feedback with a skeleton UI instead of blocking the transition.
- **Choose `error.tsx`** to contain unexpected runtime exceptions per segment and give users a `reset()` recovery action without losing the rest of the application shell.
- **Choose `notFound()` + `not-found.tsx`** whenever a dynamic lookup returns no matching record or the user lacks permission to view a resource that should appear as a 404.
