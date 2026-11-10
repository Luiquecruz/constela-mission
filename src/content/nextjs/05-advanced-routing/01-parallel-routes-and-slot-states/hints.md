Check whether `pathname` exists directly in `slot.routes` first using `Object.prototype.hasOwnProperty.call(slot.routes, pathname)` so a route explicitly mapped to `null` is still treated as a match.
---
When a slot does not match `pathname`, check `navigationType === 'soft'` and `previousState?.[slotName] !== undefined` before falling back to `slot.defaultView`. If `slot.defaultView === 'notFound'`, return `{ status: 404, missingSlot: slotName, rendered: null }`; if `slot.defaultView !== undefined` (including `null`), use `slot.defaultView`; otherwise return `{ status: 'build-error', missingSlot: slotName, rendered: null }`.
---
In `<ParallelDashboardApp />`, store the current `pathname`, `navigationType`, and the previously rendered map so clicking `"Soft navigate to /settings"` passes the previous slot views into `resolveParallelSlots`, while `"Hard reload /settings"` passes `navigationType: 'hard'`.
