test('resolves params, searchParams, cookies, and headers Promises', async () => {
  const result = await mod.resolveTenantContext({
    params: Promise.resolve({ tenant: 'acme' }),
    searchParams: Promise.resolve({ view: 'billing', page: '4' }),
    cookies: async () => ({
      get: (name) => (name === 'theme' ? { value: 'dark' } : undefined),
    }),
    headers: async () => ({
      get: (name) => (name === 'user-agent' ? 'Mozilla/5.0' : null),
    }),
  });

  expect(result).toEqual({
    tenant: 'acme',
    view: 'billing',
    page: 4,
    theme: 'dark',
    userAgent: 'Mozilla/5.0',
  });
});

test('applies fallback defaults when optional searchParams, cookies, and headers are missing', async () => {
  const result = await mod.resolveTenantContext({
    params: Promise.resolve({ tenant: 'stark-ind' }),
    searchParams: Promise.resolve({}),
    cookies: async () => ({
      get: () => undefined,
    }),
    headers: async () => ({
      get: () => null,
    }),
  });

  expect(result).toEqual({
    tenant: 'stark-ind',
    view: 'overview',
    page: 1,
    theme: 'light',
    userAgent: 'unknown',
  });
});

test('clamps invalid or negative page numbers to 1', async () => {
  const negativePage = await mod.resolveTenantContext({
    params: Promise.resolve({ tenant: 'wayne' }),
    searchParams: Promise.resolve({ view: 'reports', page: '-3' }),
    cookies: async () => ({ get: () => undefined }),
    headers: async () => ({ get: () => null }),
  });
  expect(negativePage.page).toBe(1);

  const nanPage = await mod.resolveTenantContext({
    params: Promise.resolve({ tenant: 'wayne' }),
    searchParams: Promise.resolve({ view: 'reports', page: 'abc' }),
    cookies: async () => ({ get: () => undefined }),
    headers: async () => ({ get: () => null }),
  });
  expect(nanPage.page).toBe(1);
});

test('renders TenantDashboardView with the resolved context', () => {
  render(
    <mod.TenantDashboardView
      context={{
        tenant: 'initech',
        view: 'security',
        page: 3,
        theme: 'dark',
        userAgent: 'CustomAgent/1.0',
      }}
    />
  );

  expect(screen.getByText(/Tenant:\s*initech/i)).toBeTruthy();
  expect(screen.getByTestId('active-view').textContent).toContain('security');
  expect(screen.getByTestId('current-page').textContent).toContain('3');
  expect(screen.getByTestId('theme-badge').textContent).toContain('dark');
  expect(screen.getByTestId('user-agent').textContent).toContain('CustomAgent/1.0');
});
