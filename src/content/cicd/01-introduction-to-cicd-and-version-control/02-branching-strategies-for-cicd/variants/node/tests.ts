const DAY = 86400000;
const NOW = 1700000000000;
const policy = { allowedPrefixes: ['feature/', 'fix/'], maxAgeDays: 2 };
const branch = (name: string, ageDays: number) => ({ name, createdAt: NOW - ageDays * DAY });

test('allows a young branch with an allowed prefix', async () => {
  expect(mod.evaluateBranchPolicy(branch('feature/checkout-retry', 0.5), policy, NOW)).toEqual({ allowed: true, reason: 'Branch complies with branching policy' });
});

test('rejects a branch older than the maximum age', async () => {
  expect(mod.evaluateBranchPolicy(branch('fix/timeout', 2.5), policy, NOW)).toEqual({ allowed: false, reason: 'Branch age exceeds maximum threshold' });
});

test('allows a branch whose age equals the maximum exactly', async () => {
  expect(mod.evaluateBranchPolicy(branch('fix/timeout', 2), policy, NOW).allowed).toBe(true);
});

test('rejects a name without an allowed prefix, comparing letter case exactly', async () => {
  expect(mod.evaluateBranchPolicy(branch('hotfix/login', 1), policy, NOW)).toEqual({ allowed: false, reason: 'Branch name violates prefix policy' });
  expect(mod.evaluateBranchPolicy(branch('Feature/login', 1), policy, NOW).allowed).toBe(false);
});

// beginner mistake: searching for the prefix anywhere in the name instead of at the start
test('requires the prefix at the start of the name', async () => {
  expect(mod.evaluateBranchPolicy(branch('experiment/feature/login', 1), policy, NOW)).toEqual({ allowed: false, reason: 'Branch name violates prefix policy' });
});

test('reports the age first when a branch breaks both rules', async () => {
  expect(mod.evaluateBranchPolicy(branch('wip-login', 10), policy, NOW).reason).toBe('Branch age exceeds maximum threshold');
});
