Maintain a `let initialized = false` flag inside `createInstrumentation`. Compute `const sdkKind = runtime === 'nodejs' ? 'node-otel' : 'edge-lightweight'`. Inside `register()`, only call `await exporter.init({ runtime, sdkKind })` when `!initialized`, then set `initialized = true`.
---
Create a `Set(['authorization', 'cookie', 'x-api-key'])` for sensitive header names. Iterate over `Object.entries(request.headers ?? {})`, lowercase each key with `key.toLowerCase()`, and check whether the lowercased key is in the sensitive set.
---
Use nullish coalescing (`??`) for optional properties on `err` and `context`: `digest: err.digest ?? 'unknown'` and `renderSource: context.renderSource ?? 'server-rendering'`. Pass the assembled payload object to `await exporter.captureError(payload)`.
