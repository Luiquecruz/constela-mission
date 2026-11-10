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
      // TODO: Verify x-webhook-signature against `sig:${secret}:${rawBody}`,
      // validate { tag, eventId, profile }, call revalidateTag, schedule auditLog in after(),
      // and return { status: 202, body: { revalidated: true, tag, profile } }.
      const rawBody = await request.text();
      const parsed = JSON.parse(rawBody);
      revalidateTag(parsed.tag, 'max');
      return {
        status: 200,
        body: { revalidated: true },
      };
    },
  };
}
