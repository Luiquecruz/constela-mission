# Post-Response Execution with after()

When a user triggers a Server Action, visits a dynamic route, or calls a Route Handler, the critical path should only include work required to compute the HTTP response. Secondary side effects—such as sending analytics events, writing audit trails, or warming downstream caches—do not change the bytes sent to the browser. Running `await recordAuditLog()` inline adds latency directly to Time to First Byte (TTFB), while firing an unawaited promise (`void recordAuditLog()`) risks abrupt termination on serverless platforms that freeze the CPU the instant the response stream closes.

Next.js solves this with `after()` from `next/server`. Calling `after(callback)` schedules a function to run after the current rendering phase or request lifecycle finishes flushing its response to the client.

```tsx
import { after } from 'next/server';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { recordCheckoutAudit } from '@/lib/audit';

export async function completeOrderAction(formData: FormData) {
  'use server';
  const orderId = String(formData.get('orderId'));
  const sessionCookie = (await cookies()).get('session_id')?.value;
  const userAgent = (await headers()).get('user-agent') ?? 'unknown';

  const session = await cookies();
  session.set('last_order', orderId, { httpOnly: true, path: '/' });

  after(async () => {
    // Runs after the redirect response is sent to the browser
    await recordCheckoutAudit({
      orderId,
      sessionId: sessionCookie,
      userAgent,
    });
  });

  redirect(`/orders/${orderId}/confirmation`);
}
```

## Execution Guarantees Across Control Flow

Unlike code placed after `return` or after control-flow exceptions, callbacks registered with `after()` are attached to the request context managed via `AsyncLocalStorage`. They still execute when:

- A Server Component, Server Action, or Route Handler completes normally.
- Control flow halts early via `redirect('/target')` or `notFound()`, which internally throw framework control-flow exceptions.
- A route throws an unhandled error resulting in a `500` error boundary response.
- A static page is prerendered at build time or during Incremental Static Regeneration (ISR), where `after()` runs once the prerender completes.

Callbacks can also be nested: an `after()` callback can itself call `after()` to enqueue follow-up post-response tasks, and the runtime drains the queue in registration order before releasing the invocation.

## Platform Mechanics: `AsyncLocalStorage` and `waitUntil`

Under the hood, the Next.js server wraps each incoming request in an `AsyncLocalStorage` store containing an array of deferred promises and a reference to the platform's lifecycle primitive:

- **Serverless / Edge runtimes**: Next.js delegates the promise queue to `ctx.waitUntil(promise)` (injected via `RequestContext`), instructing the platform to keep the isolate or container warm after the HTTP response stream closes until all queued promises settle.
- **Self-hosted Node.js (`next start`)**: The Node.js process stays alive across requests, so the runtime drains the queued callbacks asynchronously on the event loop after flushing the socket.

## Common Pitfalls

- **Mutating cookies or response headers inside `after()`**: Because `after()` executes *after* the HTTP response headers and body have already been flushed over the wire, calling `(await cookies()).set(...)` or `(await cookies()).delete(...)` inside an `after()` callback throws a runtime error. Always perform cookie mutations before scheduling or exiting the synchronous response phase. Reading request `headers()` or `cookies()` remains safe inside `after()` in Server Actions and Route Handlers.
- **Using `after()` for multi-hour durable workflows**: `waitUntil()` is still bounded by the platform's maximum background execution timeout (often 15 to 60 seconds). If a pod crashes or a function hits its hard timeout, in-flight `after()` callbacks are lost without automatic retry. Financial settlements or multi-step webhooks require a durable message queue.
- **Assuming `after()` can alter the response on failure**: If an `after()` callback throws an exception, the client has already received its `200` or `307` status code. Errors inside `after()` must be caught or forwarded to observability hooks rather than relied upon for client-facing error handling.

## When to choose it

- Choose `after()` for fast, best-effort post-response side effects (analytics beacons, audit logs, telemetry flushing, non-critical cache warming) that should never slow down the user-facing response.
- Avoid `after()` when the outcome of the operation must change the HTTP status code, set response cookies, or guarantee multi-attempt delivery across process crashes—use inline `await` before responding or hand off to a durable background job queue instead.
