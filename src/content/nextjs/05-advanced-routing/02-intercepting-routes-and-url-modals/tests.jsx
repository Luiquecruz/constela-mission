test('closeInterceptedModal calls router.back() when historyLength > 1 and router.push(fallbackPath) otherwise', () => {
  const router = {
    back: fn(),
    push: fn(),
  };

  mod.closeInterceptedModal(router, 3, '/feed');
  expect(router.back).toHaveBeenCalledTimes(1);
  expect(router.push).toHaveBeenCalledTimes(0);

  mod.closeInterceptedModal(router, 1, '/feed');
  expect(router.back).toHaveBeenCalledTimes(1);
  expect(router.push).toHaveBeenCalledWith('/feed');
});

test('soft navigation from /feed opens the intercepted photo modal while keeping Photo Feed mounted', async () => {
  const App = mod.PhotoFeedApp || mod.default;
  render(<App initialPath="/feed" initialNavType="soft" />);

  expect(screen.getByRole('heading', { name: 'Photo Feed' })).toBeInTheDocument();
  expect(screen.queryByRole('dialog')).toBeNull();

  await user.click(screen.getByRole('button', { name: /open nebula ridge/i }));

  expect(screen.getByRole('heading', { name: 'Photo Feed' })).toBeInTheDocument();
  const dialog = screen.getByRole('dialog', { name: 'Nebula Ridge' });
  expect(dialog).toBeInTheDocument();
  expect(within(dialog).getByText(/Ada/)).toBeInTheDocument();
});

test('closing the intercepted modal returns to /feed and unmounts the dialog', async () => {
  const App = mod.PhotoFeedApp || mod.default;
  render(<App initialPath="/feed" initialNavType="soft" />);

  await user.click(screen.getByRole('button', { name: /open nebula ridge/i }));
  expect(screen.getByRole('dialog', { name: 'Nebula Ridge' })).toBeInTheDocument();

  await user.click(screen.getByRole('button', { name: /close modal/i }));
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(screen.getByRole('heading', { name: 'Photo Feed' })).toBeInTheDocument();
});

test('hard navigation or Simulate hard reload renders the canonical photo page without the feed or modal dialog', async () => {
  const App = mod.PhotoFeedApp || mod.default;
  const { unmount } = render(<App initialPath="/photo/1" initialNavType="hard" />);

  expect(
    screen.getByRole('heading', { name: 'Canonical Photo Page: Nebula Ridge' })
  ).toBeInTheDocument();
  expect(screen.queryByRole('heading', { name: 'Photo Feed' })).toBeNull();
  expect(screen.queryByRole('dialog')).toBeNull();

  unmount();

  render(<App initialPath="/feed" initialNavType="soft" />);
  await user.click(screen.getByRole('button', { name: /open orbital dawn/i }));
  expect(screen.getByRole('dialog', { name: 'Orbital Dawn' })).toBeInTheDocument();

  await user.click(screen.getByRole('button', { name: /simulate hard reload/i }));
  expect(
    screen.getByRole('heading', { name: 'Canonical Photo Page: Orbital Dawn' })
  ).toBeInTheDocument();
  expect(screen.queryByRole('dialog')).toBeNull();
});
