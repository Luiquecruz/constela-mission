test('renders both Main Workspace and Analytics Slot healthy states by default', () => {
  const App = mod.IsolatedWorkspace || mod.default;
  render(<App />);

  const mainRegion = screen.getByRole('region', { name: 'Main Workspace' });
  const analyticsRegion = screen.getByRole('region', { name: 'Analytics Slot' });

  expect(within(mainRegion).getByText('Invoice #INV-100: Paid')).toBeInTheDocument();
  expect(within(analyticsRegion).getByText('Live conversion: 4.8%')).toBeInTheDocument();
  expect(screen.queryByRole('alert')).toBeNull();
});

test('isolates Analytics Slot error boundary without losing Main Workspace client state', async () => {
  const App = mod.IsolatedWorkspace || mod.default;
  render(<App />);

  await user.click(
    screen.getByRole('button', { name: /increment workspace edits \(count: 0\)/i })
  );
  expect(
    screen.getByRole('button', { name: /increment workspace edits \(count: 1\)/i })
  ).toBeInTheDocument();

  await user.click(screen.getByRole('button', { name: /trigger analytics error/i }));

  const alert = screen.getByRole('alert');
  expect(within(alert).getByText(/analytics failed to load/i)).toBeInTheDocument();
  expect(screen.queryByText('Live conversion: 4.8%')).toBeNull();

  // Main Workspace stays mounted and interactive while Analytics Slot is in error state
  await user.click(
    screen.getByRole('button', { name: /increment workspace edits \(count: 1\)/i })
  );
  expect(
    screen.getByRole('button', { name: /increment workspace edits \(count: 2\)/i })
  ).toBeInTheDocument();
});

test('retries and recovers Analytics Slot when clicking Retry analytics', async () => {
  const App = mod.IsolatedWorkspace || mod.default;
  render(<App initialAnalyticsError={true} />);

  expect(screen.getByRole('alert')).toHaveTextContent(/analytics failed to load/i);

  await user.click(screen.getByRole('button', { name: /retry analytics/i }));

  expect(screen.queryByRole('alert')).toBeNull();
  expect(screen.getByText('Live conversion: 4.8%')).toBeInTheDocument();
});

test('renders and resets the not-found boundary in Main Workspace for missing invoices while Analytics Slot stays healthy', async () => {
  const App = mod.IsolatedWorkspace || mod.default;
  render(<App />);

  await user.click(screen.getByRole('button', { name: /open missing invoice #inv-999/i }));

  expect(screen.getByText(/invoice not found/i)).toBeInTheDocument();
  expect(screen.getByText('Live conversion: 4.8%')).toBeInTheDocument();

  await user.click(screen.getByRole('button', { name: /back to invoices/i }));
  expect(screen.getByText('Invoice #INV-100: Paid')).toBeInTheDocument();
});
