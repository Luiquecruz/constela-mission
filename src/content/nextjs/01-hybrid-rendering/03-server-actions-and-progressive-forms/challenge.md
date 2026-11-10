# Challenge: Progressive `<Form>` Navigation and Validated Server Actions

Build a catalog search and product creation module that combines progressive GET search navigation (`next/form` semantics) with a validated Server Action mutation (`useActionState` semantics).

## Requirements

1. **`buildSearchFormUrl(actionPath, formData)`**:
   - Accept `actionPath: string` (e.g., `"/catalog"`) and `formData` (either a `FormData` instance or a `Record<string, string>`).
   - Extract all string entries whose trimmed value is non-empty, trimming the value of `"q"` (and any other string fields).
   - Build a `URLSearchParams` query string. If at least one non-empty parameter exists, return `${actionPath}?${params.toString()}`; otherwise return `actionPath`.

2. **`createProductAction(prevState, payload)`**:
   - Accept `prevState` and `payload` (`FormData` or `{ name?: string; price?: number | string }`).
   - Read and trim `name`, and parse `price` with `Number(...)`.
   - Validate inputs on the server side:
     - If `name.trim().length < 3`, return `{ ok: false, error: 'Product name must be at least 3 characters', item: null }`.
     - If `!Number.isFinite(price) || price <= 0`, return `{ ok: false, error: 'Price must be greater than zero', item: null }`.
   - When valid, return `{ ok: true, error: null, item: { id: '...', name: name.trim(), price } }`.

3. **`<CatalogSearchAndCreateApp onNavigate={...} />`**:
   - Render a search `<form aria-label="Catalog Search">` with an input (`placeholder="Search catalog..."`) and a `"Search"` submit button. Submitting calls `buildSearchFormUrl('/catalog', ...)` and passes the resulting URL to `onNavigate?.(url)` as well as displaying `"Navigated to: <url>"`.
   - Render a creation `<form aria-label="Create Product">` with inputs for product name (`placeholder="Product name"`) and price (`placeholder="Price"`), plus a `"Create product"` submit button.
   - When `createProductAction` returns an error, render `<p role="alert">{error}</p>`. When it succeeds, append the new item to the rendered catalog list (`"{item.name} - ${item.price}"`).
