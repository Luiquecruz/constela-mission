# Checkpoint: Hybrid Rendering ADR

Every real-world migration from a client-heavy Single-Page Application (SPA) to the Next.js App Router requires explicit architectural boundaries. Without a documented **Architecture Decision Record (ADR)**, engineering teams often fall into one of two extremes: slapping `'use client'` at the top of every route (shipping hundreds of kilobytes of unnecessary JavaScript and risking secret leakage), or trying to force browser state into Server Components.

## Designing the PulseCommerce Hybrid Rendering Architecture

Consider **PulseCommerce**, a high-traffic B2B/B2C storefront whose legacy SPA product page ships `340 KB` of compressed JavaScript and suffers from slow Time to First Byte (TTFB) on mobile networks. When migrating PulseCommerce to the Next.js App Router, each component must be assigned to the right execution boundary based on **bundle cost**, **data confidentiality**, **interactivity**, and **URL navigation semantics**:

| Component | Characteristics | Architectural Boundary |
| --- | --- | --- |
| `ProductMarkdownSpecification` | Parses technical markdown with a `180 KB` syntax-highlighting dependency; zero browser state. | **Server Component** (`'server-component'`) — keeps the `180 KB` parser at `0 KB` in the client bundle. |
| `SupplierWholesaleMarginCalculator` | Reads confidential supplier wholesale contracts to compute public retail price tiers; zero browser state. | **Server Component** (`'server-component'`) — guards wholesale contracts with `server-only` and passes only public retail tiers across the boundary. |
| `InteractiveSizeAndColorPicker` | Tracks selected SKU variant with `useState` and dispatches custom DOM events to the cart drawer. | **Client Component** (`'client-component'`) — isolated leaf marked with `'use client'`. |
| `CatalogFilterSearchForm` | Submits search query strings (`/search?q=...`) with shared layout prefetching and soft URL navigation. | **Next.js `<Form>`** (`'next-form'`) — uses `<Form action="/search">` from `next/form` for progressive GET navigation. |

```tsx
// app/products/[slug]/page.tsx — Hybrid Rendering Composition
import Form from 'next/form';
import { ProductMarkdownSpecification } from './ProductMarkdownSpecification';
import { SupplierWholesaleMarginCalculator } from './SupplierWholesaleMarginCalculator';
import { InteractiveSizeAndColorPicker } from './InteractiveSizeAndColorPicker';

export default async function PulseCommerceProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return (
    <div className="space-y-8">
      {/* 1. Progressive URL search navigation */}
      <Form action="/search" className="flex gap-2">
        <input name="q" placeholder="Search PulseCommerce..." />
        <button type="submit">Search</button>
      </Form>

      {/* 2. Confidential server calculation + interactive client leaf */}
      <SupplierWholesaleMarginCalculator slug={slug} />
      <InteractiveSizeAndColorPicker slug={slug} />

      {/* 3. Heavy 180 KB markdown library stays 100% on the server */}
      <ProductMarkdownSpecification slug={slug} />
    </div>
  );
}
```

## Writing a Defensible Hybrid Rendering ADR

A strong ADR for hybrid rendering documents four things clearly:

1. **Context**: Why the current architecture fails (e.g., oversized client JavaScript bundle, unguarded DTO serialization, sequential client waterfalls) and what constraints the system must satisfy.
2. **Decision**: A clear action statement starting with `"We will..."` that establishes Server Components as the default, pushes `'use client'` to interactive leaf components, uses `next/form` for URL-driven GET search forms, and enforces DTO sanitization.
3. **Alternatives Considered**: At least two rejected options (such as keeping the entire route as a `'use client'` SPA shell, or using `'use server'` POST Server Actions for read-only search filtering) along with specific technical reasons for rejecting each.
4. **Consequences**: Concrete positive outcomes (smaller client bundle, confidential wholesale data kept off the wire, shareable search URLs) and honest negative trade-offs (serialization constraints across `'use client'`, strict separation between server and client module graphs).

## Common Pitfalls

- **Marking parent containers `'use client'` for convenience**: If a parent component declares `'use client'`, every child it imports directly is pulled into the client bundle—including `180 KB` markdown parsers.
- **Using Server Actions for search queries**: A `'use server'` POST action cannot be bookmarked or prefetched like a URL query string. Always choose `<Form action="/search">` (`next/form`) for GET search/filter navigation.

## When to choose it

- **Documenting a Hybrid Rendering ADR**: Whenever a team migrates routes to the Next.js App Router or establishes module boundary conventions across multiple feature squads.
