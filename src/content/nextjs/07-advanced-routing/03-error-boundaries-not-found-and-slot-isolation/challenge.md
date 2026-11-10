# Challenge: Granular Slot Error Recovery & Not-Found Isolation

Build a two-slot workspace (`Main Workspace` and `Analytics Slot`) that demonstrates how per-slot `error.tsx` and `not-found.tsx` boundaries contain failures without resetting state in sibling slots.

## Requirements

1. Implement and export `<IsolatedWorkspace initialAnalyticsError={false} initialMissingInvoice={false} />` (and export it as `default`).
2. Render two landmark regions (`<section aria-label="Main Workspace">` and `<section aria-label="Analytics Slot">`) side by side:
   - **`Main Workspace` (`@children` slot)**:
     - Maintains interactive client state that persists across sibling slot errors: a button `"Increment workspace edits (count: X)"` (starting at `0`, incrementing on click).
     - When `missingInvoice` is `false` (default unless `initialMissingInvoice={true}`):
       - Displays the active invoice `"Invoice #INV-100: Paid"` and a button `"Open missing invoice #INV-999"`.
     - When `missingInvoice` is `true` (via `initialMissingInvoice={true}` or clicking `"Open missing invoice #INV-999"`):
       - Renders the segment's `not-found.tsx` boundary UI showing `"Invoice not found"` and a `"Back to invoices"` button that resets `missingInvoice` back to `false` without losing the workspace edit counter.
   - **`Analytics Slot` (`@analytics` slot)**:
     - When `analyticsError` is `false` (default unless `initialAnalyticsError={true}`):
       - Displays `"Live conversion: 4.8%"` and a button `"Trigger analytics error"`.
     - When `analyticsError` is `true` (via `initialAnalyticsError={true}` or clicking `"Trigger analytics error"`):
       - Renders the slot's `error.tsx` boundary UI inside `role="alert"` containing `"Analytics failed to load"` and a `"Retry analytics"` button that resets `analyticsError` back to `false` and restores `"Live conversion: 4.8%"`.
