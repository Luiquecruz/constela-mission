# Server Actions, `<Form>` and Optimistic Mutations

Next.js unifies client-to-server mutations and URL-driven navigation through two complementary primitives: **Server Actions** (`'use server'`) for data mutations (POST requests that modify server state and revalidate caches) and the **`<Form>` component** from `next/form` for progressive GET navigations and mutations.

## How `'use server'` Works Under the Hood

When you mark an async function with `'use server'`, Next.js transforms that function into an addressable **HTTP POST endpoint** referenced by a cryptographic Action ID:

- **Dead-code elimination**: Unused Server Actions exported from a `'use server'` file are tree-shaken out of the server bundle and never assigned public Action IDs.
- **Closure encryption**: If you define an inline `'use server'` function inside a Server Component that closes over server variables, Next.js encrypts those bound variables with a rotating server key before sending the hidden payload to the client.
- **Public HTTP Endpoint Security**: Every exported Server Action is reachable by anyone who knows its Action ID and sends a crafted HTTP POST request. Never trust client-supplied arguments or rely solely on UI visibility—always verify authentication, authorization, and schema validation inside the Server Action body.

```tsx
// app/actions/catalog.ts
'use server';

import { revalidateTag } from 'next/cache';

export interface CreateItemState {
  ok: boolean;
  error: string | null;
}

export async function createProductAction(
  prevState: CreateItemState,
  formData: FormData
): Promise<CreateItemState> {
  const name = String(formData.get('name') ?? '').trim();
  const price = Number(formData.get('price') ?? 0);

  // Always validate untrusted inputs inside the Server Action
  if (name.length < 3) {
    return { ok: false, error: 'Product name must be at least 3 characters' };
  }
  if (!Number.isFinite(price) || price <= 0) {
    return { ok: false, error: 'Price must be greater than zero' };
  }

  await saveProductToDb({ name, price });
  revalidateTag('catalog-products', 'max');
  return { ok: true, error: null };
}
```

## `<Form>` from `next/form` vs. Standard `<form>`

The `<Form>` component in `next/form` extends the native HTML `<form>` element in two distinct modes depending on its `action` prop:

1. **String `action` (Search & Filter Navigation)**:
   When `action="/search"` is a URL string, `<Form>` prefetches the target `/search` route's shared layouts and `loading.tsx` skeleton on mount. Upon submission, instead of triggering a full-page browser reload, it serializes the form inputs into URL search parameters (`/search?q=synth&category=audio`) and performs a soft client-side navigation while preserving client state.
2. **Function `action` (Server Action Mutation)**:
   When `action={createProductAction}` is a function, `<Form>` delegates submission to React's progressive enhancement pipeline, supporting `useActionState` and `useFormStatus`.

```tsx
// components/CatalogSearchBar.tsx
import Form from 'next/form';

export function CatalogSearchBar() {
  return (
    <Form action="/search">
      <input name="q" placeholder="Search catalog..." />
      <button type="submit">Search</button>
    </Form>
  );
}
```

## Progressive Mutations with `useActionState` and `useOptimistic`

Inside Client Components, pair Server Actions with React's `useActionState` to track validation errors and `isPending` state without manual `useEffect` boilerplate, and layer `useOptimistic` when the UI should reflect a mutation immediately while the server request is in flight.

## Common Pitfalls

- **Using a Server Action for read-only search filters**: Submitting search queries through a `'use server'` POST action bypasses URL search parameters, breaks shareable URLs, and skips layout prefetching. Use `<Form action="/search">` with GET query params for filtering and searching.
- **Throwing raw errors for expected validation failures**: Throwing an unhandled `Error` inside a Server Action triggers the nearest `error.tsx` boundary and wipes out the form DOM. Return structured state (`{ ok: false, error: '...' }`) via `useActionState` for expected user input errors.
- **Calling `redirect()` inside a `try / catch` block**: Next.js implements `redirect()` by throwing an internal control-flow exception. If you wrap a Server Action body in `try / catch`, call `redirect()` **after** the `try / catch` block so you do not swallow the redirect signal.

## When to choose it

- **`<Form action="/route">` (`next/form`)**: Search bars, multi-field catalog filters, and pagination controls that should update the URL query string and navigate with prefetched layouts.
- **Server Actions (`'use server'` + `useActionState`)**: Creating, updating, or deleting database records where inputs must be validated on the server and cached data revalidated in a single network roundtrip.
- **`useOptimistic`**: High-frequency interactive mutations (toggling favorites, reordering items, appending comments) where perceived latency should be zero.
