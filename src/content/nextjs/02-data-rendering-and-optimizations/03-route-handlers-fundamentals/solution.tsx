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

export function createNotesHandlers(store: NoteItem[]) {
  async function GET(request: Request): Promise<Response> {
    const { searchParams } = new URL(request.url);
    const tag = searchParams.get('tag')?.trim() ?? '';

    const notes = tag
      ? store.filter((note) => note.tag === tag)
      : [...store];

    return Response.json({ notes }, { status: 200 });
  }

  async function POST(request: Request): Promise<Response> {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const record =
      body && typeof body === 'object' ? (body as Record<string, unknown>) : {};
    const title = typeof record.title === 'string' ? record.title.trim() : '';
    const tag = typeof record.tag === 'string' ? record.tag.trim() : '';

    if (!title || !tag) {
      return Response.json(
        { error: 'title and tag are required' },
        { status: 400 }
      );
    }

    const created: NoteItem = {
      id: `note-${store.length + 1}`,
      title,
      tag,
      createdAt: new Date().toISOString(),
    };
    store.push(created);

    return Response.json({ note: created }, { status: 201 });
  }

  return { GET, POST };
}

export function chooseEndpointMechanism({
  caller,
  needsPublicWebhook,
  formMutation,
}: EndpointDecisionInput): 'route-handler' | 'server-action' {
  if (needsPublicWebhook || caller !== 'react-ui') {
    return 'route-handler';
  }
  return formMutation ? 'server-action' : 'route-handler';
}
