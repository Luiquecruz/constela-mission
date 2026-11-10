const NOW = 1_700_000_000_000;
const active = (prId: string) => ({ prId, name: `preview-pr-${prId}`, createdAt: NOW - 1000, status: 'ACTIVE' });
const terminated = (prId: string) => ({ ...active(prId), status: 'TERMINATED' });

test('provisions a preview environment named after the pull request', async () => {
  const result = mod.manageEphemeralEnvironment({ type: 'PROVISION', prId: '42', now: NOW }, [], 3);
  expect(result).toEqual({
    success: true,
    reason: 'Environment provisioned successfully',
    environment: { prId: '42', name: 'preview-pr-42', createdAt: NOW, status: 'ACTIVE' },
  });
});

test('refuses to provision when the active pool is full', async () => {
  const result = mod.manageEphemeralEnvironment({ type: 'PROVISION', prId: '9', now: NOW }, [active('1'), active('2')], 2);
  expect(result).toEqual({ success: false, reason: 'Active ephemeral environment pool limit reached', environment: null });
});

// beginner mistake: counting terminated environments against the pool and never freeing the slot
test('does not count terminated environments against the pool', async () => {
  const result = mod.manageEphemeralEnvironment({ type: 'PROVISION', prId: '9', now: NOW }, [active('1'), terminated('2'), terminated('3')], 2);
  expect(result.success).toBe(true);
});

test('refuses a second environment for a pull request that already has one', async () => {
  const result = mod.manageEphemeralEnvironment({ type: 'PROVISION', prId: '1', now: NOW }, [active('1')], 5);
  expect(result).toEqual({ success: false, reason: 'Environment already provisioned for this PR', environment: null });
});

test('provisions again for a pull request whose previous environment was torn down', async () => {
  const result = mod.manageEphemeralEnvironment({ type: 'PROVISION', prId: '1', now: NOW }, [terminated('1')], 5);
  expect(result.success).toBe(true);
  expect(result.environment.status).toBe('ACTIVE');
});

test('tears down the active environment of a pull request and reports an unknown one', async () => {
  const done = mod.manageEphemeralEnvironment({ type: 'TEARDOWN', prId: '1', now: NOW }, [active('1'), active('2')], 5);
  expect(done).toEqual({ success: true, reason: 'Environment torn down successfully', environment: { ...active('1'), status: 'TERMINATED' } });
  const missing = mod.manageEphemeralEnvironment({ type: 'TEARDOWN', prId: '7', now: NOW }, [active('1'), terminated('7')], 5);
  expect(missing).toEqual({ success: false, reason: 'Environment not found for teardown', environment: null });
});
