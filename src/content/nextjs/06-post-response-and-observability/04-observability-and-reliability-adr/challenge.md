# FinLedger Post-Response & Observability ADR

**FinLedger** is a checkout and financial analytics platform built on the Next.js App Router. Currently, engineers are debating whether to run all four order-creation background tasks inside `after()` from `next/server` or route everything through an external durable queue, and how to standardize error observability across runtimes.

## Workload Briefing

When an order is created on FinLedger, four background tasks are triggered:

1. `'analytics-pageview-beacon'`: Best-effort telemetry event, sub-second latency, safe to drop if a pod crashes.
2. `'search-cache-warm'`: Warming a secondary read cache after a product update; idempotent and non-critical.
3. `'invoice-tax-settlement'`: Legally required financial ledger entry that must succeed with multi-hour retry guarantees across restarts.
4. `'payment-capture-webhook'`: Charging the customer's card and updating order state atomically with dead-letter visibility.

## Requirements

In `adr.ts`, export both `adr` and `taskDispatchPlan`:

1. **`adr` object**:
   - `id`: non-empty string (e.g. `'ADR-004'`).
   - `title`: non-empty string describing the post-response and observability architecture.
   - `status`: must be `'accepted'`.
   - `layer`: must be `'observability'`.
   - `context`: string of at least `80` characters that explicitly mentions both `after` and `onRequestError`.
   - `decision`: string of at least `40` characters starting with `'We will'`.
   - `alternatives`: array of at least `2` distinct objects `{ option: string, reason: string }` (each `reason` at least `20` chars).
   - `consequences`: `{ positive: string[], negative: string[] }` with at least `2` items in `positive` and at least `1` item in `negative`.

2. **`taskDispatchPlan` array**:
   - Contains entries for all 4 tasks (`'analytics-pageview-beacon'`, `'search-cache-warm'`, `'invoice-tax-settlement'`, `'payment-capture-webhook'`).
   - Each entry has `{ task, mechanism: 'after' | 'durable-queue', reason }` where `reason` is at least `20` characters.
   - Coherence rules:
     - `'analytics-pageview-beacon'` and `'search-cache-warm'` MUST use `'after'`.
     - `'invoice-tax-settlement'` and `'payment-capture-webhook'` MUST use `'durable-queue'`.
