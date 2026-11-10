# Route Handlers, Streaming Responses and Webhook Pipelines

Route Handlers (`app/api/.../route.ts`) give you full low-level control over HTTP endpoints inside the App Router using standard Web Platform `Request` and `Response` APIs. While Server Actions are purpose-built for client-initiated UI mutations, Route Handlers are the boundary for external webhooks, custom streaming responses, third-party OAuth callbacks, and public HTTP integrations.

## Uncached by Default

In modern Next.js (`15+`), `GET` Route Handlers are **uncached by default**. Every incoming `GET`, `POST`, `PUT`, `PATCH`, or `DELETE` request executes dynamically unless you explicitly opt into static behavior (for example with `export const dynamic = 'force-static'` or inside a `use cache` boundary). This eliminates a subtle class of bugs where webhook verification endpoints, health checks, or token generators accidentally served stale build-time snapshots.

## Secure Webhook Verification & Cache Invalidation

When an external system (such as a headless CMS, Stripe, or an inventory service) sends a `POST` webhook to invalidate cached catalog data, your Route Handler must follow a strict pipeline:

1. **Read the raw body (`await request.text()`) and verify the cryptographic signature** before trusting any payload field.
2. **Parse and validate the payload** after the signature check succeeds.
3. **Trigger cache invalidation** with `revalidateTag(tag, 'max')`, which marks tagged cache entries stale so subsequent requests serve fresh data using stale-while-revalidate semantics.
4. **Offload non-blocking telemetry or audit persistence to `after()`** so the webhook sender receives a fast `202 Accepted` response without waiting on secondary database writes.

```ts
// app/api/webhooks/catalog/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { after } from 'next/server';
import { revalidateTag } from 'next/cache';
import { verifyHmacSignature } from '@/lib/crypto';
import { recordWebhookAudit } from '@/lib/audit';

export async function POST(request: NextRequest) {
  const signature = request.headers.get('x-webhook-signature');
  const rawBody = await request.text();

  if (!signature || !verifyHmacSignature(rawBody, signature, process.env.WEBHOOK_SECRET!)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  const payload = JSON.parse(rawBody) as {
    eventId?: string;
    tag?: string;
    profile?: 'max';
  };

  if (!payload.tag || !payload.eventId) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const profile = payload.profile || 'max';
  revalidateTag(payload.tag, profile);

  after(async () => {
    await recordWebhookAudit({
      eventId: payload.eventId!,
      tag: payload.tag!,
      profile,
    });
  });

  return NextResponse.json(
    { revalidated: true, tag: payload.tag, profile },
    { status: 202 }
  );
}
```

## Streaming Responses with `ReadableStream`

Because Route Handlers return standard `Response` instances, you can stream incremental output—such as Server-Sent Events (SSE), large CSV exports, or AI token streams—by passing a Web `ReadableStream` directly to `new Response(stream, { headers })` and listening to `request.signal` to clean up resources if the client disconnects early.

## Common Pitfalls

- **Calling `request.json()` before verifying the webhook signature**: Signature verification algorithms compute an HMAC over the exact raw byte string (`await request.text()`). Re-serializing a parsed JSON object with `JSON.stringify()` can change key ordering or whitespace and cause valid signatures to fail.
- **Invalidating cache tags before authenticating the request**: Running `revalidateTag()` before verifying `x-webhook-signature` allows anyone who discovers the endpoint URL to trigger cache stampedes and denial-of-wallet attacks against your origin database.
- **Blocking webhook acknowledgement on slow audit writes**: Webhook providers enforce strict response timeouts (often 3 to 5 seconds) and retry aggressively on timeouts. Use `after()` for non-critical audit logging so the handler returns immediately.

## When to choose it

- Choose Route Handlers (`route.ts`) for incoming third-party webhooks, public REST endpoints consumed by non-Next.js clients, OAuth redirect targets, and custom `ReadableStream` responses.
- Prefer Server Actions over Route Handlers when triggering mutations directly from your own React components, since Server Actions integrate natively with `useActionState`, progressive enhancement, and immediate router cache updates via `updateTag()`.
