## Step-by-Step Approach

1. **Complete the `adr` Metadata and Context**:
   - Set `status: 'accepted'` and `layer: 'observability'`.
   - Write a `context` (80+ chars) explaining how FinLedger separates best-effort post-response work in `after` from durable financial workflows while centralizing server error reporting via `onRequestError` in `instrumentation.ts`.
   - Write a `decision` (40+ chars) beginning with `'We will'`.
2. **Document Alternatives and Consequences**:
   - Add at least two `alternatives`: e.g., running all background tasks in `after()` (rejected because pod crashes drop financial settlements) and queueing every analytics beacon in a durable broker (rejected due to unnecessary latency and cost).
   - Provide at least two `positive` consequences and at least one `negative` consequence.
3. **Classify the Four Tasks in `taskDispatchPlan`**:
   - Map `'analytics-pageview-beacon'` and `'search-cache-warm'` to `'after'` because they are sub-second, idempotent, best-effort tasks.
   - Map `'invoice-tax-settlement'` and `'payment-capture-webhook'` to `'durable-queue'` because they require persisted retries, atomic state transitions, and dead-letter recovery across restarts.
