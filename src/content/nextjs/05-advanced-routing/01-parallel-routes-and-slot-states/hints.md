Check whether `pathname` exists directly in `slot.routes` first using `Object.prototype.hasOwnProperty.call(slot.routes, pathname)` so a route explicitly mapped to `null` is still treated as a match.
---
When a slot does not match `pathname`, check `navigationType === 'soft'` and `previousState?.[slotName] !== undefined` before falling back to `slot.defaultView`. Remember that `slot.defaultView === null` is a valid defined fallback (common for `@modal/default.tsx`), so compare `slot.defaultView !== undefined`.
---
In `<ParallelDashboardApp />`, store the current `pathname`, `navigationType`, and the previously rendered map so clicking `"Soft navigate to /settings"` passes the previous slot views into `resolveParallelSlots`, while `"Hard reload /settings"` passes `navigationType: 'hard'`.
