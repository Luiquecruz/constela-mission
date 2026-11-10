test('toPublicProductDto strips supplierCost, internalSku, and specsMarkdown while preserving public fields', () => {
  const raw = {
    id: 'p-100',
    name: 'Studio Monitor Pair',
    price: 599,
    category: 'Audio',
    inStock: true,
    supplierCost: 210,
    internalSku: 'SECRET-SKU-100',
    specsMarkdown: 'Bi-amplified | XLR balanced input',
  };

  const dto = mod.toPublicProductDto(raw);
  expect(dto).toEqual({
    id: 'p-100',
    name: 'Studio Monitor Pair',
    price: 599,
    category: 'Audio',
    inStock: true,
  });
  expect('supplierCost' in dto).toBe(false);
  expect('internalSku' in dto).toBe(false);
  expect('specsMarkdown' in dto).toBe(false);
});

test('validateClientProps rejects plain functions across the client boundary', () => {
  const result = mod.validateClientProps({
    product: { id: 'p-1', name: 'Mic', price: 199, category: 'Audio', inStock: true },
    onClick: () => {},
  });

  expect(result.valid).toBe(false);
  expect(result.violations).toContain('Non-serializable function prop: onClick');
});

test('validateClientProps allows Server Actions marked with $$serverAction and ReactNode children', () => {
  const serverAction = Object.assign(() => {}, { $$serverAction: true });
  const result = mod.validateClientProps({
    product: { id: 'p-1', name: 'Mic', price: 199, category: 'Audio', inStock: true },
    onAddToCart: serverAction,
    children: React.createElement('div', null, 'Server Specs'),
  });

  expect(result.valid).toBe(true);
  expect(result.violations).toEqual([]);
});

test('validateClientProps rejects leaked supplierCost or internalSku inside product prop', () => {
  const result = mod.validateClientProps({
    product: {
      id: 'p-1',
      name: 'Mic',
      price: 199,
      supplierCost: 65,
      internalSku: 'INTERNAL-99',
    },
  });

  expect(result.valid).toBe(false);
  expect(result.violations).toContain('Leaked sensitive field: supplierCost');
  expect(result.violations).toContain('Leaked sensitive field: internalSku');
});

test('CatalogPage increments cart count and toggles the server specifications slot via children', async () => {
  render(React.createElement(mod.CatalogPage));

  expect(screen.getByText('Studio Condenser Microphone')).toBeInTheDocument();
  expect(screen.queryByText(/Cardioid polar pattern/i)).toBeNull();

  const addButtons = screen.getAllByRole('button', { name: /add to cart/i });
  await user.click(addButtons[0]);
  expect(screen.getByText('In cart: 1')).toBeInTheDocument();
  expect(screen.getByText('Cart events processed: 1')).toBeInTheDocument();

  const toggleButtons = screen.getAllByRole('button', { name: /toggle specifications/i });
  await user.click(toggleButtons[0]);
  expect(screen.getByText(/Cardioid polar pattern/i)).toBeInTheDocument();
});
