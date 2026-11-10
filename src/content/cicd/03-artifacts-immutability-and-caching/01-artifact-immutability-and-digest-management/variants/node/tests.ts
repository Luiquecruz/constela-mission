const DIGEST = 'sha256:b5bb9d8014a0f9b1d61e21e796d78dccdf1352f23cd32812f4850b878ae4944c';
const OTHER = 'sha256:7d865e959b2466918c9863afca942d0fb89d7c9ac0c99bafc3749504ded97730';
const artifact = (digest: string) => ({ name: 'api-service', version: '1.4.0', digest });

test('confirms an artifact whose digest equals the expected one', async () => {
  expect(mod.verifyArtifactImmutability(artifact(DIGEST), DIGEST)).toEqual({ verified: true, match: true, reason: 'Artifact digest matches expected checksum' });
});

test('reports a different digest as a mismatch without failing', async () => {
  expect(mod.verifyArtifactImmutability(artifact(OTHER), DIGEST)).toEqual({ verified: true, match: false, reason: 'Artifact digest mismatch detected' });
});

test('compares hexadecimal digits without regard to letter case', async () => {
  const upper = 'sha256:' + 'b5bb9d8014a0f9b1d61e21e796d78dccdf1352f23cd32812f4850b878ae4944c'.toUpperCase();
  expect(mod.verifyArtifactImmutability(artifact(upper), DIGEST).match).toBe(true);
});

// beginner mistake: trusting a mutable tag such as latest as if it were a digest
test('never matches a mutable tag against a digest', async () => {
  expect(mod.verifyArtifactImmutability(artifact('latest'), DIGEST).match).toBe(false);
  expect(mod.verifyArtifactImmutability(artifact('1.4.0'), DIGEST).match).toBe(false);
});

test('rejects an expected value that is not a sha256 digest', async () => {
  for (const bad of ['b5bb9d8014a0f9b1d61e21e796d78dccdf1352f23cd32812f4850b878ae4944c', 'sha256:abc123', 'sha1:b5bb9d8014a0f9b1d61e21e796d78dccdf1352f2', 'sha256:' + 'g'.repeat(64)]) {
    expect(() => mod.verifyArtifactImmutability(artifact(DIGEST), bad)).toThrow('Invalid SHA256 digest format');
  }
});

test('rejects a sha256 digest with the wrong length', async () => {
  expect(() => mod.verifyArtifactImmutability(artifact(DIGEST), 'sha256:b5bb9d8014a0f9b1d61e21e796d78dccdf1352f23cd32812f4850b878ae4944c00')).toThrow('Invalid SHA256 digest format');
});
