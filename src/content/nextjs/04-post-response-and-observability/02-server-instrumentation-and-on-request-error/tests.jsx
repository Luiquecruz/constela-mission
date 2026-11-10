test('register() selects node-otel for nodejs runtime and initializes exporter only once', async () => {
  const initCalls = [];
  const inst = mod.createInstrumentation({
    runtime: 'nodejs',
    exporter: {
      init: (cfg) => initCalls.push(cfg),
      captureError: () => {},
    },
  });

  const first = await inst.register();
  const second = await inst.register();

  expect(first).toEqual({ runtime: 'nodejs', sdkKind: 'node-otel' });
  expect(second).toEqual({ runtime: 'nodejs', sdkKind: 'node-otel' });
  expect(initCalls).toHaveLength(1);
  expect(initCalls[0]).toEqual({ runtime: 'nodejs', sdkKind: 'node-otel' });
});

test('register() selects edge-lightweight when runtime is edge', async () => {
  const initCalls = [];
  const inst = mod.createInstrumentation({
    runtime: 'edge',
    exporter: {
      init: (cfg) => initCalls.push(cfg),
      captureError: () => {},
    },
  });

  const result = await inst.register();
  expect(result).toEqual({ runtime: 'edge', sdkKind: 'edge-lightweight' });
  expect(initCalls).toEqual([{ runtime: 'edge', sdkKind: 'edge-lightweight' }]);
});

test('onRequestError() lowercases headers and redacts authorization, cookie, and x-api-key', async () => {
  const captured = [];
  const inst = mod.createInstrumentation({
    runtime: 'nodejs',
    exporter: {
      init: () => {},
      captureError: (payload) => captured.push(payload),
    },
  });

  const error = Object.assign(new Error('Failed to load invoice'), {
    digest: 'NEXT_ERR_9921',
  });

  await inst.onRequestError(
    error,
    {
      method: 'POST',
      path: '/invoices/9921',
      headers: {
        Authorization: 'Bearer test-token',
        Cookie: 'session_id=demo',
        'X-Api-Key': 'demo',
        'X-Request-Id': 'req-abc',
        'User-Agent': 'Mozilla/5.0',
      },
    },
    {
      routerKind: 'App Router',
      routePath: '/invoices/[id]',
      routeType: 'action',
      renderSource: 'react-server-components-payload',
    }
  );

  expect(captured).toHaveLength(1);
  expect(captured[0]).toEqual({
    message: 'Failed to load invoice',
    digest: 'NEXT_ERR_9921',
    method: 'POST',
    path: '/invoices/9921',
    headers: {
      authorization: '[REDACTED]',
      cookie: '[REDACTED]',
      'x-api-key': '[REDACTED]',
      'x-request-id': 'req-abc',
      'user-agent': 'Mozilla/5.0',
    },
    routerKind: 'App Router',
    routePath: '/invoices/[id]',
    routeType: 'action',
    renderSource: 'react-server-components-payload',
  });
});

test('onRequestError() defaults missing digest to unknown and missing renderSource to server-rendering', async () => {
  const captured = [];
  const inst = mod.createInstrumentation({
    runtime: 'nodejs',
    exporter: {
      init: () => {},
      captureError: (payload) => captured.push(payload),
    },
  });

  const plainError = new Error('Unhandled route crash');

  await inst.onRequestError(
    plainError,
    {
      method: 'GET',
      path: '/api/health',
      headers: { Accept: 'application/json' },
    },
    {
      routerKind: 'App Router',
      routePath: '/api/health',
      routeType: 'route',
    }
  );

  expect(captured[0].digest).toBe('unknown');
  expect(captured[0].renderSource).toBe('server-rendering');
  expect(captured[0].headers).toEqual({ accept: 'application/json' });
});
