1. **Detect unguarded dynamic sections**: Filter `route.sections` for items with `kind === 'dynamic' && !wrappedInSuspense` and map them to their `id` strings.
2. **Classify the route rendering mode**:
   - Return `mode: 'dynamic'` if `route.rootReadsDynamic` is `true` or `unguardedDynamicIds.length > 0`.
   - Return `mode: 'static'` if no section has `kind === 'dynamic'`.
   - Return `mode: 'ppr'` when dynamic sections exist and all of them have `wrappedInSuspense: true`.
3. **Assemble `shellHtml` and `streamedChunks`**:
   - Iterate through `route.sections`. Static sections emit `section.html`. Dynamic sections with `wrappedInSuspense: true` emit `section.fallbackHtml ?? '<div data-fallback="' + section.id + '">Loading...</div>'` into `shellHtml` and queue their `renderDynamic()` call for `streamedChunks`.
   - Resolve queued dynamic chunks concurrently with `Promise.all`.
