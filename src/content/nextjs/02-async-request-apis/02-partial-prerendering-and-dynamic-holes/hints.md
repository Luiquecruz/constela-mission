First find all unguarded dynamic sections with `route.sections.filter((s) => s.kind === 'dynamic' && !s.wrappedInSuspense).map((s) => s.id)`.
---
If `route.rootReadsDynamic` is `true` or `unguardedDynamicIds.length > 0`, the route mode must be `'dynamic'`. Otherwise, check whether any section has `kind === 'dynamic'` to decide between `'ppr'` and `'static'`.
---
In `prerenderRouteShell(route)`, wrapped dynamic sections contribute their fallback HTML (`section.fallbackHtml ?? '<div data-fallback="' + section.id + '">Loading...</div>'`) to `shellHtml`, while their async `renderDynamic()` results are collected in `streamedChunks`.
