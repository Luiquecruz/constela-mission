const STEPS = [10, 25, 50];
const LIMITS = { maxErrorRatePercent: 1, maxLatencyP99Ms: 500, minRequests: 100 };
const metrics = (totalRequests: number, errorRequests: number, latencyP99Ms = 200) => ({ totalRequests, errorRequests, latencyP99Ms });

test('advances to the first step when the canary starts healthy', async () => {
  expect(mod.decideCanaryStep(STEPS, 0, metrics(1000, 2), LIMITS)).toEqual({ action: 'ADVANCE', nextWeight: 10, reason: 'Canary healthy, advancing', errorRatePercent: 0.2 });
  expect(mod.decideCanaryStep(STEPS, 0, metrics(800, 3), LIMITS).errorRatePercent).toBe(0.38);
  expect(mod.decideCanaryStep(STEPS, 0, metrics(20000, 201), { ...LIMITS, maxErrorRatePercent: 5 }).errorRatePercent).toBe(1.01);
  expect(mod.decideCanaryStep(STEPS, 50, metrics(25000, 1), { ...LIMITS, maxErrorRatePercent: 0 }).action).toBe('ROLLBACK');
});

test('moves to the first step above the current weight, even when the weight is between steps', async () => {
  expect(mod.decideCanaryStep(STEPS, 25, metrics(1000, 0), LIMITS).nextWeight).toBe(50);
  expect(mod.decideCanaryStep(STEPS, 15, metrics(1000, 0), LIMITS).nextWeight).toBe(25);
});

// beginner mistake: acting on a handful of requests, where one error looks like a 100% failure
test('holds the current weight until there is enough traffic to judge', async () => {
  const decision = mod.decideCanaryStep(STEPS, 10, metrics(1, 1), LIMITS);
  expect(decision).toEqual({ action: 'HOLD', nextWeight: 10, reason: 'Not enough traffic to decide', errorRatePercent: 100 });
  expect(mod.decideCanaryStep(STEPS, 10, metrics(0, 0), LIMITS)).toEqual({ action: 'HOLD', nextWeight: 10, reason: 'Not enough traffic to decide', errorRatePercent: 0 });
});

test('rolls back to zero when the error rate is above the limit and tolerates exactly the limit', async () => {
  expect(mod.decideCanaryStep(STEPS, 25, metrics(1000, 11), LIMITS)).toEqual({ action: 'ROLLBACK', nextWeight: 0, reason: 'Error rate exceeds limit', errorRatePercent: 1.1 });
  expect(mod.decideCanaryStep(STEPS, 25, metrics(1000, 10), LIMITS).action).toBe('ADVANCE');
});

test('rolls back when the latency is above the limit and reports errors first when both fail', async () => {
  expect(mod.decideCanaryStep(STEPS, 25, metrics(1000, 0, 501), LIMITS)).toEqual({ action: 'ROLLBACK', nextWeight: 0, reason: 'Latency exceeds limit', errorRatePercent: 0 });
  expect(mod.decideCanaryStep(STEPS, 25, metrics(1000, 50, 900), LIMITS).reason).toBe('Error rate exceeds limit');
});

test('promotes to full traffic when a healthy canary is at the final step', async () => {
  expect(mod.decideCanaryStep(STEPS, 50, metrics(1000, 1), LIMITS)).toEqual({ action: 'PROMOTE', nextWeight: 100, reason: 'Canary healthy at the final step', errorRatePercent: 0.1 });
});
