# Challenge: Parallel Slot Resolution Engine & Dashboard

When building multi-slot layouts in the Next.js App Router, understanding the difference between **soft navigation** (which retains active slot state), **hard navigation** (which renders `default.tsx` or triggers a runtime 404 when `default.tsx` calls `notFound()`), and **build-time validation** (which fails with a build error when a slot omits `default.tsx`) prevents broken deep links in production.

## Requirements

1. Implement and export `resolveParallelSlots({ slots, pathname, navigationType, previousState })`:
   - `slots` is a record mapping each slot name (e.g., `'children'`, `'analytics'`, `'modal'`) to `{ routes: Record<string, string | null>, defaultView?: string | null }`.
   - `pathname` is the target URL path (e.g., `'/'` or `'/settings'`).
   - `navigationType` is either `'soft'` or `'hard'`.
   - `previousState` is an optional record of previously rendered slot views (`Record<string, string | null> | null`).
   - For each slot name in `slots`:
     1. If `pathname` is a key in `slot.routes` (`Object.prototype.hasOwnProperty.call(slot.routes, pathname)`), use `slot.routes[pathname]`.
     2. Otherwise, if `navigationType === 'soft'` and `previousState && previousState[slotName] !== undefined`, preserve `previousState[slotName]`.
     3. Otherwise, if `slot.defaultView === 'notFound'`, immediately return `{ status: 404, missingSlot: slotName, rendered: null }` (modeling a `default.tsx` that calls `notFound()` at runtime).
     4. Otherwise, if `slot.defaultView !== undefined` (note: `null` is a valid `defaultView`, such as an empty `@modal/default.tsx`), use `slot.defaultView`.
     5. Otherwise (`slot.defaultView === undefined`), immediately return `{ status: 'build-error', missingSlot: slotName, rendered: null }` (modeling a slot without `default.tsx` failing the Next.js build).
   - When all slots resolve, return `{ status: 200, missingSlot: null, rendered: resolvedMap }`.

2. Implement and export `<ParallelDashboardApp />` (and export it as `default`):
   - Configure a realistic dashboard slot map where:
     - `children` matches `'/'` (`'Workspace Overview'`) and `'/settings'` (`'Workspace Settings'`), with `defaultView: 'Default Workspace'`.
     - `analytics` matches `'/'` (`'Live Metrics Panel'`), has **no** `'/settings'` route, and uses `defaultView: 'Fallback Analytics (default.tsx)'`.
     - `modal` has no routes and `defaultView: null`.
   - Start at `pathname = '/'` and `navigationType = 'soft'`.
   - Provide buttons:
     - `"Soft navigate to /settings"` (switches to `'/settings'` with `'soft'`, preserving `'Live Metrics Panel'` from the previous state).
     - `"Hard reload /settings"` (switches to `'/settings'` with `'hard'`, causing `analytics` to render `'Fallback Analytics (default.tsx)'`).
     - `"Return to /"` (switches back to `'/'`).
   - Display the current path, navigation mode, and the resolved `children` and `analytics` slot contents.
