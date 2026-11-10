const rules = [
  { id: 'coverage', field: 'coverage', operator: 'gte', value: 80, message: 'Coverage below 80' },
  { id: 'criticals', field: 'criticalVulnerabilities', operator: 'lte', value: 0, message: 'Critical vulnerabilities present' },
  { id: 'branch', field: 'branch', operator: 'in', value: ['main', 'release'], message: 'Deploys come from main or release' },
  { id: 'environment', field: 'environment', operator: 'eq', value: 'production', message: 'Wrong environment' },
];
const good = { coverage: 85, criticalVulnerabilities: 0, branch: 'main', environment: 'production' };

test('allows a deployment when every rule passes', async () => {
  expect(mod.evaluatePolicy(rules, good)).toEqual({ allowed: true, failures: [] });
});

test('treats the numeric limits as inclusive and reports failures in rule order', async () => {
  expect(mod.evaluatePolicy(rules, { ...good, coverage: 80 }).allowed).toBe(true);
  const result = mod.evaluatePolicy(rules, { ...good, coverage: 79, criticalVulnerabilities: 1 });
  expect(result).toEqual({
    allowed: false,
    failures: [
      { ruleId: 'coverage', message: 'Coverage below 80' },
      { ruleId: 'criticals', message: 'Critical vulnerabilities present' },
    ],
  });
});

test('checks membership and equality rules', async () => {
  const result = mod.evaluatePolicy(rules, { ...good, branch: 'feature/x', environment: 'staging' });
  expect(result.failures).toEqual([
    { ruleId: 'branch', message: 'Deploys come from main or release' },
    { ruleId: 'environment', message: 'Wrong environment' },
  ]);
  expect(mod.evaluatePolicy(rules, { ...good, branch: 'release' }).allowed).toBe(true);
});

// beginner mistake: letting a rule pass because its fact is missing instead of failing closed
test('fails a rule whose fact is missing', async () => {
  const { coverage, ...withoutCoverage } = good;
  expect(mod.evaluatePolicy(rules, withoutCoverage)).toEqual({ allowed: false, failures: [{ ruleId: 'coverage', message: 'Coverage below 80' }] });
});

test('rejects an unsupported operator before evaluating any rule', async () => {
  const withUnknown = [...rules, { id: 'name', field: 'branch', operator: 'matches', value: 'ma.*', message: 'Name does not match' }];
  expect(() => mod.evaluatePolicy(withUnknown, { ...good, coverage: 10 })).toThrow('Unsupported operator: matches');
});

test('evaluates every rule independently and allows an empty rule set', async () => {
  const everythingWrong = { coverage: 1, criticalVulnerabilities: 9, branch: 'x', environment: 'y' };
  expect(mod.evaluatePolicy(rules, everythingWrong).failures.map((failure: { ruleId: string }) => failure.ruleId)).toEqual(['coverage', 'criticals', 'branch', 'environment']);
  expect(mod.evaluatePolicy([], {})).toEqual({ allowed: true, failures: [] });
});
