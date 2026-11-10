const MIN = 60_000;
const deployment = (id: string, status: string, leadTimeMinutes: number) => ({ id, timestamp: 1_700_000_000_000, status, leadTimeMinutes });
const incident = (id: string, minutes: number | null) => ({ id, deploymentId: 'd', createdTimestamp: 1_700_000_000_000, resolvedTimestamp: minutes === null ? null : 1_700_000_000_000 + minutes * MIN });
const metrics = (overrides: Record<string, number> = {}) => ({ deploymentFrequencyPerDay: 2, changeFailureRatePercent: 3, meanLeadTimeMinutes: 30, meanTimeToRestoreMinutes: 20, ...overrides });

test('computes frequency, failure rate and lead time over the window', async () => {
  const deployments = [deployment('a', 'SUCCESS', 60), deployment('b', 'FAILURE', 120), deployment('c', 'SUCCESS', 30), deployment('d', 'SUCCESS', 90)];
  expect(mod.calculateDoraMetrics(deployments, [], 2)).toEqual({ deploymentFrequencyPerDay: 2, changeFailureRatePercent: 25, meanLeadTimeMinutes: 75, meanTimeToRestoreMinutes: 0 });
});

// beginner mistake: counting an incident that is still open as if it had been restored instantly
test('averages the restore time of resolved incidents only', async () => {
  const deployments = [deployment('a', 'SUCCESS', 10)];
  const incidents = [incident('i1', 30), incident('i2', 90), incident('i3', null)];
  expect(mod.calculateDoraMetrics(deployments, incidents, 1).meanTimeToRestoreMinutes).toBe(60);
  expect(mod.calculateDoraMetrics(deployments, [incident('i3', null)], 1).meanTimeToRestoreMinutes).toBe(0);
});

test('rounds to two decimals, returns zeros without deployments and rejects a window that is not positive', async () => {
  const deployments = [deployment('a', 'FAILURE', 10), deployment('b', 'SUCCESS', 10), deployment('c', 'SUCCESS', 11)];
  const result = mod.calculateDoraMetrics(deployments, [], 7);
  expect(result.deploymentFrequencyPerDay).toBe(0.43);
  expect(result.changeFailureRatePercent).toBe(33.33);
  expect(result.meanLeadTimeMinutes).toBe(10.33);
  expect(mod.calculateDoraMetrics([], [], 7)).toEqual({ deploymentFrequencyPerDay: 0, changeFailureRatePercent: 0, meanLeadTimeMinutes: 0, meanTimeToRestoreMinutes: 0 });
  expect(() => mod.calculateDoraMetrics(deployments, [], 0)).toThrow('Window must be positive');
});

test('classifies a team at the elite limits as elite and just outside them as high', async () => {
  expect(mod.classifyPerformance(metrics({ deploymentFrequencyPerDay: 1, changeFailureRatePercent: 5, meanLeadTimeMinutes: 60, meanTimeToRestoreMinutes: 60 }))).toBe('ELITE');
  expect(mod.classifyPerformance(metrics({ meanLeadTimeMinutes: 61 }))).toBe('HIGH');
  expect(mod.classifyPerformance(metrics({ deploymentFrequencyPerDay: 0.5 }))).toBe('HIGH');
});

test('lets the weakest of the four measures decide the tier', async () => {
  expect(mod.classifyPerformance(metrics({ changeFailureRatePercent: 40 }))).toBe('LOW');
  expect(mod.classifyPerformance(metrics({ meanTimeToRestoreMinutes: 5000 }))).toBe('MEDIUM');
  expect(mod.classifyPerformance(metrics({ deploymentFrequencyPerDay: 0.01 }))).toBe('LOW');
});

test('turns a service level objective into an error budget that gates releases', async () => {
  expect(mod.errorBudget(99.9, 100000, 40)).toEqual({ allowedFailures: 100, remainingFailures: 60, releasesAllowed: true });
  expect(mod.errorBudget(99.9, 100000, 100)).toEqual({ allowedFailures: 100, remainingFailures: 0, releasesAllowed: false });
  expect(mod.errorBudget(99.9, 100000, 150)).toEqual({ allowedFailures: 100, remainingFailures: -50, releasesAllowed: false });
});
