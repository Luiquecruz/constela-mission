1. **Implement `<SegmentBoundaryShell>` with ordered boundary checks**:
   - Check `error` first: extract `const message = typeof error === 'string' ? error : error.message`, render `<div role="alert">` with the message and `<button type="button" onClick={onRetry}>Try again</button>`.
   - Check `isLoading` next: render `<div role="status">Loading course segment...</div>`.
   - Check `isNotFound` next: render `<div><h3>Resource not found</h3>...</div>`.
   - Otherwise return `<>{children}</>`.
2. **Build `<CourseViewerApp />` around a persistent outer layout**:
   - Store `selectedSlug` and `boundaryMode` (`'loaded' | 'loading' | 'error' | 'not-found'`) in state.
   - Selecting `"missing-slug"` (or clicking `"Not Found"`) sets `isNotFound` to `true`; clicking `"Error"` sets an `Error` object whose `onRetry` resets `boundaryMode` to `'loaded'`.
   - Keep the layout header and persistent notes input outside `<SegmentBoundaryShell>` so outer layout state survives every boundary transition.
