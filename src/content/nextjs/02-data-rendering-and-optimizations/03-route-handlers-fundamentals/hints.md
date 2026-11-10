Inside `GET(request)`, construct `const url = new URL(request.url)` and read `url.searchParams.get('tag')?.trim()` before filtering `store`.
---
Inside `POST(request)`, wrap `await request.json()` in a `try/catch` so invalid JSON returns status `400`, then check `typeof body?.title === 'string' && body.title.trim().length > 0` and the same for `body?.tag`.
---
In `chooseEndpointMechanism`, only React UI form mutations that do not need a public webhook should return `'server-action'`; external callers, webhooks, and non-form HTTP APIs return `'route-handler'`.
