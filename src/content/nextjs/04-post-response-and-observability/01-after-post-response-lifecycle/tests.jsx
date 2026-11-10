test('runs after() callbacks in order including nested after() registrations and preserves read access to headers and cookies', async () => {
  let backgroundPromise;
  const executor = mod.createRequestExecutor({
    waitUntil: (p) => {
      backgroundPromise = p;
    },
  });

  const events = [];
  const res = await executor.runRequest(
    {
      headers: { 'User-Agent': 'ConstelaBot/1.0' },
      cookies: { session: 'abc-123' },
    },
    async (api) => {
      api.cookies.set('last_step', 'checkout');
      api.after(async () => {
        events.push(`first:${api.headers.get('user-agent')}:${api.cookies.get('last_step')}`);
        api.after(() => {
          events.push(`nested:${api.cookies.get('session')}`);
        });
      });
      api.after(() => {
        events.push('second');
      });
      events.push('handler-done');
      return { ok: true };
    }
  );

  expect(res.status).toBe(200);
  expect(res.body).toEqual({ ok: true });
  expect(res.cookies).toEqual({ session: 'abc-123', last_step: 'checkout' });

  await backgroundPromise;
  expect(events).toEqual([
    'handler-done',
    'first:ConstelaBot/1.0:checkout',
    'second',
    'nested:abc-123',
  ]);
});

test('still executes after() callbacks when handler calls redirect() or notFound()', async () => {
  const backgroundTasks = [];
  const executor = mod.createRequestExecutor({
    waitUntil: (p) => backgroundTasks.push(p),
  });

  const auditTrail = [];

  const redirectRes = await executor.runRequest({}, async (api) => {
    api.cookies.set('flash', 'redirecting');
    api.after(() => {
      auditTrail.push(`redirected:${api.cookies.get('flash')}`);
    });
    api.redirect('/orders/42');
  });

  const notFoundRes = await executor.runRequest({}, async (api) => {
    api.after(() => {
      auditTrail.push('missing-resource');
    });
    api.notFound();
  });

  await Promise.all(backgroundTasks);

  expect(redirectRes.status).toBe(307);
  expect(redirectRes.redirectUrl).toBe('/orders/42');
  expect(notFoundRes.status).toBe(404);
  expect(auditTrail).toEqual(['redirected:redirecting', 'missing-resource']);
});

test('still executes after() when handler throws an unhandled error and returns 500', async () => {
  let backgroundPromise;
  const executor = mod.createRequestExecutor({
    waitUntil: (p) => {
      backgroundPromise = p;
    },
  });

  const logs = [];
  const res = await executor.runRequest({}, async (api) => {
    api.after(() => {
      logs.push('cleanup-after-crash');
    });
    throw new Error('Database connection lost');
  });

  await backgroundPromise;
  expect(res.status).toBe(500);
  expect(res.error).toBe('Database connection lost');
  expect(logs).toEqual(['cleanup-after-crash']);
});

test('throws when attempting to mutate cookies inside after() and captures afterErrors without aborting remaining callbacks', async () => {
  let backgroundPromise;
  const executor = mod.createRequestExecutor({
    waitUntil: (p) => {
      backgroundPromise = p;
    },
  });

  let finalCallbackRan = false;
  const res = await executor.runRequest(
    { cookies: { theme: 'light' } },
    async (api) => {
      api.after(() => {
        api.cookies.set('theme', 'dark');
      });
      api.after(() => {
        finalCallbackRan = true;
      });
      return 'rendered';
    }
  );

  await backgroundPromise;
  expect(res.status).toBe(200);
  expect(res.cookies).toEqual({ theme: 'light' });
  expect(res.afterErrors).toEqual([
    'Cookies cannot be modified inside after() after the response has been sent',
  ]);
  expect(finalCallbackRan).toBe(true);
});
