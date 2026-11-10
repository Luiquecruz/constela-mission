const change = (riskScore: number, databaseMigration = false) => ({ id: 'rel-1', riskScore, databaseMigration });
const cluster = (availableCapacityPercent = 60, maxCanaryTrafficPercent = 25) => ({ availableCapacityPercent, maxCanaryTrafficPercent });

test('rolls out a low risk change gradually', async () => {
  expect(mod.selectDeploymentStrategy(change(10), cluster())).toEqual({ allowed: true, strategy: 'ROLLING', reason: 'Low risk change suitable for rolling deployment' });
});

test('switches to a canary at a risk score of 70 and not before', async () => {
  expect(mod.selectDeploymentStrategy(change(69), cluster()).strategy).toBe('ROLLING');
  expect(mod.selectDeploymentStrategy(change(70), cluster())).toEqual({ allowed: true, strategy: 'CANARY', reason: 'High risk change requires canary deployment' });
});

// beginner mistake: judging only the risk score and forgetting that a database migration is risky on its own
test('requires a canary for a database migration even when the risk score is zero', async () => {
  expect(mod.selectDeploymentStrategy(change(0, true), cluster()).strategy).toBe('CANARY');
});

test('allows exactly 20% available capacity and refuses less', async () => {
  expect(mod.selectDeploymentStrategy(change(10), cluster(20)).allowed).toBe(true);
  expect(mod.selectDeploymentStrategy(change(10), cluster(19))).toEqual({ allowed: false, strategy: 'NONE', reason: 'Insufficient cluster capacity' });
});

test('checks capacity before risk', async () => {
  expect(mod.selectDeploymentStrategy(change(95, true), cluster(5)).reason).toBe('Insufficient cluster capacity');
});

test('refuses a risky change on a cluster that allows no canary traffic but still rolls out a safe one', async () => {
  expect(mod.selectDeploymentStrategy(change(90), cluster(60, 0))).toEqual({ allowed: false, strategy: 'NONE', reason: 'Canary traffic is not allowed on this cluster' });
  expect(mod.selectDeploymentStrategy(change(10), cluster(60, 0)).strategy).toBe('ROLLING');
});
