# Parallel Routes (@slot), Active States and default.tsx

Traditional nested routing maps a single URL path to a linear hierarchy of layouts and pages. Complex dashboards, split-view workspaces, and global modals often break that one-to-one mapping: a single URL needs to render two or more independent pages inside the same layout, each with its own loading state, error boundary, and sub-navigation. Next.js solves this with **Parallel Routes**.

## Defining Named Slots with `@folder`

Parallel routes are created using named **slots** prefixed with `@`, such as `app/dashboard/@analytics/page.tsx` and `app/dashboard/@team/page.tsx`. Slots are not route segments and **do not affect the URL structure**—the URL `/dashboard/settings` can match `app/dashboard/@team/settings/page.tsx` while the URL remains `/dashboard/settings`, never `/dashboard/@team/settings`.

Every slot in a folder is automatically passed as a prop to the sibling `layout.tsx` at that same level. In fact, the standard `page.tsx` file is simply an implicit slot named `@children`:

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

## Soft Navigation vs. Hard Navigation and Build-Time Verification

The most subtle behavior of Parallel Routes is how Next.js resolves a slot when the URL changes to a sub-route that exists in **only one** of the slots.

Suppose your file tree looks like this:

- `app/dashboard/layout.tsx`
- `app/dashboard/page.tsx` (`@children` matches `/dashboard`)
- `app/dashboard/settings/page.tsx` (`@children` matches `/dashboard/settings`)
- `app/dashboard/@analytics/page.tsx` (`@analytics` matches `/dashboard`, but has **no** `/settings` folder)

What happens across build time, soft navigation, and hard navigation when navigating from `/dashboard` to `/dashboard/settings`?

1. **Build-Time Enforcement (`default.tsx` Required)**: Next.js requires all parallel route slots to provide an explicit `default.tsx` file when they do not match every sibling route. If a named slot omits `default.tsx`, `next build` fails with a **build error** rather than silently deploying an incomplete slot tree.
2. **Soft Navigation (Client-Side `<Link>` or `router.push`)**: Next.js keeps track of the previously active state of each slot in the client router cache. When transitioning to `/dashboard/settings`, `@children` updates to render `settings/page.tsx`. Even though `@analytics` has no `/settings` route, Next.js **retains the previously active view** of `@analytics` (`/dashboard/@analytics/page.tsx`) so the dashboard panel stays mounted without flickering.
3. **Hard Navigation (Full-Page Load or Browser Refresh)**: When the browser requests `/dashboard/settings` directly from the server, there is no prior client state to preserve. Next.js matches `/dashboard/settings` in `@children` and falls back to `app/dashboard/@analytics/default.tsx` for `@analytics`. If that `default.tsx` calls `notFound()` from `next/navigation`, Next.js produces a runtime **404 Not Found** response.

## Guarding Slots with `default.tsx`

A `default.tsx` file defines the explicit fallback contract for a slot when Next.js cannot recover the slot's active state from the current URL during an initial or full-page load:

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

For overlay slots like `@modal` that should remain hidden unless a modal route is active, `app/dashboard/@modal/default.tsx` simply returns `null`:

```tsx
// app/dashboard/@modal/default.tsx
export default function ModalDefault() {
  return null;
}
```

When a sub-route should strictly 404 on hard reloads if a slot has no matching segment, call `notFound()` inside `default.tsx`:

```tsx
// app/dashboard/@analytics/default.tsx
import { notFound } from 'next/navigation';

export default function AnalyticsDefault() {
  notFound();
}
```

## Common Pitfalls

- **Forgetting `default.tsx` inside `@children`**: If `@team/members/page.tsx` exists at `/dashboard/members`, but `app/dashboard/members/page.tsx` does not exist in the implicit `@children` slot, you must provide `app/dashboard/default.tsx` so the build succeeds and hard reloads on `/dashboard/members` can resolve `@children`.
- **Testing only with `<Link>` clicks in `next dev`**: Because soft navigation preserves the previous slot view in memory, engineers sometimes overlook how `default.tsx` behaves on a hard refresh or direct deep link until running `next build` or reloading the browser.

## When to choose it

- **Multi-panel dashboards**: Render independent `@analytics`, `@activity`, and `@billing` regions that stream and handle errors without coupling their component trees.
- **Sub-navigation within a panel**: Allow one dashboard pane to switch tabs via URL segments while sibling panes stay mounted.
- **Conditional layout branches**: Check the user's role inside `layout.tsx` and return either the `admin` slot or the `member` slot (`return role === 'admin' ? admin : member`).
- **Global or contextual modals**: Pair `@modal` with `default.tsx` returning `null` so any route can project an overlay into the parent layout.
