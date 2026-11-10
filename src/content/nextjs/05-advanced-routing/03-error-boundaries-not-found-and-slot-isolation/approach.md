# Step-by-Step Approach

1. **Initialize Independent Slot States**:
   - In `IsolatedWorkspace`, track `edits` (`0`), `analyticsError` (`initialAnalyticsError`), and `missingInvoice` (`initialMissingInvoice`).
2. **Build the `@children` Main Workspace Region**:
   - Wrap in `<section aria-label="Main Workspace">`.
   - Render the stateful `"Increment workspace edits (count: {edits})"` button.
   - Conditionally render the `not-found.tsx` fallback (`"Invoice not found"` + `"Back to invoices"` button) when `missingInvoice` is true, or `"Invoice #INV-100: Paid"` + `"Open missing invoice #INV-999"` button when false.
3. **Build the `@analytics` Slot Region with Isolated Error Recovery**:
   - Wrap in `<section aria-label="Analytics Slot">`.
   - When `analyticsError` is true, render `<div role="alert">` with `"Analytics failed to load"` and a `"Retry analytics"` button (`onClick={() => setAnalyticsError(false)}`).
   - When `analyticsError` is false, render `"Live conversion: 4.8%"` and a `"Trigger analytics error"` button (`onClick={() => setAnalyticsError(true)}`).
