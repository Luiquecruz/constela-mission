test('loadProductDashboardParallel initiates all three requests concurrently without waiting sequentially', async () => {
  const startOrder = [];
  let resolveProduct;

  const fetchProduct = fn((id) => {
    startOrder.push(`product:${id}`);
    return new Promise((resolve) => {
      resolveProduct = () =>
        resolve({ id, name: 'Synth Module', price: 499, stockCount: 7 });
    });
  });

  const fetchReviews = fn(async (id) => {
    startOrder.push(`reviews:${id}`);
    return [{ id: 'r1', author: 'Sam', rating: 5, comment: 'Warm analog filter' }];
  });

  const fetchInventory = fn(async (id) => {
    startOrder.push(`inventory:${id}`);
    return { warehouse: 'EU-West', available: 7 };
  });

  const pendingDashboard = mod.loadProductDashboardParallel(
    { fetchProduct, fetchReviews, fetchInventory },
    'synth-01'
  );

  // Even before fetchProduct resolves, fetchReviews and fetchInventory must have started!
  expect(startOrder).toEqual([
    'product:synth-01',
    'reviews:synth-01',
    'inventory:synth-01',
  ]);

  resolveProduct();
  const data = await pendingDashboard;
  expect(data.product.name).toBe('Synth Module');
  expect(data.reviews).toHaveLength(1);
  expect(data.inventory.warehouse).toBe('EU-West');
});

test('StreamingProductPage renders product title and price immediately while reviews are loading', () => {
  const product = { id: 'p-1', name: 'Mastering Equalizer', price: 899, stockCount: 3 };
  render(
    React.createElement(mod.StreamingProductPage, {
      product,
      isReviewsLoading: true,
      slowReviewsSlot: React.createElement('div', null, 'Streamed Review Content'),
    })
  );

  expect(screen.getByText('Mastering Equalizer')).toBeInTheDocument();
  expect(screen.getByText('$899')).toBeInTheDocument();
  expect(screen.getByRole('status')).toHaveTextContent(/Loading customer reviews\.\.\./i);
  expect(screen.queryByText('Streamed Review Content')).toBeNull();
});

test('StreamingProductPage swaps the status fallback for slowReviewsSlot once loading finishes', () => {
  const product = { id: 'p-1', name: 'Mastering Equalizer', price: 899, stockCount: 3 };
  render(
    React.createElement(mod.StreamingProductPage, {
      product,
      isReviewsLoading: false,
      slowReviewsSlot: React.createElement('div', null, 'Streamed Review Content'),
    })
  );

  expect(screen.getByText('Mastering Equalizer')).toBeInTheDocument();
  expect(screen.queryByRole('status')).toBeNull();
  expect(screen.getByText('Streamed Review Content')).toBeInTheDocument();
});

test('App interactive preview toggles between Suspense fallback status and resolved reviews', async () => {
  render(React.createElement(mod.App));

  expect(screen.getByText('Ultra-Low Latency Audio Interface')).toBeInTheDocument();
  expect(screen.getByText(/Sub-2ms roundtrip latency/i)).toBeInTheDocument();

  const toggleBtn = screen.getByRole('button', { name: /toggle reviews stream/i });
  await user.click(toggleBtn);

  expect(screen.getByText('Ultra-Low Latency Audio Interface')).toBeInTheDocument();
  expect(screen.getByRole('status')).toHaveTextContent(/Loading customer reviews\.\.\./i);
});
