const resource = (id: string, dependsOn: string[] = [], properties: Record<string, string> = { size: 'small' }, immutable: string[] = []) => ({ id, type: 'generic', properties, dependsOn, immutable });
const network = resource('network');
const subnet = resource('subnet', ['network']);
const vm = resource('vm', ['subnet'], { size: 'small', zone: 'a' }, ['zone']);
const ids = (plan: { changes: Array<{ action: string; id: string }> }) => plan.changes.map((change) => `${change.action}:${change.id}`);

test('creates new resources after the resources they depend on, whatever the order of the list', async () => {
  const plan = mod.planChanges([vm, network, subnet], []);
  expect(ids(plan)).toEqual(['create:network', 'create:subnet', 'create:vm']);
  expect(plan.summary).toEqual({ create: 3, update: 0, replace: 0, delete: 0 });
});

test('updates in place when a mutable property changes and replaces when an immutable one does', async () => {
  const current = [network, subnet, vm];
  const resized = { ...vm, properties: { size: 'large', zone: 'a' } };
  const moved = { ...vm, properties: { size: 'small', zone: 'b' } };
  const both = { ...vm, properties: { size: 'large', zone: 'b' } };
  expect(ids(mod.planChanges([network, subnet, resized], current))).toEqual(['update:vm']);
  expect(ids(mod.planChanges([network, subnet, moved], current))).toEqual(['replace:vm']);
  expect(ids(mod.planChanges([network, subnet, both], current))).toEqual(['replace:vm']);
});

test('treats an added or removed property as a change', async () => {
  const added = { ...subnet, properties: { size: 'small', tier: 'gold' } };
  const removed = { ...vm, properties: { size: 'small' } };
  expect(ids(mod.planChanges([network, added, vm], [network, subnet, vm]))).toEqual(['update:subnet']);
  expect(ids(mod.planChanges([network, subnet, removed], [network, subnet, vm]))).toEqual(['replace:vm']);
});

// beginner mistake: deleting a resource before the resources that depend on it
test('deletes what is no longer desired in reverse dependency order, after the other changes', async () => {
  expect(ids(mod.planChanges([], [network, subnet, vm]))).toEqual(['delete:vm', 'delete:subnet', 'delete:network']);
  const plan = mod.planChanges([resource('queue')], [network, subnet]);
  expect(ids(plan)).toEqual(['create:queue', 'delete:subnet', 'delete:network']);
  expect(plan.summary).toEqual({ create: 1, update: 0, replace: 0, delete: 2 });
});

test('plans nothing when the desired state equals the current state', async () => {
  expect(mod.planChanges([network, subnet, vm], [vm, subnet, network])).toEqual({ changes: [], summary: { create: 0, update: 0, replace: 0, delete: 0 } });
});

test('rejects an unknown dependency and a dependency cycle', async () => {
  expect(() => mod.planChanges([resource('app', ['ghost'])], [])).toThrow('Unknown dependency: ghost');
  expect(() => mod.planChanges([resource('a', ['b']), resource('b', ['a'])], [])).toThrow('Dependency cycle detected');
});
