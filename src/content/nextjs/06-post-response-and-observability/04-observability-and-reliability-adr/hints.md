Ensure `adr.status` is `'accepted'`, `adr.layer` is `'observability'`, `adr.context` is at least 80 characters long and mentions both `after` and `onRequestError`, and `adr.decision` starts with `'We will'`.
---
Provide at least 2 distinct objects in `adr.alternatives` (`{ option, reason }`)—for example, running all tasks in `after()` versus routing every task through a durable queue—and include at least 2 positive and 1 negative consequence in `adr.consequences`.
---
In `taskDispatchPlan`, assign `mechanism: 'after'` to `'analytics-pageview-beacon'` and `'search-cache-warm'`, and assign `mechanism: 'durable-queue'` to `'invoice-tax-settlement'` and `'payment-capture-webhook'`, with a clear `reason` (at least 20 characters) for each.
