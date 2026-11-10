const DIGEST = 'b5bb9d8014a0f9b1d61e21e796d78dccdf1352f23cd32812f4850b878ae4944c';
const OTHER = '7d865e959b2466918c9863afca942d0fb89d7c9ac0c99bafc3749504ded97730';
const PREDICATE = 'https://slsa.dev/provenance/v1';
const BUILDER = 'https://github.com/actions/runner/github-hosted';

const statement = (overrides: Record<string, unknown> = {}) => ({
  predicateType: PREDICATE,
  builder: { id: BUILDER },
  subject: [{ name: 'api-service.tar.gz', digest: { sha256: DIGEST } }],
  ...overrides,
});

const policy = { expectedPredicateType: PREDICATE, allowedBuilderIds: [BUILDER] };

test('verifies a provenance statement from a trusted builder for the same artifact', async () => {
  expect(mod.verifySlsaProvenance(`sha256:${DIGEST}`, statement(), policy)).toEqual({ valid: true, reason: 'SLSA provenance verified successfully' });
});

test('finds the artifact among several subjects regardless of hexadecimal case', async () => {
  const subjects = [
    { name: 'checksums.txt', digest: { sha256: OTHER } },
    { name: 'api-service.tar.gz', digest: { sha256: DIGEST.toUpperCase() } },
  ];
  expect(mod.verifySlsaProvenance(`sha256:${DIGEST}`, statement({ subject: subjects }), policy).valid).toBe(true);
});

// beginner mistake: trusting the builder and never comparing the artifact digest with the subjects
test('rejects provenance whose subjects do not include the artifact digest', async () => {
  const result = mod.verifySlsaProvenance(`sha256:${OTHER}`, statement(), policy);
  expect(result).toEqual({ valid: false, reason: 'Artifact digest not found in provenance subject' });
});

test('rejects provenance produced by a builder outside the policy', async () => {
  const result = mod.verifySlsaProvenance(`sha256:${DIGEST}`, statement({ builder: { id: 'https://ci.example/self-hosted' } }), policy);
  expect(result).toEqual({ valid: false, reason: 'Builder ID not trusted by SLSA policy' });
});

test('rejects a statement with an unexpected predicate type', async () => {
  const result = mod.verifySlsaProvenance(`sha256:${DIGEST}`, statement({ predicateType: 'https://spdx.dev/Document' }), policy);
  expect(result).toEqual({ valid: false, reason: 'Unsupported SLSA predicate type' });
});

test('refuses a malformed artifact digest before reading the statement', async () => {
  expect(() => mod.verifySlsaProvenance('sha256:abc123', statement(), policy)).toThrow('Invalid artifact digest format');
  expect(() => mod.verifySlsaProvenance(DIGEST, statement(), policy)).toThrow('Invalid artifact digest format');
});
