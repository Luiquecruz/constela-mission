# Linking, Navigation Hooks and Redirects

Fast web applications navigate between routes without throwing away the entire browser document, while still keeping URLs shareable, bookmarkable, and accessible. The Next.js App Router provides `<Link>`, client navigation hooks from `next/navigation`, and server-side redirect helpers to coordinate transitions across both server and client.

## `<Link href="...">` and Viewport Prefetching

Use `<Link>` from `next/link` for declarative navigation instead of plain `<a>` tags:

- **Soft Client Transitions**: Clicking a `<Link>` fetches only the changing route segments (preserving shared `layout.tsx` state) rather than triggering a full-page reload.
- **Automatic Viewport Prefetching**: In production, when a `<Link>` enters the browser viewport, Next.js prefetches the destination's route payload in the background so clicks feel instantaneous.
- **`replace` and `scroll={false}`**: Pass `replace` when updating filters without stacking history entries, or `scroll={false}` for tabbed interfaces that should stay at the user's current scroll offset.

## `usePathname()` for Active Navigation State

Because Server Components do not re-run purely to highlight active navbar items inside persistent layouts, read the current path inside a small `'use client'` navigation leaf with `usePathname()`:

```tsx
'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function NavItem({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link href={href} aria-current={isActive ? 'page' : undefined}>
      {label}
    </Link>
  );
}
```

Setting `aria-current="page"` gives assistive technologies and styles a reliable, standard signal for the current route.

## `useSearchParams()` and `useRouter()`

For filterable catalogs, tabs, and sorting controls, store state in the URL query string instead of ephemeral `useState` so links remain shareable:

- **`useSearchParams()`** returns a read-only `URLSearchParams` instance for the active URL.
- **Never clobber unrelated parameters**: Clone the existing query via `new URLSearchParams(searchParams.toString())`, call `.set(key, value)` or `.delete(key)`, and navigate with `router.replace(`${pathname}?${nextParams.toString()}`)`.
- **`useRouter()`** (imported from `next/navigation`, never `next/router`) exposes `push(href)`, `replace(href)`, `back()`, `forward()`, and `refresh()` for programmatic navigation after imperative events.

## Server-Side `redirect()` vs. `permanentRedirect()`

When a Server Component or Server Action determines that the user should go elsewhere—such as guarding an authenticated route—call `redirect()` or `permanentRedirect()` from `next/navigation`:

- **`redirect('/login?next=/dashboard')`**: Emits a temporary redirect (`307` during rendering, `303` from Server Actions). Ideal for auth guards, post-mutation flows, and dynamic workflow steps.
- **`permanentRedirect('/docs/app-router')`**: Emits a `308` permanent redirect so search engines and browsers cache the canonical destination when a URL has permanently moved.

Both functions work by **throwing a special Next.js control-flow error**. Always invoke them **outside** `try/catch` blocks (or rethrow inside `catch`) so the framework can intercept them and issue the redirect response.

## Common Pitfalls

- **Overwriting existing query parameters**: Calling `router.push('/docs?category=routing')` wipes out `?sort=popular` or `?page=2`. Always clone `useSearchParams()` with `URLSearchParams` before updating a single key.
- **Calling `redirect()` inside a `try/catch` block**: Because `redirect()` throws internally to abort rendering, a broad `catch (err)` block will swallow the redirect and render an error state instead.
- **Using `<Link>` instead of `useRouter()` everywhere—or vice versa**: Prefer `<Link>` for static or predictable navigation targets so browsers expose native link semantics (middle-click, open in new tab) and prefetching; reserve `useRouter()` for programmatic post-action navigation.

## When to choose it

- **Choose `<Link>`** for all standard user-initiated navigation links, menus, cards, and breadcrumbs to gain viewport prefetching and accessible link behavior.
- **Choose `usePathname()`** inside Client Component navigation bars to compute active styling and `aria-current="page"`.
- **Choose `useSearchParams()` + `useRouter().replace()`** for interactive search, filtering, pagination, and sorting controls that belong in a shareable URL without polluting browser history.
- **Choose `redirect()` / `permanentRedirect()`** on the server when access control, missing session checks, or moved slugs must prevent the target page from rendering at all.
