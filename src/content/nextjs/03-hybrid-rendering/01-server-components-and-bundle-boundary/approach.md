1. Implement `toPublicProductDto(record)` by destructuring `id`, `name`, `price`, `category`, and `inStock` from `record` and returning a fresh object with only those 5 properties.
2. Implement `validateClientProps(props)` to collect a `violations: string[]` array:
   - Check `['supplierCost', 'internalSku']` on `props` and on `props.product` (when `props.product` is a non-null object). For each present key, push `"Leaked sensitive field: ${key}"`.
   - Loop over `Object.entries(props)` and if `typeof val === 'function'` and `(val as any).$$serverAction !== true`, push `"Non-serializable function prop: ${key}"`.
   - Return `{ valid: violations.length === 0, violations }`.
3. In `InteractiveProductCard`, use `React.useState(0)` for cart count and `React.useState(false)` for `specsOpen`. Wire the `"Add to cart"` button to increment the count and invoke `onAddToCart?.(product.id)`, and wire `"Toggle specifications"` to flip `specsOpen` and conditionally render `{children}`.
4. In `CatalogPage`, map each raw record through `toPublicProductDto(record)` and pass `<ServerSpecsTable markdown={record.specsMarkdown} />` as `children` into `<InteractiveProductCard>`.
