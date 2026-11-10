test('revalidateTag requires a second cacheLife profile argument', () => {
  const store = mod.createTaggedCacheStore();
  expect(() => {
    store.revalidateTag('products', '');
  }).toThrow('revalidateTag requires a cacheLife profile as second argument');
});

test('revalidateTag(tag, profile) serves STALE data immediately and refreshes the cache in the background', async () => {
  const store = mod.createTaggedCacheStore();
  let version = 1;

  const loader = async () => ({ title: `Catalog v${version}` });

  const first = await store.readCached('catalog-key', ['catalog'], loader);
  expect(first).toEqual({ data: { title: 'Catalog v1' }, cacheState: 'MISS' });

  const hit = await store.readCached('catalog-key', ['catalog'], loader);
  expect(hit).toEqual({ data: { title: 'Catalog v1' }, cacheState: 'HIT' });

  version = 2;
  store.revalidateTag('catalog', 'max');
  expect(store.getTagState('catalog')).toBe('stale');

  // Next read serves stale v1 immediately and refreshes to v2 in background
  const staleRead = await store.readCached('catalog-key', ['catalog'], loader);
  expect(staleRead).toEqual({
    data: { title: 'Catalog v1' },
    cacheState: 'STALE',
    profile: 'max',
  });

  // Subsequent read gets the refreshed v2 as a HIT
  const refreshedRead = await store.readCached('catalog-key', ['catalog'], loader);
  expect(refreshedRead).toEqual({
    data: { title: 'Catalog v2' },
    cacheState: 'HIT',
  });
});

test('updateTag(tag) expires entries immediately for read-your-own-writes consistency', async () => {
  const store = mod.createTaggedCacheStore();
  let priceCents = 2500;

  const readPrice = () =>
    store.readCached('product-99', ['products', 'product-99'], async () => ({ priceCents }));

  const initial = await readPrice();
  expect(initial.cacheState).toBe('MISS');
  expect(initial.data.priceCents).toBe(2500);

  priceCents = 1999;
  store.updateTag('product-99');
  expect(store.getTagState('product-99')).toBe('expired');

  const afterMutation = await readPrice();
  expect(afterMutation.cacheState).toBe('MISS');
  expect(afterMutation.data.priceCents).toBe(1999);
});

test('CategoryManager uses updateTag on submit so newly added categories appear immediately', async () => {
  const Component = mod.CategoryManager || mod.default;
  render(React.createElement(Component, { initialCategories: ['Electronics', 'Books'] }));

  await waitFor(() => {
    expect(screen.getByText('Electronics')).toBeTruthy();
  });

  const input = screen.getByLabelText('New category name');
  await user.type(input, 'Audio Gear');
  await user.click(screen.getByRole('button', { name: /add category/i }));

  await waitFor(() => {
    expect(screen.getByText('Audio Gear')).toBeTruthy();
  });
});
