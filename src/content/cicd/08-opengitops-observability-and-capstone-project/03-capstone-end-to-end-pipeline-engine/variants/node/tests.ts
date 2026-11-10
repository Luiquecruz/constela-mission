const DIGEST = 'sha256:b5bb9d8014a0f9b1d61e21e796d78dccdf1352f23cd32812f4850b878ae4944c';
const OTHER = 'sha256:7d865e959b2466918c9863afca942d0fb89d7c9ac0c99bafc3749504ded97730';
const NOW = 1_700_000_000;
const BUILDER = 'https://github.com/actions/runner/github-hosted';

const release = (overrides: Record<string, unknown> = {}) => ({
  tasks: [
    { id: 'install', dependencies: [], command: 'npm ci' },
    { id: 'lint', dependencies: ['install'], command: 'npm run lint' },
    { id: 'test', dependencies: ['install'], command: 'npm test' },
    { id: 'package', dependencies: ['lint', 'test'], command: 'npm run build' },
  ],
  facts: { coverage: 91, criticalVulnerabilities: 0 },
  rules: [
    { id: 'coverage', field: 'coverage', operator: 'gte', value: 80, message: 'Coverage below 80' },
    { id: 'criticals', field: 'criticalVulnerabilities', operator: 'lte', value: 0, message: 'Critical vulnerabilities present' },
  ],
  oidc: {
    claims: { iss: 'issuer', aud: 'audience', sub: 'repo:org/api:environment:production', exp: NOW + 300 },
    policy: { expectedIssuer: 'issuer', expectedAudience: 'audience', allowedSubjects: ['repo:org/api:environment:production'] },
  },
  artifact: { digest: DIGEST, builderId: BUILDER, subjectDigests: [DIGEST], trustedBuilders: [BUILDER] },
  promotion: {
    targetEnv: 'production',
    serviceName: 'api-service',
    environments: ['staging', 'production'],
    history: [{ artifactDigest: DIGEST, env: 'staging', status: 'VERIFIED' }],
  },
  ...overrides,
});

test('releases when every stage passes and returns the batches and the manifest patch', async () => {
  const report = mod.runRelease(release(), NOW);
  expect(report.outcome).toBe('RELEASED');
  expect(report.passedStages).toEqual(['build', 'gate', 'identity', 'provenance', 'promotion']);
  expect(report.batches).toEqual([['install'], ['lint', 'test'], ['package']]);
  expect(report.patch).toEqual({ path: 'overlays/production/kustomization.yaml', content: `images:\n  - name: api-service\n    digest: ${DIGEST}\n` });
});

test('rejects at the build stage on a cycle and reports nothing else', async () => {
  const cyclic = [{ id: 'a', dependencies: ['b'], command: 'a' }, { id: 'b', dependencies: ['a'], command: 'b' }];
  expect(mod.runRelease(release({ tasks: cyclic }), NOW)).toEqual({ outcome: 'REJECTED', stage: 'build', passedStages: [], reasons: ['Cyclic dependency detected'], batches: [], patch: null });
});

test('rejects at the gate and lists the message of every failed rule', async () => {
  const report = mod.runRelease(release({ facts: { coverage: 40, criticalVulnerabilities: 3 } }), NOW);
  expect(report.stage).toBe('gate');
  expect(report.reasons).toEqual(['Coverage below 80', 'Critical vulnerabilities present']);
  expect(report.passedStages).toEqual(['build']);
  expect(report.batches).toEqual([['install'], ['lint', 'test'], ['package']]);
});

test('rejects at the identity stage for an expired token and for a subject that is not allowed', async () => {
  const base = release();
  const expired = { ...base.oidc, claims: { ...base.oidc.claims, exp: NOW } };
  expect(mod.runRelease(release({ oidc: expired }), NOW)).toMatchObject({ stage: 'identity', reasons: ['OIDC token expired'], passedStages: ['build', 'gate'] });
  const wrongSubject = { ...base.oidc, claims: { ...base.oidc.claims, sub: 'repo:org/api:pull_request' } };
  expect(mod.runRelease(release({ oidc: wrongSubject }), NOW)).toMatchObject({ stage: 'identity', reasons: ['Subject not allowed by OIDC policy'] });
});

// beginner mistake: trusting a valid identity without checking that the artifact is the one the trusted builder produced
test('rejects a valid identity that deploys an artifact missing from its provenance', async () => {
  const base = release();
  const report = mod.runRelease(release({ artifact: { ...base.artifact, digest: OTHER } }), NOW);
  expect(report).toMatchObject({ outcome: 'REJECTED', stage: 'provenance', reasons: ['Artifact digest not found in provenance'], passedStages: ['build', 'gate', 'identity'] });
  const untrusted = mod.runRelease(release({ artifact: { ...base.artifact, builderId: 'https://ci.example/self-hosted' } }), NOW);
  expect(untrusted.reasons).toEqual(['Builder is not trusted']);
});

test('rejects a promotion without verification in the previous environment and stops at the first failing stage', async () => {
  const base = release();
  const unverified = { ...base.promotion, history: [] };
  expect(mod.runRelease(release({ promotion: unverified }), NOW)).toMatchObject({ stage: 'promotion', reasons: ['Verification missing in staging'], patch: null });
  const failingEverywhere = release({ facts: { coverage: 1, criticalVulnerabilities: 0 }, promotion: unverified });
  expect(mod.runRelease(failingEverywhere, NOW).stage).toBe('gate');
});
