test('returns ready: true with empty blockers and codemods for a compliant project', () => {
  const result = mod.auditMigrationProject({
    nodeVersion: '20.9.0',
    tsVersion: '5.1.0',
    hasMiddlewareFile: false,
    cacheComponentsEnabled: true,
    singleArgRevalidateTags: 0,
    syncRequestApiUsages: 0,
    replicas: 1,
    hasSharedCacheHandler: false,
  });

  expect(result).toEqual({
    ready: true,
    blockers: [],
    codemods: [],
  });
});

test('flags Node.js and TypeScript versions below the minimum semver baselines', () => {
  const result = mod.auditMigrationProject({
    nodeVersion: '20.8.9',
    tsVersion: '5.0.4',
    hasMiddlewareFile: false,
    cacheComponentsEnabled: true,
    singleArgRevalidateTags: 0,
    syncRequestApiUsages: 0,
    replicas: 1,
    hasSharedCacheHandler: false,
  });

  expect(result.ready).toBe(false);
  expect(result.blockers).toEqual([
    'Upgrade Node.js runtime to 20.9.0 or newer',
    'Upgrade TypeScript to 5.1.0 or newer',
  ]);
  expect(result.codemods).toEqual([]);
});

test('recommends middleware-to-proxy and next-async-request-api codemods when needed', () => {
  const result = mod.auditMigrationProject({
    nodeVersion: '22.2.0',
    tsVersion: '5.6.2',
    hasMiddlewareFile: true,
    cacheComponentsEnabled: true,
    singleArgRevalidateTags: 0,
    syncRequestApiUsages: 4,
    replicas: 1,
    hasSharedCacheHandler: false,
  });

  expect(result.ready).toBe(false);
  expect(result.blockers).toEqual([
    'Rename middleware.ts to proxy.ts',
    'Await async request APIs (params, searchParams, cookies, headers)',
  ]);
  expect(result.codemods).toEqual([
    'middleware-to-proxy',
    'next-async-request-api',
  ]);
});

test('flags disabled cacheComponents and single-argument revalidateTag usages', () => {
  const result = mod.auditMigrationProject({
    nodeVersion: '20.11.0',
    tsVersion: '5.4.0',
    hasMiddlewareFile: false,
    cacheComponentsEnabled: false,
    singleArgRevalidateTags: 3,
    syncRequestApiUsages: 0,
    replicas: 1,
    hasSharedCacheHandler: false,
  });

  expect(result.ready).toBe(false);
  expect(result.blockers).toEqual([
    'Enable cacheComponents: true in next.config.ts',
    'Pass a cacheLife profile to revalidateTag(tag, profile) or use updateTag(tag) in Server Actions',
  ]);
});

test('requires a shared cacheHandler only when self-hosting across multiple replicas', () => {
  const missingHandler = mod.auditMigrationProject({
    nodeVersion: '20.9.0',
    tsVersion: '5.1.0',
    hasMiddlewareFile: false,
    cacheComponentsEnabled: true,
    singleArgRevalidateTags: 0,
    syncRequestApiUsages: 0,
    replicas: 3,
    hasSharedCacheHandler: false,
  });

  expect(missingHandler.ready).toBe(false);
  expect(missingHandler.blockers).toEqual([
    'Configure a shared cacheHandler for multi-instance self-hosting',
  ]);

  const withHandler = mod.auditMigrationProject({
    nodeVersion: '20.9.0',
    tsVersion: '5.1.0',
    hasMiddlewareFile: false,
    cacheComponentsEnabled: true,
    singleArgRevalidateTags: 0,
    syncRequestApiUsages: 0,
    replicas: 3,
    hasSharedCacheHandler: true,
  });

  expect(withHandler.ready).toBe(true);
  expect(withHandler.blockers).toEqual([]);
});
