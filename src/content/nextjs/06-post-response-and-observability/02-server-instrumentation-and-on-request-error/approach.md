## Step-by-Step Approach

1. **Track Registration State**: Inside `createInstrumentation({ runtime, exporter })`, declare `let isRegistered = false` and derive `const sdkKind = runtime === 'nodejs' ? 'node-otel' : 'edge-lightweight'`.
2. **Implement Idempotent `register()`**:
   - Check `if (!isRegistered)`. When false, set `isRegistered = true` and call `await exporter.init({ runtime, sdkKind })`.
   - Return `{ runtime, sdkKind }`.
3. **Sanitize Incoming Headers in `onRequestError`**:
   - Define `const SENSITIVE_HEADERS = new Set(['authorization', 'cookie', 'x-api-key'])`.
   - Build `headers: Record<string, string> = {}` by looping over `Object.entries(request.headers ?? {})`, converting each key to `const lower = key.toLowerCase()`, and assigning `SENSITIVE_HEADERS.has(lower) ? '[REDACTED]' : value`.
4. **Construct and Export Error Payload**:
   - Assemble `{ message: err.message, digest: err.digest ?? 'unknown', method: request.method, path: request.path, headers, routerKind: context.routerKind, routePath: context.routePath, routeType: context.routeType, renderSource: context.renderSource ?? 'server-rendering' }`.
   - Await `exporter.captureError(payload)` and return `payload`.
