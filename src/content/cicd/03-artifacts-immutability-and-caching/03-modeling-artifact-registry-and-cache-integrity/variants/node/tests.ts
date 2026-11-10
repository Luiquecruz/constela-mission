const DIGEST = 'sha256:b5bb9d8014a0f9b1d61e21e796d78dccdf1352f23cd32812f4850b878ae4944c';
const OTHER = 'sha256:7d865e959b2466918c9863afca942d0fb89d7c9ac0c99bafc3749504ded97730';

test('registers versions and resolves each one to its digest', async () => {
  const registry = new mod.ArtifactRegistry();
  expect(registry.register('api-service', '1.0.0', DIGEST)).toEqual({ registered: true, digest: DIGEST });
  registry.register('api-service', '1.1.0', OTHER);
  expect(registry.resolve('api-service', '1.0.0')).toBe(DIGEST);
  expect(registry.resolve('api-service', '1.1.0')).toBe(OTHER);
  expect(registry.listVersions('api-service')).toEqual(['1.0.0', '1.1.0']);
});

test('stores digests in lower case', async () => {
  const registry = new mod.ArtifactRegistry();
  const result = registry.register('api-service', '1.0.0', 'sha256:' + 'b5bb9d8014a0f9b1d61e21e796d78dccdf1352f23cd32812f4850b878ae4944c'.toUpperCase());
  expect(result.digest).toBe(DIGEST);
  expect(registry.resolve('api-service', '1.0.0')).toBe(DIGEST);
});

test('treats registering the same digest again as a no-op', async () => {
  const registry = new mod.ArtifactRegistry();
  registry.register('api-service', '1.0.0', DIGEST);
  expect(registry.register('api-service', '1.0.0', DIGEST.toUpperCase().replace('SHA256', 'sha256'))).toEqual({ registered: false, digest: DIGEST });
  expect(registry.listVersions('api-service')).toEqual(['1.0.0']);
});

// beginner mistake: overwriting a published version with a different build
test('refuses to replace a published version with a different digest', async () => {
  const registry = new mod.ArtifactRegistry();
  registry.register('api-service', '1.0.0', DIGEST);
  expect(() => registry.register('api-service', '1.0.0', OTHER)).toThrow('Artifact api-service:1.0.0 is immutable');
  expect(registry.resolve('api-service', '1.0.0')).toBe(DIGEST);
});

test('rejects a digest that is not a sha256 hash', async () => {
  const registry = new mod.ArtifactRegistry();
  for (const bad of ['b5bb9d8014a0f9b1d61e21e796d78dccdf1352f23cd32812f4850b878ae4944c', 'sha256:abc', 'sha1:b5bb9d8014a0f9b1d61e21e796d78dccdf1352f2', 'latest']) {
    expect(() => registry.register('api-service', '1.0.0', bad)).toThrow('Invalid SHA256 digest format');
  }
  expect(registry.listVersions('api-service')).toEqual([]);
});

test('fails to resolve a version or an artifact that was never registered', async () => {
  const registry = new mod.ArtifactRegistry();
  registry.register('api-service', '1.0.0', DIGEST);
  expect(() => registry.resolve('api-service', '9.9.9')).toThrow('Artifact api-service:9.9.9 not found');
  expect(() => registry.resolve('web-app', '1.0.0')).toThrow('Artifact web-app:1.0.0 not found');
  expect(registry.listVersions('web-app')).toEqual([]);
});
