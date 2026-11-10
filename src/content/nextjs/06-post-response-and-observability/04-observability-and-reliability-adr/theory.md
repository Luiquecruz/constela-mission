# Checkpoint: Post-Response and Observability ADR

Architectural excellence in Next.js requires knowing where the framework's built-in lifecycle primitives end and where dedicated distributed infrastructure begins. When teams discover `after()` from `next/server` and `onRequestError` in `instrumentation.ts`, a common anti-pattern is treating `after()` as a universal background job queue for every asynchronous workflow in the system.

In this module checkpoint, you will author an **Architecture Decision Record (ADR)** and a **Task Dispatch Plan** for **FinLedger**, a high-volume checkout and financial analytics platform running on Next.js.

## Comparing Execution Guarantees: `after()` vs. Durable Queues

| Dimension | `after()` (`next/server` + `waitUntil`) | Durable Queue / Workflow Engine |
| :--- | :--- | :--- |
| **Execution Window** | Bounded by serverless/container invocation timeout (seconds). | Unbounded; supports multi-hour retries and scheduled backoff. |
| **Crash Resilience** | At-most-once; lost if the process crashes or OOMs mid-flight. | At-least-once or exactly-once via persisted state and dead-letter queues. |
| **Latency Impact** | Zero TTFB impact; runs in-memory on the same warm instance. | Small enqueue overhead over HTTP/TCP before returning response. |
| **Ideal Workloads** | Best-effort analytics beacons, audit logs, non-critical cache warming. | Financial ledger settlements, payment captures, multi-step webhooks. |

## Unified Server Observability with `instrumentation.ts`

Regardless of how background tasks are dispatched, FinLedger needs a single observability contract across Node.js and Edge runtimes:

```ts
// src/instrumentation.ts
import type { Instrumentation } from 'next';

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { registerNodeOtel } = await import('./observability/node');
    await registerNodeOtel();
  }
}

export const onRequestError: Instrumentation.onRequestError = async (
  err,
  request,
  context
) => {
  const { captureServerException } = await import('./observability/error-sink');
  await captureServerException(err, request, context);
};
```

By pairing `register()` and `onRequestError` with `after()`, FinLedger captures unhandled exceptions correlated by `err.digest` and `context.routePath` while keeping non-critical telemetry off the user's critical path.

## Common Pitfalls

- **Running financial settlements or payment captures inside `after()`**: If a container restarts or hits a platform wall-clock limit while an `after()` callback is awaiting a slow banking API, the ledger entry is permanently dropped without a dead-letter record.
- **Routing every trivial analytics beacon through a durable queue**: Enqueueing high-frequency pageview beacons into a persistent broker adds network latency to the request and inflates infrastructure costs when `after()` can flush them in-memory for free.
- **Omitting `onRequestError` context metadata**: Logging only `err.message` without `err.digest`, `context.routePath`, and redacted headers makes it impossible to join user-reported error digests with server traces.

## When to choose it

- Choose `after()` for sub-second, idempotent, or best-effort side effects (`analytics-pageview-beacon`, `search-cache-warm`) where an occasional dropped event on a hard instance crash is acceptable.
- Choose a **durable queue** for legally or financially critical state transitions (`invoice-tax-settlement`, `payment-capture-webhook`) that require persisted retries, idempotency keys, and dead-letter visibility across restarts.
