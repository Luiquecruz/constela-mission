test('buildSearchFormUrl serializes trimmed non-empty query parameters like next/form', () => {
  expect(
    mod.buildSearchFormUrl('/catalog', { q: '  synth module  ', category: 'audio', empty: '   ' })
  ).toBe('/catalog?q=synth+module&category=audio');

  expect(mod.buildSearchFormUrl('/catalog', { q: '   ' })).toBe('/catalog');
});

test('createProductAction rejects short product names and non-positive prices', async () => {
  const initial = { ok: true, error: null, item: null };

  const shortNameResult = await mod.createProductAction(initial, {
    name: 'ab',
    price: 150,
  });
  expect(shortNameResult.ok).toBe(false);
  expect(shortNameResult.error).toBe('Product name must be at least 3 characters');

  const badPriceResult = await mod.createProductAction(initial, {
    name: 'Modular Patch Cable',
    price: 0,
  });
  expect(badPriceResult.ok).toBe(false);
  expect(badPriceResult.error).toBe('Price must be greater than zero');
});

test('createProductAction returns trimmed product item when inputs are valid', async () => {
  const initial = { ok: true, error: null, item: null };
  const validResult = await mod.createProductAction(initial, {
    name: '  Field Recorder  ',
    price: '299',
  });

  expect(validResult.ok).toBe(true);
  expect(validResult.error).toBeNull();
  expect(validResult.item).toMatchObject({
    name: 'Field Recorder',
    price: 299,
  });
});

test('CatalogSearchAndCreateApp navigates via search form and validates or appends products via Server Action', async () => {
  const onNavigate = fn();
  render(React.createElement(mod.CatalogSearchAndCreateApp, { onNavigate }));

  const searchInput = screen.getByPlaceholderText('Search catalog...');
  await user.type(searchInput, '  ribbon  ');
  await user.click(screen.getByRole('button', { name: /^search$/i }));

  expect(onNavigate).toHaveBeenCalledWith('/catalog?q=ribbon');
  expect(screen.getByText('Navigated to: /catalog?q=ribbon')).toBeInTheDocument();

  // Trigger validation error first
  await user.type(screen.getByPlaceholderText('Product name'), 'EQ');
  await user.type(screen.getByPlaceholderText('Price'), '199');
  await user.click(screen.getByRole('button', { name: /create product/i }));

  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Product name must be at least 3 characters'
  );

  // Now submit valid product
  await user.clear(screen.getByPlaceholderText('Product name'));
  await user.type(screen.getByPlaceholderText('Product name'), 'Mastering Limiter');
  await user.click(screen.getByRole('button', { name: /create product/i }));

  expect(await screen.findByText('Mastering Limiter - $199')).toBeInTheDocument();
});
