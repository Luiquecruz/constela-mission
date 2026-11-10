const sampleSlots = {
  children: {
    routes: { '/': 'Home', '/settings': 'Settings' },
    defaultView: 'DefaultChildren',
  },
  analytics: {
    routes: { '/': 'OverviewMetrics', '/revenue': 'RevenueMetrics' },
    defaultView: 'DefaultAnalytics',
  },
  modal: {
    routes: {},
    defaultView: null,
  },
};

test('resolves exact route matches and null defaultView on initial load', () => {
  const result = mod.resolveParallelSlots({
    slots: sampleSlots,
    pathname: '/',
    navigationType: 'hard',
    previousState: null,
  });

  expect(result).toEqual({
    status: 200,
    missingSlot: null,
    rendered: {
      children: 'Home',
      analytics: 'OverviewMetrics',
      modal: null,
    },
  });
});

test('retains previously active slot state on soft navigation when a slot lacks the target route', () => {
  const result = mod.resolveParallelSlots({
    slots: sampleSlots,
    pathname: '/settings',
    navigationType: 'soft',
    previousState: {
      children: 'Home',
      analytics: 'OverviewMetrics',
      modal: null,
    },
  });

  expect(result).toEqual({
    status: 200,
    missingSlot: null,
    rendered: {
      children: 'Settings',
      analytics: 'OverviewMetrics',
      modal: null,
    },
  });
});

test('falls back to defaultView on hard navigation when a slot does not match the pathname', () => {
  const result = mod.resolveParallelSlots({
    slots: sampleSlots,
    pathname: '/settings',
    navigationType: 'hard',
    previousState: {
      children: 'Home',
      analytics: 'OverviewMetrics',
      modal: null,
    },
  });

  expect(result).toEqual({
    status: 200,
    missingSlot: null,
    rendered: {
      children: 'Settings',
      analytics: 'DefaultAnalytics',
      modal: null,
    },
  });
});

test('distinguishes build-error for a slot missing default.tsx from runtime 404 when default.tsx calls notFound()', () => {
  const slotsWithoutDefault = {
    children: {
      routes: { '/': 'Home', '/settings': 'Settings' },
      defaultView: 'DefaultChildren',
    },
    analytics: {
      routes: { '/': 'OverviewMetrics' },
      // no defaultView defined -> Next.js build error
    },
  };

  const buildErrorResult = mod.resolveParallelSlots({
    slots: slotsWithoutDefault,
    pathname: '/settings',
    navigationType: 'hard',
    previousState: null,
  });

  expect(buildErrorResult).toEqual({
    status: 'build-error',
    missingSlot: 'analytics',
    rendered: null,
  });

  const slotsWithNotFoundDefault = {
    children: {
      routes: { '/': 'Home', '/settings': 'Settings' },
      defaultView: 'DefaultChildren',
    },
    analytics: {
      routes: { '/': 'OverviewMetrics' },
      defaultView: 'notFound',
    },
  };

  const notFoundResult = mod.resolveParallelSlots({
    slots: slotsWithNotFoundDefault,
    pathname: '/settings',
    navigationType: 'hard',
    previousState: null,
  });

  expect(notFoundResult).toEqual({
    status: 404,
    missingSlot: 'analytics',
    rendered: null,
  });
});

test('ParallelDashboardApp demonstrates soft retention vs hard default.tsx fallback on /settings', async () => {
  const App = mod.ParallelDashboardApp || mod.default;
  render(<App />);

  expect(screen.getByText('Workspace Overview')).toBeInTheDocument();
  expect(screen.getByText('Live Metrics Panel')).toBeInTheDocument();

  await user.click(screen.getByRole('button', { name: /soft navigate to \/settings/i }));
  expect(screen.getByText('Workspace Settings')).toBeInTheDocument();
  expect(screen.getByText('Live Metrics Panel')).toBeInTheDocument();

  await user.click(screen.getByRole('button', { name: /hard reload \/settings/i }));
  expect(screen.getByText('Workspace Settings')).toBeInTheDocument();
  expect(screen.getByText('Fallback Analytics (default.tsx)')).toBeInTheDocument();
});
