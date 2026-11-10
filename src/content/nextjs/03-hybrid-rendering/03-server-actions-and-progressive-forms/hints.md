In `buildSearchFormUrl(actionPath, formData)`, normalize `formData` by checking `formData instanceof FormData ? Array.from(formData.entries()) : Object.entries(formData)`. Trim each string value and only call `params.set(key, trimmed)` when `trimmed.length > 0`.
---
In `createProductAction(prevState, payload)`, extract `rawName` and `rawPrice` whether `payload` is `FormData` (`payload.get('name')`) or a plain object (`payload.name`). Check `trimmedName.length < 3` first, then check `!Number.isFinite(numericPrice) || numericPrice <= 0`.
---
In `<CatalogSearchAndCreateApp>`, wire the `"Create Product"` form `onSubmit` handler to call `await createProductAction(actionState, { name, price })`. If `!result.ok`, set the error message in state and render it inside `<p role="alert">{error}</p>`; if `result.ok && result.item`, append `result.item` to your products list and clear any error.
