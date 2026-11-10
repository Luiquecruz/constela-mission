const flag = (overrides: Record<string, unknown> = {}) => ({ key: 'checkout-v2', enabled: true, emergencyKillSwitch: false, targetSegments: [], rolloutPercent: 100, ...overrides });
const user = (userId: string, userSegment = 'beta') => ({ userId, userSegment });

test('gives every user a stable bucket from 0 to 99 that depends on the flag key', async () => {
  expect(mod.bucketFor('checkout-v2', 'alice')).toBe(34);
  expect(mod.bucketFor('checkout-v2', 'bob')).toBe(89);
  expect(mod.bucketFor('checkout-v2', 'dave')).toBe(0);
  expect(mod.bucketFor('search-ui', 'alice')).toBe(44);
});

test('lets the kill switch win over every other setting', async () => {
  const result = mod.evaluateFeatureFlag(flag({ emergencyKillSwitch: true, enabled: true, rolloutPercent: 100, targetSegments: ['beta'] }), user('alice'));
  expect(result).toEqual({ active: false, reason: 'Emergency kill switch is active' });
});

test('keeps a disabled flag off for everyone', async () => {
  expect(mod.evaluateFeatureFlag(flag({ enabled: false }), user('alice'))).toEqual({ active: false, reason: 'Feature flag is disabled' });
});

test('targets only the listed segments and treats an empty list as everyone', async () => {
  const targeted = flag({ targetSegments: ['staff'] });
  expect(mod.evaluateFeatureFlag(targeted, user('alice', 'beta'))).toEqual({ active: false, reason: 'User segment not targeted' });
  expect(mod.evaluateFeatureFlag(targeted, user('alice', 'staff')).active).toBe(true);
  expect(mod.evaluateFeatureFlag(flag(), user('alice', 'anything')).active).toBe(true);
});

// beginner mistake: drawing a random number on every evaluation so the same user flickers in and out
test('decides the rollout from the bucket, so the same user always gets the same answer', async () => {
  expect(mod.evaluateFeatureFlag(flag({ rolloutPercent: 35 }), user('alice')).active).toBe(true);
  expect(mod.evaluateFeatureFlag(flag({ rolloutPercent: 34 }), user('alice'))).toEqual({ active: false, reason: 'User outside rollout percentage' });
  expect(mod.evaluateFeatureFlag(flag({ rolloutPercent: 0 }), user('dave')).active).toBe(false);
  expect(mod.evaluateFeatureFlag(flag({ rolloutPercent: 1 }), user('dave')).active).toBe(true);
  for (let attempt = 0; attempt < 5; attempt++) {
    expect(mod.evaluateFeatureFlag(flag({ rolloutPercent: 50 }), user('bob')).active).toBe(false);
  }
});

test('keeps a user in the rollout when the percentage grows', async () => {
  const users = ['alice', 'bob', 'carol', 'dave', 'erin', 'judy'];
  let previous = new Set<string>();
  for (const percent of [0, 10, 25, 50, 75, 100]) {
    const current = new Set(users.filter((id) => mod.evaluateFeatureFlag(flag({ rolloutPercent: percent }), user(id)).active));
    for (const id of previous) {
      expect(current.has(id)).toBe(true);
    }
    previous = current;
  }
  expect(previous.size).toBe(users.length);
});
