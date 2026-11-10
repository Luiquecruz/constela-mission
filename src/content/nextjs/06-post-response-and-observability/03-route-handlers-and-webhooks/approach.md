## Step-by-Step Approach

1. **Extract Raw Body and Signature**:
   - Inside `async POST(request)`, call `const rawBody = await request.text()`.
   - Read `const signature = typeof request.headers?.get === 'function' ? request.headers.get('x-webhook-signature') : request.headers?.['x-webhook-signature']`.
   - If `!signature || signature !== \`sig:\${secret}:\${rawBody}\``, return `{ status: 401, body: { error: 'Invalid signature' } }`.
2. **Parse and Validate Payload**:
   - Parse `rawBody` with `JSON.parse(rawBody)`.
   - Check that both `payload.tag` and `payload.eventId` are truthy strings; otherwise return `{ status: 400, body: { error: 'Missing required fields' } }`.
3. **Revalidate Cache Tag and Schedule Post-Response Audit**:
   - Default `const resolvedProfile = payload.profile || 'max'`.
   - Invoke `revalidateTag(payload.tag, resolvedProfile)`.
   - Invoke `after(async () => { await auditLog({ eventId: payload.eventId, tag: payload.tag, profile: resolvedProfile }); })`.
4. **Return 202 Accepted**:
   - Return `{ status: 202, body: { revalidated: true, tag: payload.tag, profile: resolvedProfile } }`.
