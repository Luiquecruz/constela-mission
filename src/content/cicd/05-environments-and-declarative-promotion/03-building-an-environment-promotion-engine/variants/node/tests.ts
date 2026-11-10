const DIGEST = 'sha256:b5bb9d8014a0f9b1d61e21e796d78dccdf1352f23cd32812f4850b878ae4944c';
const OTHER = 'sha256:7d865e959b2466918c9863afca942d0fb89d7c9ac0c99bafc3749504ded97730';
const ORDER = ['development', 'staging', 'production'];
const PASSED = { status: 'PASSED' };
const promotion = (targetEnv: string, artifactDigest = DIGEST) => ({ artifactDigest, targetEnv, serviceName: 'api-service' });
const entry = (env: string, status = 'VERIFIED', artifactDigest = DIGEST) => ({ artifactDigest, env, status });
const patchFor = (env: string, digest = DIGEST) => ({ path: `overlays/${env}/kustomization.yaml`, content: `images:\n  - name: api-service\n    digest: ${digest}\n` });

test('promotes into the first environment and pins the image to the digest in its overlay', async () => {
  expect(mod.planPromotion(promotion('development'), PASSED, [], ORDER)).toEqual({ success: true, reason: 'Artifact promoted successfully', patch: patchFor('development') });
});

test('promotes to the next environment once the previous one verified this digest', async () => {
  const plan = mod.planPromotion(promotion('staging'), PASSED, [entry('development')], ORDER);
  expect(plan).toEqual({ success: true, reason: 'Artifact promoted successfully', patch: patchFor('staging') });
});

// beginner mistake: accepting a verified run of another artifact as proof for this one
test('requires the previous environment to have verified this exact digest', async () => {
  const plan = mod.planPromotion(promotion('production'), PASSED, [entry('staging', 'VERIFIED', OTHER), entry('development')], ORDER);
  expect(plan).toEqual({ success: false, reason: 'Verification missing in staging', patch: null });
});

test('does not accept a failed run or a run two environments back as verification', async () => {
  const failed = mod.planPromotion(promotion('production'), PASSED, [entry('staging', 'FAILED')], ORDER);
  expect(failed.reason).toBe('Verification missing in staging');
  const skipped = mod.planPromotion(promotion('production'), PASSED, [entry('development')], ORDER);
  expect(skipped.reason).toBe('Verification missing in staging');
});

test('reports a blocked gate before the environment checks and an unknown environment after it', async () => {
  expect(mod.planPromotion(promotion('qa'), { status: 'BLOCKED' }, [], ORDER)).toEqual({ success: false, reason: 'Quality gate check failed', patch: null });
  expect(mod.planPromotion(promotion('qa'), PASSED, [], ORDER)).toEqual({ success: false, reason: 'Unknown target environment', patch: null });
});

test('rejects a malformed digest and writes the digest in lower case', async () => {
  expect(() => mod.planPromotion(promotion('development', 'latest'), PASSED, [], ORDER)).toThrow('Invalid artifact digest format');
  const upper = 'sha256:' + 'b5bb9d8014a0f9b1d61e21e796d78dccdf1352f23cd32812f4850b878ae4944c'.toUpperCase();
  expect(mod.planPromotion(promotion('development', upper), PASSED, [], ORDER).patch).toEqual(patchFor('development'));
});
