test('adr has accepted status, observability layer, and well-formed context and decision', () => {
  const { adr } = mod;
  expect(adr).toBeDefined();
  expect(typeof adr.id).toBe('string');
  expect(adr.id.trim().length).toBeGreaterThan(0);
  expect(typeof adr.title).toBe('string');
  expect(adr.title.trim().length).toBeGreaterThan(0);
  expect(adr.status).toBe('accepted');
  expect(adr.layer).toBe('observability');
  expect(adr.context.length).toBeGreaterThanOrEqual(80);
  expect(adr.context).toMatch(/after/);
  expect(adr.context).toMatch(/onRequestError/);
  expect(adr.decision.length).toBeGreaterThanOrEqual(40);
  expect(adr.decision.startsWith('We will')).toBe(true);
});

test('adr documents at least two distinct alternatives and positive/negative consequences', () => {
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

test('taskDispatchPlan assigns best-effort tasks to after and critical financial tasks to durable-queue', () => {
  const { taskDispatchPlan } = mod;
  expect(Array.isArray(taskDispatchPlan)).toBe(true);
  expect(taskDispatchPlan).toHaveLength(4);

  const byTask = Object.fromEntries(
    taskDispatchPlan.map((entry) => [entry.task, entry])
  );

  expect(byTask['analytics-pageview-beacon']?.mechanism).toBe('after');
  expect(byTask['search-cache-warm']?.mechanism).toBe('after');
  expect(byTask['invoice-tax-settlement']?.mechanism).toBe('durable-queue');
  expect(byTask['payment-capture-webhook']?.mechanism).toBe('durable-queue');

  for (const entry of taskDispatchPlan) {
    expect(typeof entry.reason).toBe('string');
    expect(entry.reason.trim().length).toBeGreaterThanOrEqual(20);
  }
});

test('taskDispatchPlan contains no duplicate task entries', () => {
  const { taskDispatchPlan } = mod;
  const tasks = taskDispatchPlan.map((entry) => entry.task);
  expect(new Set(tasks).size).toBe(4);
});
