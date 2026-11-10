# Step-by-Step Approach

1. **Implement `closeInterceptedModal`**:
   - Accept `(router, historyLength, fallbackPath = '/feed')`.
   - Call `router.back()` when `historyLength > 1`; otherwise call `router.push(fallbackPath)`.
2. **Parse the current route in `<PhotoFeedApp />`**:
   - Maintain `path` (initialized from `initialPath`), `navType` (initialized from `initialNavType`), and `historyLength` (starting at `1`, incrementing on soft navigation).
   - Match `/photo/:id` against `PHOTOS` to find `activePhoto`.
3. **Render the intercepted modal vs. canonical page**:
   - If `activePhoto` is present and `navType === 'hard'`, render the standalone canonical view with heading `"Canonical Photo Page: ${activePhoto.title}"` and no feed or dialog.
   - Otherwise, render the `"Photo Feed"` grid and—when `activePhoto` is matched with `navType === 'soft'`—render the `<div role="dialog" aria-label={activePhoto.title}>` overlay with `"Close modal"` and `"Simulate hard reload"` buttons.
