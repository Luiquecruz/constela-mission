Read `const rawBody = await request.text()` first, and retrieve the signature using `typeof request.headers.get === 'function' ? request.headers.get('x-webhook-signature') : request.headers['x-webhook-signature']`. Compare it strictly against `` `sig:${secret}:${rawBody}` ``.
---
Wrap `JSON.parse(rawBody)` in a `try / catch` block. After parsing `{ tag, profile, eventId }`, verify `if (!tag || !eventId)` and return `{ status: 400, body: { error: 'Missing required fields' } }` when either field is missing.
---
Compute `const resolvedProfile = profile || 'max'`. Call `revalidateTag(tag, resolvedProfile)`, then pass an async function `async () => { await auditLog({ eventId, tag, profile: resolvedProfile }); }` to `after(...)`, and return `{ status: 202, body: { revalidated: true, tag, profile: resolvedProfile } }`.
