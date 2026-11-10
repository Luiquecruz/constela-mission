In `<SegmentBoundaryShell>`, check conditions in priority order with early returns: first `if (error)`, then `if (isLoading)`, then `if (isNotFound)`, and finally return `<>{children}</>`.
---
Use semantic ARIA roles so screen readers and tests detect the active boundary unambiguously: `role="alert"` for the error box (with `<button type="button" onClick={onRetry}>Try again</button>`) and `role="status"` for the loading skeleton.
---
In `<CourseViewerApp />`, keep the outer layout header and `"Persistent layout notes"` input outside `<SegmentBoundaryShell>` so switching between loading, error, not-found, and loaded states never unmounts the outer layout shell.
