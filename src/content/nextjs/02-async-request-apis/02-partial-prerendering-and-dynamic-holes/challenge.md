# Challenge: Route Shell Analyzer and PPR Simulator

To master Partial Prerendering (PPR), you need to distinguish when a route can be fully prerendered (`'static'`), when it combines a static shell with `<Suspense>` holes (`'ppr'`), and when an unguarded dynamic read forces full request-time rendering (`'dynamic'`).

## Requirements

1. Implement `analyzeRouteTree(route)`:
   - `route` has `{ path: string, rootReadsDynamic: boolean, sections: RouteSection[] }`.
   - Each section has `{ id: string, kind: 'static' | 'dynamic', wrappedInSuspense: boolean, html: string, fallbackHtml?: string, renderDynamic?: () => Promise<string> }`.
   - Collect `unguardedDynamicIds`: the `id`s of all sections where `section.kind === 'dynamic' && !section.wrappedInSuspense`.
   - Determine `mode`:
     - If `route.rootReadsDynamic` is `true` OR `unguardedDynamicIds.length > 0`, `mode` is `'dynamic'`.
     - Otherwise, if every section has `kind === 'static'`, `mode` is `'static'`.
     - Otherwise (at least one dynamic section exists and all dynamic sections are wrapped in Suspense, while `rootReadsDynamic` is `false`), `mode` is `'ppr'`.
   - Return `{ mode, unguardedDynamicIds }`.

2. Implement `prerenderRouteShell(route)` (async):
   - Build `shellHtml` by concatenating each section's initial shell representation in order:
     - If `section.kind === 'static'`, use `section.html`.
     - If `section.kind === 'dynamic'` and `section.wrappedInSuspense` is `true`, use `section.fallbackHtml ?? '<div data-fallback="' + section.id + '">Loading...</div>'`.
     - If `section.kind === 'dynamic'` and `section.wrappedInSuspense` is `false`, await `section.renderDynamic()` (or fall back to `section.html` if `renderDynamic` is not provided) directly in the shell.
   - For all dynamic sections where `section.wrappedInSuspense` is `true`, resolve their `section.renderDynamic?.() ?? Promise.resolve(section.html)` in parallel with `Promise.all` and return them in `streamedChunks` as `Array<{ id: string, html: string }>`.
   - Return `{ shellHtml, streamedChunks }`.
