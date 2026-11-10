test('buildCacheKey includes buildId, fnId, args, and closureVars while ignoring pass-through children props', () => {
  const keyA = mod.buildCacheKey({
    buildId: 'build-42',
    fnId: 'fn-pricing',
    args: [{ region: 'eu', children: { type: 'div', props: { id: 'slot-1' } } }],
    closureVars: { tenantId: 'acme' },
  });

  const keyB = mod.buildCacheKey({
    buildId: 'build-42',
    fnId: 'fn-pricing',
    args: [{ region: 'eu', children: { type: 'span', props: { id: 'slot-2' } } }],
    closureVars: { tenantId: 'acme' },
  });

  expect(keyA).toBe('build-42:fn-pricing:[{"region":"eu"}]:{"tenantId":"acme"}');
  expect(keyA).toBe(keyB);
});

test('mergeCacheLifetimes propagates the shortest stale, revalidate, and expire durations across nested scopes', () => {
  const merged = mod.mergeCacheLifetimes([
    mod.BUILTIN_PROFILES.days,
    { stale: 120, revalidate: 1800, expire: 86400 },
    { stale: 600, revalidate: 900, expire: 43200 },
  ]);

  expect(merged).toEqual({
    stale: 120,
    revalidate: 900,
    expire: 43200,
  });
});

test('createCachedFunction serves HIT before revalidate without invoking loader again', async () => {
  let currentTime = 1_000_000;
  let calls = 0;

  const getCatalog = mod.createCachedFunction(
    {
      buildId: 'b1',
      fnId: 'catalog',
      profile: 'hours',
      now: () => currentTime,
    },
    async (category) => {
      calls += 1;
      return { category, seq: calls };
    },
  );

  const first = await getCatalog('shoes');
  expect(first.status).toBe('MISS');
  expect(first.value).toEqual({ category: 'shoes', seq: 1 });
  expect(calls).toBe(1);

  currentTime += 1500 * 1000; // 1500s < 3600s revalidate
  const second = await getCatalog('shoes');
  expect(second.status).toBe('HIT');
  expect(second.value).toEqual({ category: 'shoes', seq: 1 });
  expect(calls).toBe(1);
});

test('createCachedFunction returns STALE between revalidate and expire and deduplicates background refresh', async () => {
  let currentTime = 1_000_000;
  let calls = 0;

  const getEditorial = mod.createCachedFunction(
    {
      buildId: 'b1',
      fnId: 'editorial',
      customProfiles: {
        editorial: { stale: 60, revalidate: 300, expire: 3600 },
      },
      profile: 'editorial',
      now: () => currentTime,
    },
    async (slug) => {
      calls += 1;
      return { slug, version: calls };
    },
  );

  const initial = await getEditorial('hero');
  expect(initial.status).toBe('MISS');
  expect(initial.value.version).toBe(1);

  // Move into stale window (400s >= 300s revalidate, < 3600s expire)
  currentTime += 400 * 1000;
  const [staleA, staleB] = await Promise.all([getEditorial('hero'), getEditorial('hero')]);

  expect(staleA.status).toBe('STALE');
  expect(staleB.status).toBe('STALE');
  expect(staleA.value.version).toBe(1);
  // Only one background refresh should have been triggered
  expect(calls).toBe(2);

  // Subsequent read after background promise settles is a fresh HIT with version 2
  currentTime += 10 * 1000;
  const afterRefresh = await getEditorial('hero');
  expect(afterRefresh.status).toBe('HIT');
  expect(afterRefresh.value.version).toBe(2);
});

test('createCachedFunction awaits a fresh loader call with status MISS once expire has elapsed', async () => {
  let currentTime = 5_000_000;
  let calls = 0;

  const getRates = mod.createCachedFunction(
    {
      buildId: 'b1',
      fnId: 'fx',
      profile: { stale: 30, revalidate: 60, expire: 120 },
      now: () => currentTime,
    },
    async (pair) => {
      calls += 1;
      return { pair, call: calls };
    },
  );

  await getRates('USD-EUR');
  expect(calls).toBe(1);

  // Advance past expire (125s >= 120s)
  currentTime += 125 * 1000;
  const expiredRead = await getRates('USD-EUR');
  expect(expiredRead.status).toBe('MISS');
  expect(expiredRead.value).toEqual({ pair: 'USD-EUR', call: 2 });
  expect(calls).toBe(2);
});
