# Server Components and the Bundle Boundary

In the Next.js App Router, every component is a **React Server Component (RSC)** by default. Unlike traditional full-page Server-Side Rendering (SSR), where component code still ships to the browser for hydration, Server Components execute **exclusively on the server**. Their JavaScript dependencies, database queries, and internal secrets never enter the client bundle.

When a UI element needs browser interactivity (`useState`, `useEffect`, DOM event listeners, or Web APIs), you mark its file with the `'use client'` directive at the very top. That directive establishes the **bundle boundary**: a line in your module import graph where code execution transitions from the server-only graph to the shared client bundle.

## How the `'use client'` Boundary Works

A common misconception is that every component that renders on the client needs `'use client'` at the top of its file. In reality, `'use client'` marks an **entry point** into the client module graph. Once a file declares `'use client'`, every module it imports is implicitly pulled into the client JavaScript bundle as well.

```tsx
// app/products/[slug]/page.tsx — Server Component (0 KB client JS)
import { db } from '@/lib/db';
import { AddToCartPanel } from './AddToCartPanel';
import { MarkdownSpecs } from './MarkdownSpecs';

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const record = await db.products.findBySlug(slug);

  // Sanitize internal fields before crossing the serialization boundary
  const publicProduct = {
    id: record.id,
    title: record.title,
    retailPrice: record.retailPrice,
  };

  return (
    <main className="grid gap-6">
      <AddToCartPanel product={publicProduct}>
        {/* Server Component passed via children slot stays on the server! */}
        <MarkdownSpecs rawMarkdown={record.specMarkdown} />
      </AddToCartPanel>
    </main>
  );
}
```

Notice two architectural rules in the snippet above:

1. **Data Sanitization (Data Transfer Objects)**: Passing the entire raw database `record` directly to `<AddToCartPanel product={record} />` serializes every property into the public RSC payload exposed in the browser network tab. Always project database records into explicit public DTOs before crossing a `'use client'` boundary.
2. **Slot / Children Composition (The Donut Pattern)**: If `AddToCartPanel` imported `MarkdownSpecs` directly, the heavy Markdown parser inside `MarkdownSpecs` would be bundled for the browser. By rendering `<MarkdownSpecs />` in the parent Server Component and passing it as `children` (or any `ReactNode` prop) into `AddToCartPanel`, Next.js evaluates `MarkdownSpecs` on the server and streams only the resulting virtual DOM description to the client wrapper.

## Serialization Rules Across the Boundary

Because Server Components execute before the client bundle hydrates, props passed from a Server Component to a Client Component must be **serializable** by the React Flight protocol:

- **Allowed**: Primitives (`string`, `number`, `boolean`, `null`, `undefined`), plain objects, arrays, `Date`, `Map`, `Set`, JSX elements (`ReactNode`), Promises (consumable with React `use()`), and **Server Actions** (`'use server'` functions).
- **Forbidden**: Plain JavaScript functions/closures (such as event callbacks defined inline in a Server Component), class instances, or DOM nodes.

To protect your architecture against accidental server secrets leaking into the client bundle or client components importing server-only modules, install the `server-only` package and import it at the top of any data-access layer:

```ts
// lib/inventory-repository.ts
import 'server-only';

export async function getWholesaleCost(sku: string) {
  return process.env.ERP_API_SECRET ? fetchErpCost(sku) : null;
}
```

If any `'use client'` module directly or transitively imports `lib/inventory-repository.ts`, the Next.js build fails immediately at compile time instead of leaking server code.

## Common Pitfalls

- **Placing `'use client'` at the top of a page or layout**: Turning an entire route into a Client Component forfeits zero-bundle server rendering for every child imported underneath it. Push `'use client'` as far down the component tree as possible (leaf components).
- **Passing full ORM models as Client Component props**: Even if the Client Component only reads `product.title`, every serialized field on the object (`supplierCost`, `internalNotes`, `marginRate`) is embedded in the HTML stream and readable in DevTools.
- **Importing a Server Component inside a Client Component**: A Client Component cannot `import` a Server Component module directly; doing so converts that imported module into client code (or fails if it uses server-only APIs). Always pass Server Components down via `children` or named `ReactNode` props.

## When to choose it

- **Server Components (default)**: Data fetching, reading files/databases, rendering heavy static libraries (Markdown, syntax highlighting, schema formatters), and keeping API keys or wholesale logic off the client.
- **Client Components (`'use client'`)**: Interactive state (`useState`, `useReducer`), lifecycle effects (`useEffect`), browser APIs (`localStorage`, `IntersectionObserver`), and custom event handlers.
- **Children / Slot Composition**: Whenever a stateful client shell (tabs, collapsible drawers, modals, carousels) needs to wrap server-rendered content without inflating the client bundle.
