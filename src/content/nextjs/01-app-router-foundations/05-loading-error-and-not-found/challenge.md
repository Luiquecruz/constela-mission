# Challenge: Segment Boundary Shell & Course Viewer Recovery

In the App Router, a segment's outer `layout.tsx` remains mounted while inner boundaries render loading skeletons (`loading.tsx`), recoverable crash UI (`error.tsx`), or missing-resource UI (`not-found.tsx`).

## Requirements

1. **`<SegmentBoundaryShell isLoading={...} error={...} isNotFound={...} onRetry={...}>{children}</SegmentBoundaryShell>`**:
   - Accept `{ isLoading?: boolean; error?: Error | string | null; isNotFound?: boolean; onRetry?: () => void; children?: React.ReactNode }`.
   - Enforce boundary precedence and accessibility roles:
     - When `error` is truthy: render an error container with `role="alert"`, display the error message (`error instanceof Error ? error.message : String(error)`), and render a `"Try again"` button that invokes `onRetry?.()`.
     - Else when `isLoading` is true: render a loading fallback with `role="status"` (e.g., `"Loading course segment..."`), hiding `children`.
     - Else when `isNotFound` is true: render a not-found view containing `"Resource not found"`.
     - Otherwise: render `{children}`.

2. **`<CourseViewerApp />`** (also exported as `default`):
   - Render a persistent outer layout shell (`data-testid="course-layout-shell"`) containing a persistent note input (`aria-label="Persistent layout notes"`) so learners can verify the layout never unmounts across state switches.
   - Provide buttons to select courses (`"app-router"`, `"server-actions"`, `"missing-slug"`) and trigger boundary states (`"Loaded"`, `"Loading"`, `"Error"`, `"Not Found"`), wiring `<SegmentBoundaryShell>` so clicking `"Try again"` recovers from `"Error"` back to `"Loaded"`.
