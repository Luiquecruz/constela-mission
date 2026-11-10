# Intercepting Routes ((.), (..)) and URL-Driven Modals

When a user clicks a photo card in a social feed or an item in an e-commerce grid, opening a modal overlay preserves scroll position and context while immediately updating the browser URL to `/photo/42`. However, if that user copies `/photo/42` and sends it to a colleague—or refreshes the page—the application should render a complete, standalone photo detail page rather than a floating modal over an empty background. Next.js enables this dual behavior by combining **Parallel Routes (`@modal`)** with **Intercepting Routes**.

## Route Segment Matching Conventions

Intercepting routes use parenthesized dot prefixes inside folder names to intercept a navigation from the current layout before it reaches the canonical route:

- `(.)` matches a route segment at the **same route level**.
- `(..)` matches a route segment **one route level above**.
- `(..)(..)` matches a route segment **two route levels above**.
- `(...)` matches a route segment from the **root `app` directory**.

Crucially, these conventions count **URL route segments**, **not** filesystem directories. Because Parallel Route slots (`@modal`) and Route Groups (`(marketing)`) do not create URL segments, they are ignored when counting levels.

For example, consider a feed at `/feed` that intercepts `/photo/[id]`:

- `app/feed/layout.tsx` (renders `{children}` and `{modal}`)
- `app/feed/page.tsx` (the `/feed` grid)
- `app/feed/@modal/default.tsx` (returns `null` when no modal is open)
- `app/feed/@modal/(..)photo/[id]/page.tsx` (intercepts `/photo/[id]` from `/feed`)
- `app/photo/[id]/page.tsx` (canonical standalone page for `/photo/[id]`)

Notice why `@modal/(..)photo/[id]` uses `(..)` instead of `(..)(..)`: `@modal` is a slot, so its URL level is still `/feed` (one segment deep). Stepping up one route segment from `/feed` lands at the root `/`, where `photo/[id]` lives. If the layout lived at the root `app/layout.tsx` with `app/@modal/(.)photo/[id]/page.tsx` and `app/photo/[id]/page.tsx`, you would use `(.)` because `@modal` does not add a folder level to the URL.

## Soft Navigation vs. Hard Reload Lifecycle

```tsx
// app/@modal/(.)photo/[id]/page.tsx
import { Modal } from '@/components/modal';
import { getPhoto } from '@/lib/photos';

export default async function InterceptedPhotoModal({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const photo = await getPhoto(id);

  return (
    <Modal title={photo.title}>
      <img src={photo.url} alt={photo.title} />
    </Modal>
  );
}
```

1. **Soft Navigation (`<Link href="/photo/1">`)**: When clicked from `/feed`, Next.js matches the intercepted route inside `@modal`. Because `@children` has no `/photo/1` route, soft navigation retains the mounted `/feed` grid in `@children` while rendering the `<Modal>` inside `@modal`.
2. **Hard Navigation (Direct Visit or Browser Refresh on `/photo/1`)**: Route interception only triggers during client-side transitions. On a full-page request to `/photo/1`, Next.js bypasses `(.)photo/[id]`, matches the canonical `app/photo/[id]/page.tsx` in `@children`, and renders `@modal/default.tsx` (`null`).
3. **Closing the Modal Safely**: Inside the client `<Modal>` wrapper, calling `router.back()` pops the `/photo/1` history entry and unmounts the modal while keeping `/feed` intact. If a component ever needs a defensive fallback when there is no prior history entry, it can fall back to `router.push('/feed')`.

## Common Pitfalls

- **Counting `@modal` as a directory level**: Using `(..)` instead of `(.)` inside `app/@modal/(.)photo/[id]` fails to match `app/photo/[id]` because `@modal` is invisible to URL segment resolution.
- **Closing modals with `<Link href="/feed">` instead of `router.back()`**: Pushing a new `/feed` entry onto the history stack means clicking the browser's Back button re-opens the modal unexpectedly, and in some nested slot setups `@modal` will remain active unless a catch-all `@modal/[...catchAll]/page.tsx` returning `null` or `router.back()` is used.

## When to choose it

- **Media lightboxes and asset previews**: Open high-resolution photos, videos, or design assets in an overlay from a gallery while giving each asset a shareable canonical URL.
- **Contextual creation or login drawers**: Present `/login` or `/new-issue` as a dialog when triggered in-app, while still supporting direct links to `/login` as a full page.
- **Quick-look e-commerce carts or product sheets**: Let shoppers inspect product details without losing their filtered scroll position in the catalog.
