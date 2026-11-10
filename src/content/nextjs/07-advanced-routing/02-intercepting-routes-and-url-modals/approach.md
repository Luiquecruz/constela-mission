# Step-by-Step Approach

1. **Implement `closeInterceptedModal`**:
   - Accept `(router, historyLength, fallbackPath = '/feed')`.
   - Call `router.back()` when `historyLength > 1`; otherwise call `router.push(fallbackPath)`.
2. **Parse the current route in `<PhotoFeedApp />`**:
   - Maintain `path` (initialized from `initialPath`), `navType` (initialized from `initialNavType`), and `historyLength` (starting at `1`, incrementing on soft navigation).
   - Match `/photo/:id` against `PHOTOS` to find `activePhoto`.
3. **Render the intercepted modal vs. canonical page with modal accessibility**:
   - If `activePhoto` is present and `navType === 'hard'`, render the standalone canonical view with heading `"Canonical Photo Page: ${activePhoto.title}"` and no feed or dialog.
   - Otherwise, render the `"Photo Feed"` `<section>` (marked `inert` while the modal is open) and—when `activePhoto` is matched with `navType === 'soft'`—render the `<div role="dialog" aria-modal="true" aria-label={activePhoto.title}>` overlay.
   - On modal open, move focus to the first interactive element inside the dialog; trap `Tab` / `Shift+Tab` inside the dialog; close on `Escape`; and restore focus to the invoking feed button when the dialog closes.
