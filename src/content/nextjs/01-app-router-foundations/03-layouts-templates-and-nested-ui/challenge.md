# Challenge: Segment Nesting Order & Layout vs. Template Lifecycle

In Next.js, navigating between sibling routes keeps `layout.tsx` mounted (preserving state) while `template.tsx` remounts a fresh component instance inside the layout on every transition.

## Requirements

1. **`resolveSegmentChain(pathname)`**:
   - Accept a `pathname: string` (e.g. `"/"`, `"/dashboard"`, `"/dashboard/billing"`, `"/dashboard/settings"`).
   - Return an ordered array of `SegmentLayer` objects (`{ segment: string; kind: 'layout' | 'template' | 'page'; file: string }`) from the root layout down to the leaf page:
     - Always start with `{ segment: '/', kind: 'layout', file: 'app/layout.tsx' }`.
     - Whenever the pathname is `"/dashboard"` or starts with `"/dashboard/"`, include:
       1. `{ segment: '/dashboard', kind: 'layout', file: 'app/dashboard/layout.tsx' }`
       2. `{ segment: '/dashboard', kind: 'template', file: 'app/dashboard/template.tsx' }`
     - End with the leaf page descriptor:
       - For `"/"`: `{ segment: '/', kind: 'page', file: 'app/page.tsx' }`
       - For any other normalized path `"/a/b"`: `{ segment: '/a/b', kind: 'page', file: 'app/a/b/page.tsx' }`

2. **`<LayoutVsTemplateDemo />`** (also exported as `default`):
   - Provide navigation buttons for `"/dashboard"`, `"/dashboard/billing"`, and `"/dashboard/settings"`.
   - Render the resolved segment chain (`resolveSegmentChain(activePath)`) showing each layer's file path.
   - Render a persistent `DashboardLayout` containing:
     - A text input (`aria-label="Layout note"`) whose value **persists** across route switches.
     - A layout counter (`"Layout counter: X"`) with an `"Increment layout counter"` button whose state **persists** across route switches.
   - Render a `DashboardTemplate` inside `DashboardLayout` that **remounts** on every route change (resetting its local state):
     - A template counter (`"Template counter: Y"`) with an `"Increment template counter"` button whose state **resets to 0** whenever the user navigates to another route.
