# Step-by-Step Approach

1. **Iterate over each configured slot in `resolveParallelSlots`**:
   - Loop through `Object.entries(slots)` and maintain a `rendered: Record<string, string | null> = {}` object.
2. **Apply the 4-step Next.js slot resolution priority**:
   - **Exact route match**: If `Object.prototype.hasOwnProperty.call(slot.routes, pathname)` is true, assign `rendered[slotName] = slot.routes[pathname]`.
   - **Soft-navigation retention**: Else if `navigationType === 'soft'` and `previousState && previousState[slotName] !== undefined`, assign `rendered[slotName] = previousState[slotName]`.
   - **`default.tsx` fallback**: Else if `slot.defaultView !== undefined`, assign `rendered[slotName] = slot.defaultView`.
   - **Unmatched slot 404**: Else return `{ status: 404, missingSlot: slotName, rendered: null }` immediately.
3. **Wire the interactive `<ParallelDashboardApp />`**:
   - Define `DASHBOARD_SLOTS` with `children`, `analytics`, and `modal`.
   - Track state for `pathname`, `navigationType`, and `rendered` slots, updating them via `resolveParallelSlots` when the user triggers soft navigation to `/settings`, hard reload on `/settings`, or returns to `/`.
