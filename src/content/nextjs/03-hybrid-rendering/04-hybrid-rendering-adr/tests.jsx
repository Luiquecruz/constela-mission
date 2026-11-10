test('adr export has accepted status, hybrid-rendering layer, and well-formed context and decision', () => {
  const { adr } = mod;
  expect(adr).toBeDefined();
  expect(adr.status).toBe('accepted');
  expect(adr.layer).toBe('hybrid-rendering');
  expect(typeof adr.id).toBe('string');
  expect(adr.id.trim().length).toBeGreaterThan(0);
  expect(adr.context.length).toBeGreaterThanOrEqual(80);
  expect(adr.context.toLowerCase()).toContain('bundle');
  expect(adr.context).toContain('Server Components');
  expect(adr.decision.length).toBeGreaterThanOrEqual(40);
  expect(adr.decision.startsWith('We will')).toBe(true);
});

test('adr documents at least 2 distinct alternatives and both positive and negative consequences', () => {
  const { adr } = mod;
  expect(Array.isArray(adr.alternatives)).toBe(true);
  expect(adr.alternatives.length).toBeGreaterThanOrEqual(2);

  const uniqueOptions = new Set(adr.alternatives.map((a) => a.option.trim()));
  expect(uniqueOptions.size).toBeGreaterThanOrEqual(2);
  for (const alt of adr.alternatives) {
    expect(alt.reason.trim().length).toBeGreaterThanOrEqual(20);
  }

  expect(adr.consequences.positive.length).toBeGreaterThanOrEqual(2);
  expect(adr.consequences.negative.length).toBeGreaterThanOrEqual(1);
});

test('ProductMarkdownSpecification and SupplierWholesaleMarginCalculator are assigned to server-component', () => {
  const { componentBoundaries } = mod;
  const findBoundary = (name) =>
    componentBoundaries.find((item) => item.component === name);

  const markdownSpec = findBoundary('ProductMarkdownSpecification');
  const marginCalc = findBoundary('SupplierWholesaleMarginCalculator');

  expect(markdownSpec).toBeDefined();
  expect(markdownSpec.boundary).toBe('server-component');
  expect(markdownSpec.reason.trim().length).toBeGreaterThanOrEqual(20);

  expect(marginCalc).toBeDefined();
  expect(marginCalc.boundary).toBe('server-component');
  expect(marginCalc.reason.trim().length).toBeGreaterThanOrEqual(20);
});

test('InteractiveSizeAndColorPicker uses client-component and CatalogFilterSearchForm uses next-form', () => {
  const { componentBoundaries } = mod;
  const findBoundary = (name) =>
    componentBoundaries.find((item) => item.component === name);

  const picker = findBoundary('InteractiveSizeAndColorPicker');
  const searchForm = findBoundary('CatalogFilterSearchForm');

  expect(picker).toBeDefined();
  expect(picker.boundary).toBe('client-component');
  expect(picker.reason.trim().length).toBeGreaterThanOrEqual(20);

  expect(searchForm).toBeDefined();
  expect(searchForm.boundary).toBe('next-form');
  expect(searchForm.reason.trim().length).toBeGreaterThanOrEqual(20);
});
