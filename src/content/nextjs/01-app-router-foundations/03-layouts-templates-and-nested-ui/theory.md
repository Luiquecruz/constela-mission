# Layouts, Templates and Nested UI

Shared navigation bars, sidebars, and footer chrome rarely change when a user moves between sibling pages such as `/dashboard`, `/dashboard/billing`, and `/dashboard/settings`. In the Next.js App Router, `layout.tsx` and `template.tsx` let you compose nested UI shells from the root directory down to individual route segments while controlling exactly whether React state is preserved or reset across navigations.

## The Root Layout (`app/layout.tsx`)

Every App Router application requires a single root layout at `app/layout.tsx`. Because Next.js does not generate an outer `index.html`, the root layout must return the `<html>` and `<body>` elements, load global fonts or stylesheets, and wrap `children`:

```tsx
// app/layout.tsx
import './globals.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

The root layout stays mounted across client-side transitions, keeping global providers, audio players, or theme state intact.

## Nested `layout.tsx` and Partial Rendering

Any route folder can add its own `layout.tsx` file. Layouts compose automatically from the root downward: navigating to `/dashboard/billing` renders `app/layout.tsx` wrapping `app/dashboard/layout.tsx`, which wraps `app/dashboard/billing/page.tsx`.

When the user navigates from `/dashboard/billing` to `/dashboard/settings`, Next.js performs **partial rendering**:

- `app/layout.tsx` and `app/dashboard/layout.tsx` **stay mounted**—their DOM nodes, scroll positions, input values, and `useState` values are preserved.
- Only the changing leaf segment (`page.tsx`) swaps out.

## `template.tsx`: Fresh Instances on Every Navigation

Sometimes preserving state across sibling routes is the **wrong** behavior. If you drop a `template.tsx` file into a folder, Next.js renders it **inside** that segment's `layout.tsx` and **outside** its `page.tsx`:

```text
app/layout.tsx
  └── app/dashboard/layout.tsx        (persists across /dashboard/*)
        └── app/dashboard/template.tsx (remounts on every navigation)
              └── app/dashboard/billing/page.tsx
```

Unlike `layout.tsx`, Next.js assigns a new key to `template.tsx` on every client-side navigation. Each route transition unmounts the previous template instance and mounts a brand-new one:

- Local `useState` inside the template resets to its initial value.
- `useEffect` hooks run again, making `template.tsx` ideal for logging page-view analytics or triggering CSS entry animations on every route change.
- Uncontrolled form inputs or per-visit feedback widgets reset automatically without manual `useEffect` cleanup tied to `pathname`.

## Common Pitfalls

- **Putting `<html>` or `<body>` in nested layouts**: Only `app/layout.tsx` (the root layout) may render `<html>` and `<body>`. Nested layouts should return semantic wrappers such as `<div>`, `<section>`, or `<main>`.
- **Expecting `layout.tsx` to re-run `useEffect` on sibling navigation**: Because layouts stay mounted between `/dashboard/billing` and `/dashboard/settings`, a `useEffect(..., [])` inside `layout.tsx` runs once when entering `/dashboard`, not on every tab switch. Use `template.tsx` (or `usePathname()`) if you need per-navigation execution.
- **Passing props directly from `layout.tsx` to `page.tsx`**: Layouts cannot pass props down to their `children` slot directly because `children` is already rendered by Next.js. Share server data via cached helper functions or share client state via React Context.

## When to choose it

- **Choose `layout.tsx`** for persistent navigation shells, sidebars, search inputs, and shared UI state that should remain uninterrupted across sibling routes without re-mounting or losing scroll position.
- **Choose `template.tsx`** when you specifically want a fresh React component instance on every navigation—such as re-triggering entry transitions, firing per-page-view `useEffect` telemetry, or resetting per-visit forms inside a persistent outer layout.
