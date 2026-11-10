# Parallel Routes (@slot), Active States and default.tsx

Traditional nested routing maps a single URL path to a linear hierarchy of layouts and pages. Complex dashboards, split-view workspaces, and global modals often break that one-to-one mapping: a single URL needs to render two or more independent pages inside the same layout, each with its own loading state, error boundary, and sub-navigation. Next.js solves this with **Parallel Routes**.

## Defining Named Slots with `@folder`

Parallel routes are created using named **slots** prefixed with `@`, such as `app/dashboard/@analytics/page.tsx` and `app/dashboard/@team/page.tsx`. Slots are not route segments and **do not affect the URL structure**—the URL `/dashboard/settings` can match `app/dashboard/@team/settings/page.tsx` while the URL remains `/dashboard/settings`, never `/dashboard/@team/settings`.

Every slot in a folder is automatically passed as a prop to the sibling `layout.tsx` at that same level. In Fact, the standard `page.tsx` file is simply an implicit slot named `@children`:

```tsx
// app/dashboard/layout.tsx
import type { ReactNode } from 'react';

export default function DashboardLayout({
  children,
  analytics,
  team,
  modal,
}: {
  children: ReactNode;
  analytics: ReactNode;
  team: ReactNode;
  modal: ReactNode;
}) {
  return (
    <div className="grid grid-cols-12 gap-6">
      <main className="col-span-12">{children}</main>
      <section className="col-span-6">{analytics}</section>
      <section className="col-span-6">{team}</section>
      {modal}
    </div>
  );
}
```

Because each slot is a full route branch, you can place independent `loading.tsx` and `error.tsx` files inside `@analytics` and `@team` so slow metrics never block the team roster.

## Soft Navigation vs. Hard Navigation in Slots

The most subtle behavior of Parallel Routes is how Next.js resolves a slot when the URL changes to a sub-route that exists in **only one** of the slots.

Suppose your file tree looks like this:

- `app/dashboard/layout.tsx`
- `app/dashboard/page.tsx` (`@children` matches `/dashboard`)
- `app/dashboard/settings/page.tsx` (`@children` matches `/dashboard/settings`)
- `app/dashboard/@analytics/page.tsx` (`@analytics` matches `/dashboard`, but has **no** `/settings` folder)

What happens when the user navigates from `/dashboard` to `/dashboard/settings`?

1. **Soft Navigation (Client-Side `<Link>` or `router.push`)**: Next.js keeps track of the previously active state of each slot in the client router cache. When transitioning to `/dashboard/settings`, `@children` updates to render `settings/page.tsx`. Even though `@analytics` has no `/settings` route, Next.js **retains the previously active view** of `@analytics` (`/dashboard/@analytics/page.tsx`) so the dashboard panel stays mounted without flickering.
2. **Hard Navigation (Full-Page Load or Browser Refresh)**: When the browser requests `/dashboard/settings` directly from the server, there is no prior client state to preserve. Next.js attempts to match `/dashboard/settings` across all sibling slots (`@children` and `@analytics`). Since `@analytics` has no `settings/page.tsx`, Next.js looks for `app/dashboard/@analytics/default.tsx`. If `default.tsx` is missing, Next.js cannot reconstruct the slot and immediately renders a **404 Not Found** for the entire page.

## Guarding Slots with `default.tsx`

A `default.tsx` file acts as the fallback component for a slot when Next.js cannot recover the slot's active state from the current URL during an initial or full-page load:

```tsx
// app/dashboard/@analytics/default.tsx
export default function AnalyticsDefault() {
  return (
    <aside className="rounded border p-4 text-sm text-slate-600">
      Analytics overview stays available on sub-routes.
    </aside>
  );
}
```

For overlay slots like `@modal` that should remain hidden unless a modal route is active, both `app/dashboard/@modal/page.tsx` and `app/dashboard/@modal/default.tsx` simply return `null`:

```tsx
// app/dashboard/@modal/default.tsx
export default function ModalDefault() {
  return null;
}
```

## Common Pitfalls

- **Forgetting `default.tsx` inside `@children`**: If `@team/members/page.tsx` exists at `/dashboard/members`, but `app/dashboard/members/page.tsx` does not exist in the implicit `@children` slot, a hard refresh on `/dashboard/members` will 404 unless you also provide `app/dashboard/default.tsx`.
- **Testing only with `<Link>` clicks**: Because soft navigation preserves the previous slot view in memory, missing `default.tsx` files often go unnoticed during local development until a user refreshes the browser or shares a deep link.

## When to choose it

- **Multi-panel dashboards**: Render independent `@analytics`, `@activity`, and `@billing` regions that stream and handle errors without coupling their component trees.
- **Sub-navigation within a panel**: Allow one dashboard pane to switch tabs via URL segments while sibling panes stay mounted.
- **Conditional layout branches**: Check the user's role inside `layout.tsx` and return either the `admin` slot or the `member` slot (`return role === 'admin' ? admin : member`).
- **Global or contextual modals**: Pair `@modal` with `default.tsx` returning `null` so any route can project an overlay into the parent layout.
