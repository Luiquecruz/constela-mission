1. In `buildSearchFormUrl(actionPath, formData)`, iterate over entries from `FormData` or a plain record:
   ```ts
   const params = new URLSearchParams();
   const entries =
     formData instanceof FormData
       ? Array.from(formData.entries())
       : Object.entries(formData);
   for (const [key, val] of entries) {
     if (typeof val === 'string') {
       const trimmed = val.trim();
       if (trimmed.length > 0) params.set(key, trimmed);
     }
   }
   const qs = params.toString();
   return qs ? `${actionPath}?${qs}` : actionPath;
   ```
2. In `createProductAction(prevState, payload)`, read `name` and `price`, validate `name.trim().length >= 3` and `price > 0`, and return the structured `{ ok, error, item }` state object.
3. In `CatalogSearchAndCreateApp`, handle the search form submission by computing `const url = buildSearchFormUrl('/catalog', { q: searchQuery })`, updating `lastUrl`, and calling `onNavigate?.(url)`.
4. Handle the creation form submission by awaiting `createProductAction(state, { name, price })`, displaying `state.error` inside `role="alert"` on failure, or appending `state.item` to the list on success.
