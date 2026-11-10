test('skips static assets without injecting synthetic headers', () => {
  const originalHeaders = { accept: '*/*' };
  const nextChunk = mod.proxy({
    pathname: '/_next/static/chunks/main.js',
    host: 'acme.app.local',
    cookies: {},
    headers: originalHeaders,
  });

  expect(nextChunk).toEqual({
    action: 'next',
    headers: originalHeaders,
  });

  const favicon = mod.proxy({
    pathname: '/favicon.ico',
    host: 'www.app.local',
    cookies: {},
    headers: originalHeaders,
  });

  expect(favicon).toEqual({
    action: 'next',
    headers: originalHeaders,
  });
});

test('injects x-request-id while preserving existing correlation header when present', () => {
  const generated = mod.proxy({
    pathname: '/pricing',
    host: 'www.app.local',
    cookies: {},
    headers: {},
  });

  expect(generated.action).toBe('next');
  expect(generated.headers['x-request-id']).toBe('req-generated');

  const preserved = mod.proxy({
    pathname: '/pricing',
    host: 'www.app.local',
    cookies: {},
    headers: { 'x-request-id': 'trace-99' },
  });

  expect(preserved.headers['x-request-id']).toBe('trace-99');
});

test('redirects unauthenticated /dashboard requests with status 307 and encoded from query', () => {
  const res = mod.proxy({
    pathname: '/dashboard/billing',
    host: 'www.app.local',
    cookies: {},
    headers: {},
  });

  expect(res).toEqual({
    action: 'redirect',
    destination: '/login?from=%2Fdashboard%2Fbilling',
    status: 307,
    headers: { 'x-request-id': 'req-generated' },
  });
});

test('rewrites tenant subdomains to /tenants/<tenant> and attaches x-tenant header', () => {
  const rootRewrite = mod.proxy({
    pathname: '/',
    host: 'acme.app.local',
    cookies: { session: 'tok-1' },
    headers: {},
  });

  expect(rootRewrite).toEqual({
    action: 'rewrite',
    destination: '/tenants/acme',
    headers: {
      'x-request-id': 'req-generated',
      'x-tenant': 'acme',
    },
  });

  const nestedRewrite = mod.proxy({
    pathname: '/dashboard/settings',
    host: 'acme.app.local',
    cookies: { session: 'tok-1' },
    headers: { 'x-request-id': 'req-7' },
  });

  expect(nestedRewrite).toEqual({
    action: 'rewrite',
    destination: '/tenants/acme/dashboard/settings',
    headers: {
      'x-request-id': 'req-7',
      'x-tenant': 'acme',
    },
  });
});

test('enforces defense-in-depth authorization in authorizeTenantMutation', async () => {
  const missingErr = await captureError(() => {
    mod.authorizeTenantMutation(null, 'acme');
  });
  expect(missingErr && missingErr.message).toBe('Unauthorized: missing session');

  const wrongTenantErr = await captureError(() => {
    mod.authorizeTenantMutation(
      { userId: 'u1', tenant: 'globex', role: 'admin' },
      'acme'
    );
  });
  expect(wrongTenantErr && wrongTenantErr.message).toBe(
    'Forbidden: role or tenant mismatch'
  );

  const memberRoleErr = await captureError(() => {
    mod.authorizeTenantMutation(
      { userId: 'u1', tenant: 'acme', role: 'member' },
      'acme'
    );
  });
  expect(memberRoleErr && memberRoleErr.message).toBe(
    'Forbidden: role or tenant mismatch'
  );

  const ok = mod.authorizeTenantMutation(
    { userId: 'u-admin', tenant: 'acme', role: 'admin' },
    'acme'
  );
  expect(ok).toEqual({ allowed: true, actor: 'u-admin' });
});
