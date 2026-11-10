const policy = { minLineCoveragePercent: 80, maxCriticalVulnerabilities: 0, maxHighVulnerabilities: 2, minApprovedReviews: 2, requireAllChecksPassed: true, allowOverride: true };
const telemetry = (overrides: Record<string, unknown> = {}) => ({ lineCoveragePercent: 90, criticalVulnerabilities: 0, highVulnerabilities: 1, approvedReviews: 2, requiredChecksPassed: true, ...overrides });
const NOW = 1_700_000_000_000;

test('passes a release that meets every threshold, including values exactly at the limits', async () => {
  expect(mod.evaluateQualityGate(telemetry(), policy)).toEqual({ status: 'PASSED', violations: [] });
  expect(mod.evaluateQualityGate(telemetry({ lineCoveragePercent: 80, highVulnerabilities: 2 }), policy).status).toBe('PASSED');
});

test('blocks a release and lists every violation in check order', async () => {
  const bad = telemetry({ lineCoveragePercent: 70, criticalVulnerabilities: 2, highVulnerabilities: 5, approvedReviews: 1, requiredChecksPassed: false });
  expect(mod.evaluateQualityGate(bad, policy)).toEqual({
    status: 'BLOCKED',
    violations: [
      'Line coverage 70% is below minimum 80%',
      'Critical vulnerabilities 2 exceed maximum 0',
      'High vulnerabilities 5 exceed maximum 2',
      'Approved reviews 1 is below minimum 2',
      'Required status checks failed',
    ],
  });
});

test('ignores failed status checks when the policy does not require them', async () => {
  const relaxed = { ...policy, requireAllChecksPassed: false };
  expect(mod.evaluateQualityGate(telemetry({ requiredChecksPassed: false }), relaxed).status).toBe('PASSED');
});

test('needs no override for a gate that already passed', async () => {
  const passed = mod.evaluateQualityGate(telemetry(), policy);
  expect(mod.applyEmergencyOverride(passed, { author: 'ana', justification: 'urgent' }, policy, NOW)).toEqual({ success: true, status: 'PASSED', auditLog: null });
});

// beginner mistake: accepting an override whose justification is only whitespace
test('refuses an override without a real justification or when the policy forbids it', async () => {
  const blocked = mod.evaluateQualityGate(telemetry({ approvedReviews: 0 }), policy);
  expect(mod.applyEmergencyOverride(blocked, { author: 'ana', justification: '   ' }, policy, NOW)).toEqual({ success: false, status: 'BLOCKED', auditLog: null });
  expect(mod.applyEmergencyOverride(blocked, { author: 'ana', justification: 'incident 42' }, { ...policy, allowOverride: false }, NOW)).toEqual({ success: false, status: 'BLOCKED', auditLog: null });
});

test('records who, why, when and what was bypassed when an override is accepted', async () => {
  const blocked = mod.evaluateQualityGate(telemetry({ approvedReviews: 1, requiredChecksPassed: false }), policy);
  const result = mod.applyEmergencyOverride(blocked, { author: 'ana', justification: 'incident 42: hotfix for checkout' }, policy, NOW);
  expect(result).toEqual({
    success: true,
    status: 'PASSED_WITH_OVERRIDE',
    auditLog: { author: 'ana', justification: 'incident 42: hotfix for checkout', timestamp: NOW, violations: ['Approved reviews 1 is below minimum 2', 'Required status checks failed'] },
  });
  expect(result.auditLog.violations).not.toBe(blocked.violations);
});
