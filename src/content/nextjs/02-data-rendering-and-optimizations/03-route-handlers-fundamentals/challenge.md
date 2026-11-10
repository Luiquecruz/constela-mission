# Challenge: Notes Route Handler and Endpoint Mechanism Selector

You are implementing a Web-standard Next.js Route Handler for `/api/notes` (`GET` and `POST`) alongside an architectural helper that chooses between a Route Handler and a Server Action.

## Requirements

1. **`createNotesHandlers(store)`**:
   - Accept an initial array `store: NoteItem[]` (`{ id: string, title: string, tag: string, createdAt: string }`).
   - Return `{ GET, POST }`:
     - **`GET(request)`**:
       - Parse `new URL(request.url).searchParams.get('tag')`.
       - If a non-empty `tag` query parameter is present, filter `store` to notes whose `tag` matches (case-sensitive trimmed match). Otherwise return all notes in `store`.
       - Return `Response.json({ notes }, { status: 200 })`.
     - **`POST(request)`**:
       - Parse `await request.json()`. If JSON parsing fails, return `Response.json({ error: 'Invalid JSON body' }, { status: 400 })`.
       - Validate that `title` and `tag` are both non-empty strings after `.trim()`. If either is missing or blank, return `Response.json({ error: 'title and tag are required' }, { status: 400 })`.
       - Append the new note (`{ id, title: title.trim(), tag: tag.trim(), createdAt }`) to `store` and return `Response.json({ note: created }, { status: 201 })`.

2. **`chooseEndpointMechanism({ caller, needsPublicWebhook, formMutation })`**:
   - Accept `{ caller: 'react-ui' | 'external-client' | 'webhook-provider', needsPublicWebhook: boolean, formMutation: boolean }`.
   - Return `'route-handler' | 'server-action'`:
     - Return `'route-handler'` whenever `needsPublicWebhook` is `true`, or `caller !== 'react-ui'` (external clients or webhook providers), or when `formMutation` is `false`.
     - Return `'server-action'` when `caller === 'react-ui'`, `needsPublicWebhook === false`, and `formMutation === true`.
