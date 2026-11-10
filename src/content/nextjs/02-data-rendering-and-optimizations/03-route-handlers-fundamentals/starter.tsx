export interface NoteItem {
  id: string;
  title: string;
  tag: string;
  createdAt: string;
}

export interface EndpointDecisionInput {
  caller: 'react-ui' | 'external-client' | 'webhook-provider';
  needsPublicWebhook: boolean;
  formMutation: boolean;
}

// TODO 1: Implement GET (?tag= filtering, status 200) and POST (validation -> 400, created -> 201)
export function createNotesHandlers(store: NoteItem[]) {
  async function GET(request: Request): Promise<Response> {
    // BUG: Ignores ?tag= query parameter
    void request;
    return Response.json({ notes: store }, { status: 200 });
  }

  async function POST(request: Request): Promise<Response> {
    // BUG: Skips JSON error handling and required field validation, and returns 200 instead of 201
    const body = (await request.json()) as Partial<NoteItem>;
    const created: NoteItem = {
      id: `note-${store.length + 1}`,
      title: String(body.title ?? ''),
      tag: String(body.tag ?? ''),
      createdAt: new Date().toISOString(),
    };
    store.push(created);
    return Response.json({ note: created }, { status: 200 });
  }

  return { GET, POST };
}

// TODO 2: Return 'route-handler' or 'server-action' based on caller, webhook, and formMutation
export function chooseEndpointMechanism(
  input: EndpointDecisionInput
): 'route-handler' | 'server-action' {
  // BUG: Always returns 'route-handler'
  void input;
  return 'route-handler';
}
