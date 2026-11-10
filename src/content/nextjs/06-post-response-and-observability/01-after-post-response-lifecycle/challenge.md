# Build a Next.js Post-Response Request Executor

In this challenge, you will implement `createRequestExecutor({ waitUntil })`, a runtime harness that models how Next.js manages the `after()` lifecycle, read/write cookie phases, read-only request headers, and control-flow signals like `redirect()` and `notFound()`.

## Requirements

Export `createRequestExecutor({ waitUntil })` which returns `{ runRequest(requestContext, handler) }`.

1. **Request Context & API Surface**:
   - `requestContext` has `{ headers?: Record<string, string>, cookies?: Record<string, string> }`.
   - `runRequest(requestContext, handler)` invokes `await handler(api)` where `api` provides:
     - `after(callback)`: Enqueues a synchronous or async function to run after `handler` settles. Calling `after()` from *inside* an running `after()` callback must also enqueue the nested callback and execute it in FIFO order before `waitUntil` finishes!
     - `cookies`:
       - `get(name)`: Returns the current cookie value (including any mutations made before the response was sent), or `undefined`. Continues to work inside `after()`.
       - `set(name, value)`: Updates the cookie map while `handler` is running. Once `handler` settles (when the response is committed and `after()` begins), calling `cookies.set(...)` MUST throw `new Error('Cookies cannot be modified inside after() after the response has been sent')`.
     - `headers`:
       - `get(name)`: Case-insensitive lookup on `requestContext.headers` (e.g. `headers.get('User-Agent')` matches `'user-agent'`). Continues to work inside `after()`.
     - `redirect(url)`: Immediately throws `{ type: 'REDIRECT', url, status: 307 }`.
     - `notFound()`: Immediately throws `{ type: 'NOT_FOUND', status: 404 }`.

2. **Response Resolution & `waitUntil` Scheduling**:
   - If `handler(api)` resolves normally with `body`, the response object is `{ status: 200, body, cookies: currentCookiesCopy, afterErrors }`.
   - If `handler(api)` throws a redirect signal (`err?.type === 'REDIRECT'`), the response object is `{ status: 307, redirectUrl: err.url, cookies: currentCookiesCopy, afterErrors }`.
   - If `handler(api)` throws a not-found signal (`err?.type === 'NOT_FOUND'`), the response object is `{ status: 404, cookies: currentCookiesCopy, afterErrors }`.
   - If `handler(api)` throws any other error `err`, the response object is `{ status: 500, error: err.message, cookies: currentCookiesCopy, afterErrors }`.
   - Regardless of how `handler` finishes, lock cookie mutations immediately and pass a `Promise` to `waitUntil(promise)` that sequentially runs all queued `after` callbacks (including newly registered nested ones). If any `after` callback throws, catch its error, push `err.message` into the `afterErrors: string[]` array on the response, and continue running remaining `after` callbacks.
   - Return the response object from `runRequest` immediately after calling `waitUntil(promise)` (do not wait for `waitUntil` unless the caller awaits the promise passed to `waitUntil`).
