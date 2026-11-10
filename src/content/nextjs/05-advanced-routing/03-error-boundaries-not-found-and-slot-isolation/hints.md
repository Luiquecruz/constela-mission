Keep the state for `edits` (`useState(0)`), `missingInvoice` (`useState(initialMissingInvoice)`), and `analyticsError` (`useState(initialAnalyticsError)`) decoupled so toggling `analyticsError` never unmounts `<section aria-label="Main Workspace">`.
---
Inside `<section aria-label="Analytics Slot">`, conditionally render `<div role="alert">` with `"Analytics failed to load"` and the `"Retry analytics"` button when `analyticsError` is true; otherwise render `"Live conversion: 4.8%"` and `"Trigger analytics error"`.
---
Inside `<section aria-label="Main Workspace">`, keep the `"Increment workspace edits (count: X)"` button available and toggle the invoice area between `"Invoice #INV-100: Paid"` (with `"Open missing invoice #INV-999"`) and `"Invoice not found"` (with `"Back to invoices"`).
