export interface WebhookRequest {
  headers: {
    get?: (name: string) => string | null | undefined;
    [key: string]: unknown;
  };
  text: () => Promise<string>;
}

export interface CatalogWebhookDeps {
  secret: string;
  revalidateTag: (tag: string, profile: string) => void;
  after: (callback: () => unknown | Promise<unknown>) => void;
  auditLog: (entry: {
    eventId: string;
    tag: string;
    profile: string;
  }) => unknown | Promise<unknown>;
}

export function createCatalogWebhookHandler({
  secret,
  revalidateTag,
  after,
  auditLog,
}: CatalogWebhookDeps) {
  return {
    async POST(request: WebhookRequest) {
      const rawBody = await request.text();
      const signature =
        typeof request.headers?.get === 'function'
          ? request.headers.get('x-webhook-signature')
          : (request.headers?.['x-webhook-signature'] as string | undefined);

      const expectedSignature = `sig:${secret}:${rawBody}`;
      if (!signature || signature !== expectedSignature) {
        return {
          status: 401,
          body: { error: 'Invalid signature' },
        };
      }

      let payload: { tag?: string; profile?: string; eventId?: string };
      try {
        payload = JSON.parse(rawBody);
      } catch {
        return {
          status: 400,
          body: { error: 'Missing required fields' },
        };
      }

      if (!payload || !payload.tag || !payload.eventId) {
        return {
          status: 400,
          body: { error: 'Missing required fields' },
        };
      }

      const resolvedProfile = payload.profile || 'max';
      const { tag, eventId } = payload;

      revalidateTag(tag, resolvedProfile);

      after(async () => {
        await auditLog({
          eventId,
          tag,
          profile: resolvedProfile,
        });
      });

      return {
        status: 202,
        body: {
          revalidated: true,
          tag,
          profile: resolvedProfile,
        },
      };
    },
  };
}
