test('tagged cache store transitions between MISS, HIT, STALE, and immediate updateTag eviction', async () => {
  const cacheMod = modules['cache.ts'];
  cacheMod.resetCacheStore();

  let computeCalls = 0;
  const loader = () => {
    computeCalls += 1;
    return `version-${computeCalls}`;
  };

  const first = await cacheMod.readCached('k1', ['catalog-products'], loader);
  expect(first).toEqual({ value: 'version-1', status: 'MISS' });

  const second = await cacheMod.readCached('k1', ['catalog-products'], loader);
  expect(second).toEqual({ value: 'version-1', status: 'HIT' });
  expect(computeCalls).toBe(1);

  cacheMod.revalidateTag('catalog-products', 'max');
  const third = await cacheMod.readCached('k1', ['catalog-products'], loader);
  expect(third.status).toBe('STALE');
  expect(computeCalls).toBe(2);

  cacheMod.updateTag('catalog-products');
  const fourth = await cacheMod.readCached('k1', ['catalog-products'], loader);
  expect(fourth).toEqual({ value: 'version-3', status: 'MISS' });
});

test('DAL getProductsCatalog caches product DTOs and strips supplierSecret', async () => {
  const cacheMod = modules['cache.ts'];
  const dalMod = modules['dal.ts'];
  cacheMod.resetCacheStore();

  const catalog = await dalMod.getProductsCatalog();
  expect(catalog.length).toBe(2);
  expect(catalog[0]).toEqual({
    id: 'p1',
    name: 'Quantum Keyboard',
    price: 180,
    stock: 5,
  });
  expect('supplierSecret' in catalog[0]).toBe(false);
  expect('supplierSecret' in catalog[1]).toBe(false);

  const cachedRead = await dalMod.getProductsCatalog();
  expect(cachedRead).toEqual(catalog);
  expect(cacheMod.getLastCacheStatus()).toBe('HIT');
});

test('updatePriceAction enforces admin role, validates positive price, invalidates tag, and triggers after()', async () => {
  const cacheMod = modules['cache.ts'];
  const actionsMod = modules['actions.ts'];
  cacheMod.resetCacheStore();

  let forbiddenErr = null;
  try {
    await actionsMod.updatePriceAction({
      productId: 'p1',
      newPrice: 200,
      role: 'customer',
    });
  } catch (err) {
    forbiddenErr = err;
  }
  expect(forbiddenErr && forbiddenErr.message).toBe('Forbidden');

  const invalidPrice = await actionsMod.updatePriceAction({
    productId: 'p1',
    newPrice: -10,
    role: 'admin',
  });
  expect(invalidPrice).toEqual({
    ok: false,
    error: 'Price must be positive',
  });

  const recordedAudits = [];
  const validUpdate = await actionsMod.updatePriceAction({
    productId: 'p1',
    newPrice: 210,
    role: 'admin',
    after: (arg) => {
      const entry = typeof arg === 'function' ? arg() : arg;
      recordedAudits.push(entry);
    },
  });

  expect(validUpdate.ok).toBe(true);
  expect(validUpdate.products[0].price).toBe(210);
  expect(recordedAudits).toEqual([
    { productId: 'p1', newPrice: 210, event: 'PRICE_UPDATED' },
  ]);
});

test('Storefront renders catalog, opens and closes @modal quick-view dialog, and never leaks supplierSecret', async () => {
  const cacheMod = modules['cache.ts'];
  cacheMod.resetCacheStore();

  const App = mod.default;
  const view = render(React.createElement(App));

  await waitFor(() => {
    expect(screen.getByText('Next.js Commerce Storefront')).toBeTruthy();
    expect(screen.getByText('Quantum Keyboard')).toBeTruthy();
  });

  expect(view.container.textContent).not.toContain('margin-42');
  expect(view.container.textContent).not.toContain('margin-55');

  await user.click(screen.getByText('Quantum Keyboard'));
  const dialog = screen.getByRole('dialog');
  expect(dialog).toBeTruthy();
  expect(within(dialog).getByText(/Stock available: 5/i)).toBeTruthy();

  await user.click(within(dialog).getByText('Close quick view'));
  expect(screen.queryByRole('dialog')).toBeNull();
});

test('Submitting inline admin price form immediately updates displayed price and appends Audit Log entry', async () => {
  const cacheMod = modules['cache.ts'];
  cacheMod.resetCacheStore();

  const App = mod.default;
  const view = render(React.createElement(App));

  await waitFor(() => {
    expect(
      screen.getByLabelText('New price for Quantum Keyboard')
    ).toBeTruthy();
  });

  const priceInput = screen.getByLabelText('New price for Quantum Keyboard');
  await user.clear(priceInput);
  await user.type(priceInput, '249');

  const saveButtons = screen.getAllByText('Save price');
  await user.click(saveButtons[0]);

  await waitFor(() => {
    expect(view.container.textContent).toContain('$249');
    expect(view.container.textContent).toContain('PRICE_UPDATED');
  });
});
