Track a boolean flag like `let responseSent = false` inside `runRequest`. In `cookies.set(name, value)`, check `if (responseSent)` and throw `new Error('Cookies cannot be modified inside after() after the response has been sent')`. Set `responseSent = true` inside a `finally` block right after `await handler(api)`.
---
For `redirect(url)` and `notFound()`, throw plain objects `{ type: 'REDIRECT', url, status: 307 }` and `{ type: 'NOT_FOUND', status: 404 }` respectively. In the `catch (err)` block around `await handler(api)`, inspect `err?.type` to construct the `307`, `404`, or `500` response object.
---
To support nested `after()` calls, store callbacks in an array `const afterQueue = []` and drain it using an index-based `while (index < afterQueue.length)` loop inside an async IIFE passed to `waitUntil(...)`. Wrap each `await callback()` in `try / catch` and push `err.message` to `afterErrors`.
