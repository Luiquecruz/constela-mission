In `toPublicProductDto(record)`, explicitly pick only `id`, `name`, `price`, `category`, and `inStock` into a new object literal rather than spreading `...record`.
---
In `validateClientProps(props)`, check both `props` and `props.product` (if `props.product` is an object) for `'supplierCost'` and `'internalSku'`. Then iterate `Object.entries(props)` and check if `typeof value === 'function' && !value.$$serverAction`.
---
In `<InteractiveProductCard>`, keep two pieces of `useState`: `quantity` (starting at `0`) and `showSpecs` (starting at `false`). Render `{showSpecs && <div data-testid="server-specs-slot">{children}</div>}` so the server-rendered `children` slot mounts without importing server logic into the client component.
