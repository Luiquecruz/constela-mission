# Build a Signed Catalog Webhook Route Handler

In this challenge, you will implement `createCatalogWebhookHandler({ secret, revalidateTag, after, auditLog })`, which returns an async `POST(request)` Route Handler that verifies webhook signatures, invalidates tagged cache entries with `revalidateTag(tag, profile)`, and schedules audit logging via `after()`.

## Requirements

Export `createCatalogWebhookHandler({ secret, revalidateTag, after, auditLog })` returning `{ POST }`:

1. **Signature Verification (`401`)**:
   - Read the signature header via `request.headers.get('x-webhook-signature')` (or case-insensitive lookup if `request.headers` is a plain object or Map/Headers-like interface) and the raw body via `await request.text()`.
   - Expected signature format: `` `sig:${secret}:${rawBody}` ``.
   - If the header is missing or does not match `` `sig:${secret}:${rawBody}` ``, return `{ status: 401, body: { error: 'Invalid signature' } }` without calling `revalidateTag` or `after`.

2. **Payload Validation (`400`)**:
   - Parse `rawBody` as JSON (`{ tag?: string; profile?: string; eventId?: string }`).
   - If JSON parsing fails, or if `tag` or `eventId` is missing/empty, return `{ status: 400, body: { error: 'Missing required fields' } }` without calling `revalidateTag` or `after`.

3. **Cache Revalidation & Post-Response Audit (`202`)**:
   - Resolve `const resolvedProfile = profile || 'max'`.
   - Call `revalidateTag(tag, resolvedProfile)`.
   - Schedule an `after()` callback:
     ```ts
     after(async () => {
       await auditLog({ eventId, tag, profile: resolvedProfile });
     });
     ```
   - Return `{ status: 202, body: { revalidated: true, tag, profile: resolvedProfile } }`.
