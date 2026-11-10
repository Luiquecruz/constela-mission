const DIGEST = 'sha256:b5bb9d8014a0f9b1d61e21e796d78dccdf1352f23cd32812f4850b878ae4944c';
const OTHER = 'sha256:7d865e959b2466918c9863afca942d0fb89d7c9ac0c99bafc3749504ded97730';
const promotion = (targetEnv: string, artifactDigest = DIGEST) => ({ artifactDigest, targetEnv, promotedBy: 'ci-bot' });
const entry = (env: string, status: string, artifactDigest = DIGEST) => ({ artifactDigest, env, status });

test('approves a first deployment to staging', async () => {
  expect(mod.validateEnvironmentPromotion(promotion('staging'), [])).toEqual({ allowed: true, reason: 'Promotion to staging approved' });
});

test('blocks a staging promotion of an artifact that failed there before', async () => {
  const result = mod.validateEnvironmentPromotion(promotion('staging'), [entry('staging', 'FAILED')]);
  expect(result).toEqual({ allowed: false, reason: 'Artifact failed prior staging deployment' });
});

test('approves production after a verified staging deployment of the same artifact', async () => {
  const result = mod.validateEnvironmentPromotion(promotion('production'), [entry('staging', 'VERIFIED')]);
  expect(result).toEqual({ allowed: true, reason: 'Promotion to production approved' });
});

// beginner mistake: accepting a verified staging deployment of a different artifact as proof for this one
test('does not accept another artifact, a failed run or another environment as proof for production', async () => {
  const blocked = { allowed: false, reason: 'Promotion to production requires verified staging deployment' };
  expect(mod.validateEnvironmentPromotion(promotion('production'), [entry('staging', 'VERIFIED', OTHER)])).toEqual(blocked);
  expect(mod.validateEnvironmentPromotion(promotion('production'), [entry('staging', 'FAILED')])).toEqual(blocked);
  expect(mod.validateEnvironmentPromotion(promotion('production'), [entry('development', 'VERIFIED')])).toEqual(blocked);
  expect(mod.validateEnvironmentPromotion(promotion('production'), [])).toEqual(blocked);
});

test('rejects a target environment that is not part of the pipeline', async () => {
  expect(mod.validateEnvironmentPromotion(promotion('qa'), [])).toEqual({ allowed: false, reason: 'Unknown target environment' });
});

test('rejects a malformed artifact digest before reading the history', async () => {
  expect(() => mod.validateEnvironmentPromotion(promotion('staging', 'latest'), [])).toThrow('Invalid artifact digest format');
  expect(() => mod.validateEnvironmentPromotion(promotion('production', 'sha256:abc'), [entry('staging', 'VERIFIED')])).toThrow('Invalid artifact digest format');
});
