test('exports a valid accepted routing ADR with context and decision', () => {
  const { adr } = mod;
  expect(adr).toBeDefined();
  expect(typeof adr.id).toBe('string');
  expect(adr.id.trim().length).toBeGreaterThan(0);
  expect(typeof adr.title).toBe('string');
  expect(adr.title.trim().length).toBeGreaterThan(5);
  expect(adr.status).toBe('accepted');
  expect(adr.layer).toBe('routing');

  expect(typeof adr.context).toBe('string');
  expect(adr.context.length).toBeGreaterThanOrEqual(80);
  expect(adr.context.toLowerCase()).toContain('parallel');
  expect(adr.context.toLowerCase()).toContain('intercept');

  expect(typeof adr.decision).toBe('string');
  expect(adr.decision.length).toBeGreaterThanOrEqual(40);
  expect(adr.decision.startsWith('We will')).toBe(true);
});

test('documents at least two rejected alternatives and positive/negative consequences', () => {
  const { adr } = mod;
  expect(Array.isArray(adr.alternatives)).toBe(true);
  expect(adr.alternatives.length).toBeGreaterThanOrEqual(2);

  const uniqueOptions = new Set(adr.alternatives.map((a) => a.option.trim()));
  expect(uniqueOptions.size).toBeGreaterThanOrEqual(2);
  for (const alt of adr.alternatives) {
    expect(alt.option.trim().length).toBeGreaterThan(3);
    expect(alt.reason.trim().length).toBeGreaterThanOrEqual(20);
  }

  expect(Array.isArray(adr.consequences?.positive)).toBe(true);
  expect(adr.consequences.positive.length).toBeGreaterThanOrEqual(2);
  expect(Array.isArray(adr.consequences?.negative)).toBe(true);
  expect(adr.consequences.negative.length).toBeGreaterThanOrEqual(1);
});

test('maps marketing-vs-console-layouts and asset-preview-overlay to coherent Next.js patterns', () => {
  const { routingDecisions } = mod;
  expect(Array.isArray(routingDecisions)).toBe(true);

  const byReq = Object.fromEntries(
    routingDecisions.map((item) => [item.requirement, item])
  );

  expect(byReq['marketing-vs-console-layouts']?.pattern).toBe('route-groups');
  expect(byReq['marketing-vs-console-layouts']?.reason?.length).toBeGreaterThanOrEqual(20);

  expect(byReq['asset-preview-overlay']?.pattern).toBe('parallel-and-intercepting');
  expect(byReq['asset-preview-overlay']?.reason?.length).toBeGreaterThanOrEqual(20);
});

test('maps independent-billing-and-usage-panels and missing-default-fallback-guard to coherent Next.js patterns', () => {
  const { routingDecisions } = mod;
  const byReq = Object.fromEntries(
    routingDecisions.map((item) => [item.requirement, item])
  );

  expect(byReq['independent-billing-and-usage-panels']?.pattern).toBe('parallel-slots');
  expect(byReq['independent-billing-and-usage-panels']?.reason?.length).toBeGreaterThanOrEqual(20);

  expect(byReq['missing-default-fallback-guard']?.pattern).toBe('slot-default-tsx');
  expect(byReq['missing-default-fallback-guard']?.reason?.length).toBeGreaterThanOrEqual(20);
});
