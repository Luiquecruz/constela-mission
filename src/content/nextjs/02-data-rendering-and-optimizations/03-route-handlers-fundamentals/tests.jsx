test('GET /api/notes returns all notes or filters by ?tag= with status 200', async () => {
  const store = [
    { id: 'n-1', title: 'RSC Fetching', tag: 'nextjs', createdAt: '2026-01-01T00:00:00.000Z' },
    { id: 'n-2', title: 'Caching Guide', tag: 'caching', createdAt: '2026-01-02T00:00:00.000Z' },
  ];
  const { GET } = mod.createNotesHandlers(store);

  const allRes = await GET(new Request('https://example.com/api/notes'));
  expect(allRes.status).toBe(200);
  const allJson = await allRes.json();
  expect(allJson.notes).toHaveLength(2);

  const filteredRes = await GET(new Request('https://example.com/api/notes?tag=caching'));
  expect(filteredRes.status).toBe(200);
  const filteredJson = await filteredRes.json();
  expect(filteredJson.notes).toEqual([store[1]]);
});

test('POST /api/notes validates required fields with 400 and rejects malformed JSON', async () => {
  const store = [];
  const { POST } = mod.createNotesHandlers(store);

  const missingTagRes = await POST(
    new Request('https://example.com/api/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Incomplete Note', tag: '   ' }),
    })
  );
  expect(missingTagRes.status).toBe(400);
  const missingBody = await missingTagRes.json();
  expect(missingBody.error).toMatch(/title and tag/i);

  const invalidJsonRes = await POST(
    new Request('https://example.com/api/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{invalid-json',
    })
  );
  expect(invalidJsonRes.status).toBe(400);
  expect(store).toHaveLength(0);
});

test('POST /api/notes persists valid note and returns 201 Created', async () => {
  const store = [];
  const { POST, GET } = mod.createNotesHandlers(store);

  const createRes = await POST(
    new Request('https://example.com/api/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: '  Web Standard Handlers  ', tag: ' api ' }),
    })
  );
  expect(createRes.status).toBe(201);
  const createdJson = await createRes.json();
  expect(createdJson.note.title).toBe('Web Standard Handlers');
  expect(createdJson.note.tag).toBe('api');

  const getRes = await GET(new Request('https://example.com/api/notes?tag=api'));
  const getJson = await getRes.json();
  expect(getJson.notes).toHaveLength(1);
});

test('chooseEndpointMechanism selects server-action for React UI form mutations and route-handler for webhooks/external clients', () => {
  expect(
    mod.chooseEndpointMechanism({
      caller: 'react-ui',
      needsPublicWebhook: false,
      formMutation: true,
    })
  ).toBe('server-action');

  expect(
    mod.chooseEndpointMechanism({
      caller: 'webhook-provider',
      needsPublicWebhook: true,
      formMutation: false,
    })
  ).toBe('route-handler');

  expect(
    mod.chooseEndpointMechanism({
      caller: 'external-client',
      needsPublicWebhook: false,
      formMutation: true,
    })
  ).toBe('route-handler');

  expect(
    mod.chooseEndpointMechanism({
      caller: 'react-ui',
      needsPublicWebhook: false,
      formMutation: false,
    })
  ).toBe('route-handler');
});
