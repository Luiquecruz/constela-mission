const ISSUER = 'https://token.actions.githubusercontent.com';
const BUILDER = 'https://github.com/actions/runner/github-hosted';
const DIGEST = 'sha256:b5bb9d8014a0f9b1d61e21e796d78dccdf1352f23cd32812f4850b878ae4944c';
const OTHER = 'sha256:7d865e959b2466918c9863afca942d0fb89d7c9ac0c99bafc3749504ded97730';
const PRODUCTION = 'repo:org/api-service:environment:production';
const NOW = 1_700_000_000;

const policy = {
  issuer: ISSUER,
  awsSubjectPatterns: ['repo:org/api-service:environment:*'],
  azureSubjects: [PRODUCTION],
  trustedBuilders: [BUILDER],
};

const deployment = (target: string, overrides: { claims?: Record<string, unknown>; provenance?: Record<string, unknown>; artifactDigest?: string } = {}) => ({
  target,
  claims: { iss: ISSUER, aud: target === 'azure' ? 'api://AzureADTokenExchange' : 'sts.amazonaws.com', sub: PRODUCTION, exp: NOW + 300, ...overrides.claims },
  artifactDigest: overrides.artifactDigest ?? DIGEST,
  provenance: { predicateType: 'https://slsa.dev/provenance/v1', builderId: BUILDER, subjectDigests: [DIGEST], ...overrides.provenance },
});

test('allows a production deployment to AWS through a wildcard environment subject', async () => {
  expect(mod.authorizeDeployment(deployment('aws'), policy, NOW)).toEqual({ allowed: true, reasons: [] });
  expect(mod.authorizeDeployment(deployment('aws', { claims: { sub: 'repo:org/api-service:environment:staging' } }), policy, NOW).allowed).toBe(true);
});

test('allows Azure only when the subject matches a federated credential exactly', async () => {
  expect(mod.authorizeDeployment(deployment('azure'), policy, NOW).allowed).toBe(true);
  const wildcardOnly = { ...policy, azureSubjects: ['repo:org/api-service:environment:*'] };
  expect(mod.authorizeDeployment(deployment('azure'), wildcardOnly, NOW)).toEqual({ allowed: false, reasons: ['Subject is not trusted for this cloud'] });
});

test('requires the audience that each cloud expects', async () => {
  expect(mod.expectedAudience('aws')).toBe('sts.amazonaws.com');
  expect(mod.expectedAudience('azure')).toBe('api://AzureADTokenExchange');
  const azureTokenSentToAws = deployment('aws', { claims: { aud: 'api://AzureADTokenExchange' } });
  expect(mod.authorizeDeployment(azureTokenSentToAws, policy, NOW).reasons).toEqual(['Audience does not match the cloud target']);
});

test('reports every failed check in order instead of stopping at the first', async () => {
  const bad = deployment('aws', {
    claims: { iss: 'https://issuer.example', exp: NOW },
    provenance: { predicateType: 'https://spdx.dev/Document', builderId: 'https://ci.example/self-hosted' },
  });
  expect(mod.authorizeDeployment(bad, policy, NOW).reasons).toEqual([
    'Issuer is not trusted',
    'Token expired',
    'Unsupported provenance predicate type',
    'Builder is not trusted',
  ]);
});

// beginner mistake: trusting a valid identity and deploying an artifact that the provenance never mentions
test('blocks a valid identity that deploys an artifact missing from the provenance', async () => {
  const decision = mod.authorizeDeployment(deployment('azure', { artifactDigest: OTHER }), policy, NOW);
  expect(decision).toEqual({ allowed: false, reasons: ['Artifact digest not found in provenance'] });
});

test('rejects a cloud target that has no trust configuration', async () => {
  expect(() => mod.expectedAudience('gcp')).toThrow('Unsupported cloud target');
  expect(() => mod.authorizeDeployment(deployment('gcp'), policy, NOW)).toThrow('Unsupported cloud target');
});
