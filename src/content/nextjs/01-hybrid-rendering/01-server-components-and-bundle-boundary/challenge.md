# Challenge: Sanitize Client Props and Compose Server Slots

You are auditing a Next.js App Router product catalog where a raw database record (`RawProductRecord`) containing confidential fields (`supplierCost` and `internalSku`) is being passed across the `'use client'` boundary, and non-serializable callbacks risk breaking the React Flight serializer.

## Requirements

1. **`toPublicProductDto(record)`**:
   - Accept a `RawProductRecord` (`{ id, name, price, category, inStock, supplierCost, internalSku, specsMarkdown }`).
   - Return a clean `PublicProductDto` containing **only** `{ id, name, price, category, inStock }`. Never leak `supplierCost`, `internalSku`, or `specsMarkdown` on the DTO.

2. **`validateClientProps(props)`**:
   - Inspect a top-level `props` object before it crosses a `'use client'` boundary and return `{ valid: boolean, violations: string[] }`.
   - Flag any sensitive keys (`supplierCost` or `internalSku`) found directly on `props` or nested inside `props.product` by pushing `"Leaked sensitive field: <key>"`.
   - Flag any prop whose value is a plain function (`typeof value === 'function'`) **unless** it is a Server Action marked with `value.$$serverAction === true`, by pushing `"Non-serializable function prop: <key>"`.
   - Allow `children` and any `ReactNode` slot props (objects/elements), primitives, arrays, and Server Actions.

3. **`<InteractiveProductCard product={dto} onAddToCart={...}>{children}</InteractiveProductCard>`**:
   - Render the public product `name`, formatted price (`$${product.price}`), and category.
   - Provide an `"Add to cart"` button that calls `onAddToCart(product.id)` and increments a local quantity badge (`"In cart: X"`).
   - Provide a `"Toggle specifications"` button (`aria-expanded`) that shows or hides the server-rendered `children` slot inside a container when toggled open.
