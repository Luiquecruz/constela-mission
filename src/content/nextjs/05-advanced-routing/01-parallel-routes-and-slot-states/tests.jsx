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

test('returns 404 and identifies the missingSlot when hard navigation hits an unmatched slot without defaultView', () => {
  const slotsWithoutDefault = {
    children: {
      routes: { '/': 'Home', '/settings': 'Settings' },
    },
    analytics: {
      routes: { '/': 'OverviewMetrics' },
      // no defaultView defined
    },
  };

  const result = mod.resolveParallelSlots({
    slots: slotsWithoutDefault,
    pathname: '/settings',
    navigationType: 'hard',
    previousState: null,
  });

  expect(result).toEqual({
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
