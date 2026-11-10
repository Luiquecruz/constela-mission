Check `adr.status` (`'accepted'`), `adr.layer` (`'hybrid-rendering'`), `adr.context` (must be >= 80 chars and mention both `bundle` and `Server Components`), and `adr.decision` (must be >= 40 chars and start with `'We will'`).
---
Ensure `adr.alternatives` has at least 2 distinct options with a `reason` of at least 20 characters each, and `adr.consequences` includes at least 2 `positive` outcomes and 1 `negative` trade-off.
---
In `componentBoundaries`, assign `'server-component'` to both `'ProductMarkdownSpecification'` and `'SupplierWholesaleMarginCalculator'`, `'client-component'` to `'InteractiveSizeAndColorPicker'`, and `'next-form'` to `'CatalogFilterSearchForm'`, with a clear `reason` (>= 20 chars) for each.
