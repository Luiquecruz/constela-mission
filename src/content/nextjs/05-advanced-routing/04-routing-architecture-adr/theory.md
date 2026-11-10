# Checkpoint: Advanced Routing ADR

Large Next.js platforms rarely use a single uniform layout hierarchy. Marketing pages need a lightweight public header, an authenticated CloudStudio console needs a persistent sidebar, a multi-panel billing dashboard needs independent streaming and fault isolation per widget, and an asset gallery needs quick-view modals that preserve URL shareability.

In this checkpoint, you will synthesize the routing patterns from Module 5 into an **Architectural Decision Record (ADR)** for the CloudStudio platform.

## Architectural Trade-Off Matrix

| Requirement | Recommended Pattern | Why It Fits | Operational Trade-Off |
| :--- | :--- | :--- | :--- |
| Separate public marketing shell vs workspace console shell without URL prefixes | **Route Groups** (`(marketing)`, `(console)`) | Parenthesized folders partition layouts and even root `<html>`/`<body>` shells while remaining invisible in the URL pathname | Navigating across different root layouts triggers a full-page browser reload |
| Shareable asset preview overlay from `/gallery` that also renders standalone on hard reload | **Parallel + Intercepting Routes** (`@modal` + `(.)asset/[id]`) | Soft navigation renders the intercepted modal inside `@modal` over the gallery; hard refresh renders the canonical `/asset/[id]/page.tsx` | Requires a `default.tsx` returning `null` in `@modal` and matching `/asset/[id]` canonical route |
| Independent loading and error recovery for billing invoices vs real-time usage panels | **Parallel Slots** (`@invoices`, `@usage`) | Each slot receives its own `loading.tsx` and `error.tsx` boundary injected as props into the parent layout | Increases file-tree surface area compared to a single page with manual `<Suspense>` |
| Defining explicit hard-reload fallback behavior when only one parallel slot matches a deeper sub-route | **Slot `default.tsx` Fallback** | Supplies a deterministic fallback tree (or calls `notFound()` for an explicit 404) when Next.js cannot recover a slot's prior active state from memory on a full-page request | Every parallel slot must maintain an explicit `default.tsx` or `next build` fails |

## When to choose it

- **Choose Route Groups** when organizing routes by team or layout shell without changing public URLs.
- **Choose Parallel Slots (`@slot`)** when sibling dashboard regions require independent route-level `loading.tsx`, `error.tsx`, or conditional sub-navigation.
- **Choose `@modal` + Intercepting Routes** when an overlay has its own canonical resource URL that users share, bookmark, or reload directly.

