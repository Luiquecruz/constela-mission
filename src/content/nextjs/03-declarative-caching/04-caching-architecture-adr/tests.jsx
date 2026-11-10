test('adr defines an accepted caching decision with context, decision, alternatives, and consequences', () => {
  const { adr } = mod;
  expect(adr).toBeTruthy();
  expect(typeof adr.id).toBe('string');
  expect(adr.id.length).toBeGreaterThan(2);
  expect(adr.title.length).toBeGreaterThanOrEqual(15);
  expect(adr.status).toBe('accepted');
  expect(adr.layer).toBe('caching');

  expect(adr.context.length).toBeGreaterThanOrEqual(80);
  expect(adr.context.toLowerCase()).toContain('cachecomponents');
  expect(adr.context.toLowerCase()).toContain('stale');

  expect(adr.decision.length).toBeGreaterThanOrEqual(40);
  expect(adr.decision.startsWith('We will')).toBe(true);

  expect(Array.isArray(adr.alternatives)).toBe(true);
  expect(adr.alternatives.length).toBeGreaterThanOrEqual(2);
  const uniqueOptions = new Set(adr.alternatives.map((a) => a.option));
  expect(uniqueOptions.size).toBeGreaterThanOrEqual(2);
  adr.alternatives.forEach((alt) => {
    expect(alt.option.trim().length).toBeGreaterThan(5);
    expect(alt.reason.trim().length).toBeGreaterThan(15);
  });

  expect(adr.consequences.positive.length).toBeGreaterThanOrEqual(2);
  expect(adr.consequences.negative.length).toBeGreaterThanOrEqual(1);
});

test('cachingPlan covers all four MercadoPulse domains with substantive reasons', () => {
  const { cachingPlan } = mod;
  expect(Array.isArray(cachingPlan)).toBe(true);
  expect(cachingPlan.length).toBe(4);

  const domains = cachingPlan.map((r) => r.domain).sort();
  expect(domains).toEqual([
    'checkout-stock-hold',
    'navigation-taxonomy',
    'product-catalog',
    'seller-price-edit',
  ]);

  cachingPlan.forEach((rule) => {
    expect(rule.reason.trim().length).toBeGreaterThanOrEqual(25);
  });
});

test('checkout-stock-hold uses dynamic-suspense with no cache invalidation', () => {
  const rule = mod.cachingPlan.find((r) => r.domain === 'checkout-stock-hold');
  expect(rule).toBeTruthy();
  expect(rule.strategy).toBe('dynamic-suspense');
  expect(rule.invalidation).toBe('none');
});

test('seller-price-edit uses use-cache with updateTag for immediate read-your-own-writes consistency', () => {
  const rule = mod.cachingPlan.find((r) => r.domain === 'seller-price-edit');
  expect(rule).toBeTruthy();
  expect(rule.strategy).toBe('use-cache');
  expect(rule.invalidation).toBe('updateTag');
});

test('navigation-taxonomy and product-catalog use use-cache with revalidateTag for background webhook SWR', () => {
  const taxonomy = mod.cachingPlan.find((r) => r.domain === 'navigation-taxonomy');
  const catalog = mod.cachingPlan.find((r) => r.domain === 'product-catalog');

  expect(taxonomy).toBeTruthy();
  expect(taxonomy.strategy).toBe('use-cache');
  expect(taxonomy.invalidation).toBe('revalidateTag');

  expect(catalog).toBeTruthy();
  expect(catalog.strategy).toBe('use-cache');
  expect(catalog.invalidation).toBe('revalidateTag');
});
