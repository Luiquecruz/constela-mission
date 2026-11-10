test('buildUpdatedQuery updates a key without clobbering existing params and deletes empty values', () => {
  expect(mod.buildUpdatedQuery('?sort=recent&page=2', 'category', 'routing')).toBe(
    'sort=recent&page=2&category=routing'
  );
  expect(mod.buildUpdatedQuery('sort=recent&category=routing', 'category', null)).toBe(
    'sort=recent'
  );
  expect(mod.buildUpdatedQuery('sort=recent&category=routing', 'category', '')).toBe(
    'sort=recent'
  );
});

test('guardAuthRoute redirects unauthenticated users with encoded next param and allows sessions', () => {
  const redirect = fn();
  mod.guardAuthRoute(null, '/dashboard?tab=keys', redirect);
  expect(redirect.mock.calls).toEqual([['/login?next=%2Fdashboard%3Ftab%3Dkeys']]);

  const okRedirect = fn();
  const result = mod.guardAuthRoute({ userId: 'u-42' }, '/dashboard', okRedirect);
  expect(okRedirect.mock.calls).toEqual([]);
  expect(result).toEqual({ allowed: true, userId: 'u-42' });
});

test('NavBar sets aria-current="page" strictly on the active link from usePathname', () => {
  render(React.createElement(mod.NavBar, { usePathname: () => '/guides' }));

  expect(screen.getByRole('link', { name: 'Guides' })).toHaveAttribute('aria-current', 'page');
  expect(screen.getByRole('link', { name: 'Docs' })).not.toHaveAttribute('aria-current');
  expect(screen.getByRole('link', { name: 'Overview' })).not.toHaveAttribute('aria-current');
});

test('DocsNavApp synchronizes filters without losing existing query params and navigates back', async () => {
  render(React.createElement(mod.DocsNavApp));

  expect(screen.getByTestId('current-url')).toHaveTextContent('/docs?sort=recent');

  await user.click(screen.getByRole('button', { name: 'Routing' }));
  expect(screen.getByTestId('current-url')).toHaveTextContent('/docs?sort=recent&category=routing');

  await user.selectOptions(screen.getByLabelText('Sort by'), 'popular');
  expect(screen.getByTestId('current-url')).toHaveTextContent('/docs?sort=popular&category=routing');

  await user.click(screen.getByRole('link', { name: 'Guides' }));
  expect(screen.getByRole('link', { name: 'Guides' })).toHaveAttribute('aria-current', 'page');

  await user.click(screen.getByRole('button', { name: 'Back' }));
  expect(screen.getByRole('link', { name: 'Docs' })).toHaveAttribute('aria-current', 'page');
});

test('DocsNavApp redirects to /login?next=%2Fdashboard when visiting Dashboard signed out', async () => {
  render(React.createElement(mod.DocsNavApp, { initialAuthenticated: false }));

  await user.click(screen.getByRole('link', { name: 'Dashboard' }));
  expect(screen.getByTestId('current-url')).toHaveTextContent('/login?next=%2Fdashboard');
  expect(screen.getByText(/Login Required:/i)).toBeInTheDocument();
});
