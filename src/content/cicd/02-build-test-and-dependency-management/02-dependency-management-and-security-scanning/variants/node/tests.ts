const policy = { minLineCoveragePercent: 80, securityThreshold: 'high' };
const vulnerability = (id: string, severity: string, pkg = 'lodash') => ({ id, severity, package: pkg });

test('approves a build with enough coverage and no blocking vulnerability', async () => {
  const summary = { lineCoveragePercent: 91, vulnerabilities: [vulnerability('CVE-1', 'low'), vulnerability('CVE-2', 'medium')] };
  expect(mod.evaluateTestAndSecuritySummary(summary, policy)).toEqual({ approved: true, violations: [] });
});

test('reports coverage below the minimum with both numbers', async () => {
  const result = mod.evaluateTestAndSecuritySummary({ lineCoveragePercent: 72, vulnerabilities: [] }, policy);
  expect(result).toEqual({ approved: false, violations: ['Line coverage 72% is below minimum required 80%'] });
});

test('accepts coverage exactly at the minimum', async () => {
  expect(mod.evaluateTestAndSecuritySummary({ lineCoveragePercent: 80, vulnerabilities: [] }, policy).approved).toBe(true);
});

// beginner mistake: comparing severity names as text instead of by rank
test('blocks only vulnerabilities at or above the threshold rank', async () => {
  const summary = { lineCoveragePercent: 90, vulnerabilities: [vulnerability('CVE-1', 'medium'), vulnerability('CVE-2', 'high', 'express'), vulnerability('CVE-3', 'critical', 'tar')] };
  expect(mod.evaluateTestAndSecuritySummary(summary, policy).violations).toEqual([
    'Vulnerability CVE-2 (high) in package express exceeds allowed threshold high',
    'Vulnerability CVE-3 (critical) in package tar exceeds allowed threshold high',
  ]);
});

test('lets a critical-only threshold ignore high vulnerabilities', async () => {
  const summary = { lineCoveragePercent: 90, vulnerabilities: [vulnerability('CVE-2', 'high'), vulnerability('CVE-3', 'critical')] };
  const result = mod.evaluateTestAndSecuritySummary(summary, { ...policy, securityThreshold: 'critical' });
  expect(result.violations).toEqual(['Vulnerability CVE-3 (critical) in package lodash exceeds allowed threshold critical']);
});

test('lists the coverage violation first and then each vulnerability in input order', async () => {
  const summary = { lineCoveragePercent: 50, vulnerabilities: [vulnerability('B', 'critical'), vulnerability('A', 'high')] };
  const result = mod.evaluateTestAndSecuritySummary(summary, policy);
  expect(result.approved).toBe(false);
  expect(result.violations.map((line: string) => line.split(' ')[0] + ' ' + line.split(' ')[1])).toEqual(['Line coverage', 'Vulnerability B', 'Vulnerability A']);
});
