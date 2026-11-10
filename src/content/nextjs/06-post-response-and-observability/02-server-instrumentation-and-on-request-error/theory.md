# Server Observability with instrumentation.ts and onRequestError

Modern full-stack Next.js applications execute across Server Components, Route Handlers, Server Actions, and Middleware, often spanning both the Node.js runtime and the Edge runtime. Installing error tracking or OpenTelemetry SDKs inside individual route files leads to duplicate initialization, missed startup spans, and fragmented error reporting.

Next.js centralizes server lifecycle hooks in a single `instrumentation.ts` (or `.js`) file placed at the root of the project (or inside `src/` if you use a `src` directory).

## Bootstrapping Telemetry with `register()`

Exporting an async `register()` function from `instrumentation.ts` instructs Next.js to invoke it **once** when a new Next.js server instance boots. Because Next.js compiles instrumentation for both Node.js and Edge environments, `register()` should branch on `process.env.NEXT_RUNTIME` and dynamically import runtime-specific SDKs so Node-only native modules are never bundled into Edge isolates.

```ts
// src/instrumentation.ts
import type { Instrumentation } from 'next';

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { initNodeTelemetry } = await import('./lib/telemetry-node');
    await initNodeTelemetry();
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    const { initEdgeTelemetry } = await import('./lib/telemetry-edge');
    await initEdgeTelemetry();
  }
}
```

## Centralized Error Reporting with `onRequestError`

Alongside `register()`, `instrumentation.ts` can export `onRequestError`, a hook invoked automatically whenever the Next.js server catches an unhandled error during rendering, inside a Route Handler, or inside a Server Action.

```ts
export const onRequestError: Instrumentation.onRequestError = async (
  err,
  request,
  context
) => {
  const safeHeaders = Object.fromEntries(
    Object.entries(request.headers).map(([key, value]) => {
      const lower = key.toLowerCase();
      if (lower === 'authorization' || lower === 'cookie' || lower === 'x-api-key') {
        return [lower, '[REDACTED]'];
      }
      return [lower, value];
    })
  );

  await reportToTelemetrySink({
    message: err.message,
    digest: err.digest ?? 'unknown',
    method: request.method,
    path: request.path,
    headers: safeHeaders,
    routerKind: context.routerKind,     // 'Pages Router' | 'App Router'
    routePath: context.routePath,       // e.g. '/dashboard/[teamId]'
    routeType: context.routeType,       // 'render' | 'route' | 'action' | 'middleware'
    renderSource: context.renderSource, // 'react-server-components' | 'react-server-components-payload' | 'server-rendering'
  });
};
```

Notice the three arguments passed to `onRequestError(err, request, context)`:

1. **`err`**: The caught `Error` instance enhanced with an optional `digest` string—the exact hash sent to client-side `error.tsx` boundaries so you can correlate a user's support ticket with the full server stack trace.
2. **`request`**: Contains the HTTP `path`, `method`, and raw `headers` map.
3. **`context`**: Provides structural Next.js routing metadata (`routerKind`, `routePath`, `routeType`, `renderSource`, and `revalidateReason`) so you can slice error rates by parameterized route pattern (`/products/[slug]`) rather than high-cardinality URLs (`/products/shoe-123`).

## Common Pitfalls

- **Static top-level imports of Node.js SDKs**: Importing `@opentelemetry/sdk-node` at the top of `instrumentation.ts` causes Edge compiler failures when Middleware is present. Always guard imports behind `if (process.env.NEXT_RUNTIME === 'nodejs')` using `await import(...)`.
- **Leaking credentials in `request.headers`**: `request.headers` passed to `onRequestError` contains raw incoming headers including `cookie`, `authorization`, and API keys. Forwarding them unredacted to third-party observability vendors violates security and compliance boundaries.
- **Misplacing `instrumentation.ts`**: Placing `instrumentation.ts` inside `app/` or `pages/` silently prevents Next.js from discovering it. It must live at the project root (or directly inside `src/` when `src/app` is used).

## When to choose it

- Choose `instrumentation.ts` with `register()` and `onRequestError` as the single foundation for OpenTelemetry initialization and server-wide uncaught exception reporting across all App Router and Pages Router endpoints.
- Avoid using `onRequestError` to customize the UI shown to the user—pair it with `app/error.tsx` and `app/global-error.tsx` boundaries, using `err.digest` to link the client fallback UI to the server telemetry event.
