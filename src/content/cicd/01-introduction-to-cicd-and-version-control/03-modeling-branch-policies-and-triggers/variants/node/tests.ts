const policy = { allowedBranchPrefixes: ['feature/', 'fix/'], allowedTargets: ['main'], maxFilesChanged: 20, minApprovers: 2 };
const pr = (overrides: Record<string, unknown> = {}) => ({ branchName: 'feature/checkout-retry', targetBranch: 'main', filesChangedCount: 6, approversCount: 2, ...overrides });

test('approves a feature branch into main that meets every rule', async () => {
  expect(mod.validatePullRequest(pr(), policy)).toEqual({ approved: true, violations: [] });
});

test('flags a pull request aimed at a branch outside the allowed targets', async () => {
  expect(mod.validatePullRequest(pr({ targetBranch: 'release/legacy' }), policy)).toEqual({ approved: false, violations: ["Target branch 'release/legacy' is not allowed"] });
});

test('names the branch that has no allowed prefix', async () => {
  expect(mod.validatePullRequest(pr({ branchName: 'wip-login' }), policy).violations).toEqual(["Branch name 'wip-login' does not match allowed prefixes"]);
});

test('allows exactly the maximum number of changed files and flags one more', async () => {
  expect(mod.validatePullRequest(pr({ filesChangedCount: 20 }), policy).approved).toBe(true);
  expect(mod.validatePullRequest(pr({ filesChangedCount: 21 }), policy).violations).toEqual(['Files changed (21) exceeds maximum allowed (20)']);
});

// beginner mistake: treating one approval as enough when the policy asks for two reviewers
test('requires the minimum number of approvals', async () => {
  expect(mod.validatePullRequest(pr({ approversCount: 1 }), policy).violations).toEqual(['Approvers count (1) is below minimum required (2)']);
});

test('lists every violation in rule order', async () => {
  const result = mod.validatePullRequest(pr({ targetBranch: 'develop', branchName: 'tmp', filesChangedCount: 40, approversCount: 0 }), policy);
  expect(result).toEqual({
    approved: false,
    violations: [
      "Target branch 'develop' is not allowed",
      "Branch name 'tmp' does not match allowed prefixes",
      'Files changed (40) exceeds maximum allowed (20)',
      'Approvers count (0) is below minimum required (2)',
    ],
  });
});
