## Step-by-Step Approach

1. **Initialize Request State**: Inside `runRequest(requestContext, handler)`, clone `requestContext.cookies` into a local object (`cookieStore`), normalize `requestContext.headers` keys to lowercase for case-insensitive lookup, and create `afterQueue: Array<() => unknown | Promise<unknown>> = []`, `afterErrors: string[] = []`, and `let responseSent = false`.
2. **Build the Request API**:
   - `after(cb)` pushes `cb` onto `afterQueue`.
   - `cookies.get(name)` reads `cookieStore[name]`.
   - `cookies.set(name, value)` throws `new Error('Cookies cannot be modified inside after() after the response has been sent')` when `responseSent` is `true`, and otherwise sets `cookieStore[name] = value`.
   - `headers.get(name)` looks up `normalizedHeaders[name.toLowerCase()]`.
   - `redirect(url)` throws `{ type: 'REDIRECT', url, status: 307 }`.
   - `notFound()` throws `{ type: 'NOT_FOUND', status: 404 }`.
3. **Execute the Handler and Capture Control-Flow Signals**:
   - Run `const body = await handler(api)` inside a `try / catch / finally` block.
   - Map normal completion to `{ status: 200, body, cookies: { ...cookieStore }, afterErrors }`, `REDIRECT` to `{ status: 307, redirectUrl: err.url, cookies: { ...cookieStore }, afterErrors }`, `NOT_FOUND` to `{ status: 404, cookies: { ...cookieStore }, afterErrors }`, and any other error to `{ status: 500, error: err.message, cookies: { ...cookieStore }, afterErrors }`.
   - In `finally`, set `responseSent = true`.
4. **Drain the `after()` Queue via `waitUntil`**:
   - Create an async task `const drainPromise = (async () => { for (let i = 0; i < afterQueue.length; i++) { try { await afterQueue[i](); } catch (e) { afterErrors.push(e.message); } } })()`.
   - Call `waitUntil(drainPromise)` and return the response object.
