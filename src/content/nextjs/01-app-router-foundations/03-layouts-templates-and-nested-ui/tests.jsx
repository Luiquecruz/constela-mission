test('resolveSegmentChain returns root layout and home page for "/"', () => {
  expect(mod.resolveSegmentChain('/')).toEqual([
    { segment: '/', kind: 'layout', file: 'app/layout.tsx' },
    { segment: '/', kind: 'page', file: 'app/page.tsx' },
  ]);
});

test('resolveSegmentChain orders root layout, dashboard layout, dashboard template, and leaf page', () => {
  expect(mod.resolveSegmentChain('/dashboard/billing')).toEqual([
    { segment: '/', kind: 'layout', file: 'app/layout.tsx' },
    { segment: '/dashboard', kind: 'layout', file: 'app/dashboard/layout.tsx' },
    { segment: '/dashboard', kind: 'template', file: 'app/dashboard/template.tsx' },
    { segment: '/dashboard/billing', kind: 'page', file: 'app/dashboard/billing/page.tsx' },
  ]);

  expect(mod.resolveSegmentChain('/dashboard/settings/')).toEqual([
    { segment: '/', kind: 'layout', file: 'app/layout.tsx' },
    { segment: '/dashboard', kind: 'layout', file: 'app/dashboard/layout.tsx' },
    { segment: '/dashboard', kind: 'template', file: 'app/dashboard/template.tsx' },
    { segment: '/dashboard/settings', kind: 'page', file: 'app/dashboard/settings/page.tsx' },
  ]);
});

test('LayoutVsTemplateDemo preserves layout state while resetting template state on route switches', async () => {
  render(React.createElement(mod.LayoutVsTemplateDemo));

  const noteInput = screen.getByLabelText('Layout note');
  await user.type(noteInput, 'Keep me across tabs');
  await user.click(screen.getByRole('button', { name: /increment layout counter/i }));
  await user.click(screen.getByRole('button', { name: /increment template counter/i }));
  await user.click(screen.getByRole('button', { name: /increment template counter/i }));

  expect(screen.getByText('Layout counter: 1')).toBeInTheDocument();
  expect(screen.getByText('Template counter: 2')).toBeInTheDocument();

  await user.click(screen.getByRole('button', { name: '/dashboard/billing' }));

  expect(screen.getByLabelText('Layout note')).toHaveValue('Keep me across tabs');
  expect(screen.getByText('Layout counter: 1')).toBeInTheDocument();
  expect(screen.getByText('Template counter: 0')).toBeInTheDocument();
  expect(screen.getByTestId('segment-chain')).toHaveTextContent('app/dashboard/billing/page.tsx');

  await user.click(screen.getByRole('button', { name: /increment template counter/i }));
  expect(screen.getByText('Template counter: 1')).toBeInTheDocument();

  await user.click(screen.getByRole('button', { name: '/dashboard/settings' }));
  expect(screen.getByLabelText('Layout note')).toHaveValue('Keep me across tabs');
  expect(screen.getByText('Layout counter: 1')).toBeInTheDocument();
  expect(screen.getByText('Template counter: 0')).toBeInTheDocument();
});
