const resource = (id: string, spec: Record<string, string> = { image: 'api:1', replicas: '2' }) => ({ id, spec });
const auto = { autoSync: true, prune: false };

test('reports a cluster that matches Git as in sync with nothing to do', async () => {
  const state = [resource('deployment/api'), resource('service/api', { port: '80' })];
  expect(mod.reconcile(state, state, auto)).toEqual({ inSync: true, toCreate: [], toUpdate: [], toDelete: [], orphaned: [], applied: false });
});

test('creates what is missing and updates what differs, in the order Git lists them', async () => {
  const desired = [resource('service/api', { port: '80' }), resource('deployment/api', { image: 'api:2', replicas: '2' }), resource('config/api', { mode: 'prod' })];
  const live = [resource('deployment/api'), resource('service/api', { port: '80' })];
  expect(mod.reconcile(desired, live, auto)).toEqual({ inSync: false, toCreate: ['config/api'], toUpdate: ['deployment/api'], toDelete: [], orphaned: [], applied: true });
});

// beginner mistake: ignoring resources that exist in the cluster but not in Git
test('treats a resource that only the cluster has as drift: deleted with prune, reported without it', async () => {
  const desired = [resource('deployment/api')];
  const live = [resource('deployment/api'), resource('deployment/debug')];
  expect(mod.reconcile(desired, live, { autoSync: true, prune: true })).toEqual({ inSync: false, toCreate: [], toUpdate: [], toDelete: ['deployment/debug'], orphaned: [], applied: true });
  expect(mod.reconcile(desired, live, { autoSync: true, prune: false })).toEqual({ inSync: false, toCreate: [], toUpdate: [], toDelete: [], orphaned: ['deployment/debug'], applied: false });
});

test('reports drift without changing anything when auto sync is off', async () => {
  const result = mod.reconcile([resource('deployment/api', { image: 'api:2', replicas: '2' })], [resource('deployment/api')], { autoSync: false, prune: true });
  expect(result.inSync).toBe(false);
  expect(result.toUpdate).toEqual(['deployment/api']);
  expect(result.applied).toBe(false);
});

test('compares specs by content, not by key order, and sees an added or removed key as a difference', async () => {
  const live = [resource('deployment/api', { image: 'api:1', replicas: '2' })];
  expect(mod.reconcile([resource('deployment/api', { replicas: '2', image: 'api:1' })], live, auto).inSync).toBe(true);
  expect(mod.reconcile([resource('deployment/api', { image: 'api:1', replicas: '2', env: 'prod' })], live, auto).toUpdate).toEqual(['deployment/api']);
  expect(mod.reconcile([resource('deployment/api', { image: 'api:1' })], live, auto).toUpdate).toEqual(['deployment/api']);
});

test('applies nothing when the only drift is an orphan that pruning is not allowed to remove', async () => {
  const result = mod.reconcile([resource('deployment/api')], [resource('deployment/api'), resource('job/leftover')], auto);
  expect(result).toEqual({ inSync: false, toCreate: [], toUpdate: [], toDelete: [], orphaned: ['job/leftover'], applied: false });
});
