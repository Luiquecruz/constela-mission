function makeRequest(rawBody, signature) {
  return {
    headers: {
      get(name) {
        if (name.toLowerCase() === 'x-webhook-signature') {
          return signature ?? null;
        }
        return null;
      },
    },
    async text() {
      return rawBody;
    },
  };
}

test('rejects requests with missing or invalid signature with 401 before touching cache or audit log', async () => {
  const revalidated = [];
  const afterCallbacks = [];
  const audits = [];

  const { POST } = mod.createCatalogWebhookHandler({
    secret: 'whsec_test',
    revalidateTag: (tag, profile) => revalidated.push({ tag, profile }),
    after: (cb) => afterCallbacks.push(cb),
    auditLog: (entry) => audits.push(entry),
  });

  const body = JSON.stringify({ eventId: 'evt_1', tag: 'catalog-items' });
  const resMissing = await POST(makeRequest(body, undefined));
  const resWrong = await POST(makeRequest(body, 'sig:wrong:body'));

  expect(resMissing).toEqual({
    status: 401,
    body: { error: 'Invalid signature' },
  });
  expect(resWrong).toEqual({
    status: 401,
    body: { error: 'Invalid signature' },
  });
  expect(revalidated).toHaveLength(0);
  expect(afterCallbacks).toHaveLength(0);
  expect(audits).toHaveLength(0);
});

test('returns 400 when signed payload is missing tag or eventId', async () => {
  const revalidated = [];
  const afterCallbacks = [];

  const { POST } = mod.createCatalogWebhookHandler({
    secret: 'whsec_test',
    revalidateTag: (tag, profile) => revalidated.push({ tag, profile }),
    after: (cb) => afterCallbacks.push(cb),
    auditLog: () => {},
  });

  const missingTagBody = JSON.stringify({ eventId: 'evt_2' });
  const res1 = await POST(
    makeRequest(missingTagBody, `sig:whsec_test:${missingTagBody}`)
  );

  const missingEventBody = JSON.stringify({ tag: 'products' });
  const res2 = await POST(
    makeRequest(missingEventBody, `sig:whsec_test:${missingEventBody}`)
  );

  expect(res1).toEqual({
    status: 400,
    body: { error: 'Missing required fields' },
  });
  expect(res2).toEqual({
    status: 400,
    body: { error: 'Missing required fields' },
  });
  expect(revalidated).toHaveLength(0);
  expect(afterCallbacks).toHaveLength(0);
});

test('revalidates tag with default max profile and schedules auditLog via after()', async () => {
  const revalidated = [];
  const afterCallbacks = [];
  const audits = [];

  const { POST } = mod.createCatalogWebhookHandler({
    secret: 'whsec_live',
    revalidateTag: (tag, profile) => revalidated.push({ tag, profile }),
    after: (cb) => afterCallbacks.push(cb),
    auditLog: async (entry) => {
      audits.push(entry);
    },
  });

  const rawBody = JSON.stringify({
    eventId: 'evt_100',
    tag: 'featured-products',
  });
  const res = await POST(
    makeRequest(rawBody, `sig:whsec_live:${rawBody}`)
  );

  expect(res).toEqual({
    status: 202,
    body: {
      revalidated: true,
      tag: 'featured-products',
      profile: 'max',
    },
  });
  expect(revalidated).toEqual([{ tag: 'featured-products', profile: 'max' }]);
  expect(afterCallbacks).toHaveLength(1);
  expect(audits).toHaveLength(0);

  await afterCallbacks[0]();
  expect(audits).toEqual([
    {
      eventId: 'evt_100',
      tag: 'featured-products',
      profile: 'max',
    },
  ]);
});

test('forwards custom revalidation profile when provided in the webhook payload', async () => {
  const revalidated = [];
  const afterCallbacks = [];
  const audits = [];

  const { POST } = mod.createCatalogWebhookHandler({
    secret: 'whsec_live',
    revalidateTag: (tag, profile) => revalidated.push({ tag, profile }),
    after: (cb) => afterCallbacks.push(cb),
    auditLog: async (entry) => {
      audits.push(entry);
    },
  });

  const rawBody = JSON.stringify({
    eventId: 'evt_200',
    tag: 'pricing-tiers',
    profile: 'hours',
  });
  const res = await POST(
    makeRequest(rawBody, `sig:whsec_live:${rawBody}`)
  );

  expect(res).toEqual({
    status: 202,
    body: {
      revalidated: true,
      tag: 'pricing-tiers',
      profile: 'hours',
    },
  });
  expect(revalidated).toEqual([{ tag: 'pricing-tiers', profile: 'hours' }]);
  await afterCallbacks[0]();
  expect(audits[0]).toEqual({
    eventId: 'evt_200',
    tag: 'pricing-tiers',
    profile: 'hours',
  });
});
