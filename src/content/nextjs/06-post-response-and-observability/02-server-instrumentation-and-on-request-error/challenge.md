# Implement Server Instrumentation and Error Redaction

In this challenge, you will implement `createInstrumentation({ runtime, exporter })` to model Next.js's `instrumentation.ts` module with idempotent runtime-aware `register()` initialization and a privacy-safe `onRequestError(err, request, context)` hook.

## Requirements

Export `createInstrumentation({ runtime, exporter })` returning `{ register, onRequestError }`:

1. **`register()`**:
   - Branches on `runtime` (`'nodejs'` vs `'edge'`):
     - When `runtime === 'nodejs'`, sets `sdkKind: 'node-otel'`.
     - Otherwise, sets `sdkKind: 'edge-lightweight'`.
   - Calls `await exporter.init({ runtime, sdkKind })` **at most once** per instrumentation instance (calling `register()` multiple times must be idempotent and return the initial registration info `{ runtime, sdkKind }` without calling `exporter.init` again).

2. **`onRequestError(err, request, context)`**:
   - Normalizes all header keys from `request.headers` to lowercase.
   - Replaces the values of `'authorization'`, `'cookie'`, and `'x-api-key'` (case-insensitive on the incoming key) with `'[REDACTED]'`, while preserving all other header values.
   - Calls `await exporter.captureError(payload)` and returns `payload`, where `payload` has the exact shape:
     - `message`: `err.message`
     - `digest`: `err.digest ?? 'unknown'`
     - `method`: `request.method`
     - `path`: `request.path`
     - `headers`: the normalized and redacted headers object
     - `routerKind`: `context.routerKind`
     - `routePath`: `context.routePath`
     - `routeType`: `context.routeType`
     - `renderSource`: `context.renderSource ?? 'server-rendering'`
