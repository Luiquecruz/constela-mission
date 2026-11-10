const NOW = 1700000000000;
const HOUR = 3600000;
const DAY = 86400000;
const entry = (key: string, ageMs: number, branch = 'main', ttlMs = 7 * DAY) => ({ key, createdAt: NOW - ageMs, ttlMs, branch });
const cacheRequest = (primaryKey: string, restoreKeys: string[] = [], branch = 'main') => ({ primaryKey, restoreKeys, branch, defaultBranch: 'main' });

test('composes the cache key from a prefix and a lockfile hash', async () => {
  expect(mod.generateCacheKey('npm-linux', '9f2c41')).toBe('npm-linux-9f2c41');
});

test('restores the exact key before trying any fallback', async () => {
  const entries = [entry('npm-v2', HOUR), entry('npm-v1', HOUR / 6)];
  expect(mod.resolveCache(entries, cacheRequest('npm-v2', ['npm-']), NOW)).toEqual({ hit: true, matchedKey: 'npm-v2', exact: true, reason: 'Exact cache hit' });
});

test('falls back to the newest entry of the first restore key that matches', async () => {
  const entries = [entry('npm-a', 3 * DAY), entry('npm-b', DAY), entry('node-x', HOUR)];
  const fallback = { hit: true, matchedKey: 'npm-b', exact: false, reason: 'Restored from fallback key' };
  expect(mod.resolveCache(entries, cacheRequest('npm-zzz', ['npm-', 'node-']), NOW)).toEqual(fallback);
  expect(mod.resolveCache(entries, cacheRequest('npm-zzz', ['node-', 'npm-']), NOW).matchedKey).toBe('node-x');
});

test('ignores expired entries and keeps one that is exactly at its time to live', async () => {
  const atLimit = [entry('k', DAY, 'main', DAY)];
  const expired = [entry('k', DAY + 1, 'main', DAY)];
  expect(mod.resolveCache(atLimit, cacheRequest('k'), NOW).hit).toBe(true);
  expect(mod.resolveCache(expired, cacheRequest('k'), NOW)).toEqual({ hit: false, matchedKey: null, exact: false, reason: 'Cache miss' });
});

// beginner mistake: restoring a cache written by another feature branch, which lets that branch poison this one
test('shows caches from the current and default branches but never from other branches', async () => {
  const other = [entry('npm-v1', HOUR, 'feature/other')];
  expect(mod.resolveCache(other, cacheRequest('npm-v1', [], 'feature/mine'), NOW).hit).toBe(false);
  const fromDefault = [entry('npm-v1', HOUR, 'main')];
  expect(mod.resolveCache(fromDefault, cacheRequest('npm-v1', [], 'feature/mine'), NOW).hit).toBe(true);
  const own = [entry('npm-v1', HOUR, 'feature/mine')];
  expect(mod.resolveCache(own, cacheRequest('npm-v1', [], 'feature/mine'), NOW).hit).toBe(true);
});

test('reports a miss when no entry matches', async () => {
  expect(mod.resolveCache([], cacheRequest('npm-v1', ['npm-']), NOW)).toEqual({ hit: false, matchedKey: null, exact: false, reason: 'Cache miss' });
  expect(mod.resolveCache([entry('pip-v1', HOUR)], cacheRequest('npm-v1', ['npm-']), NOW).hit).toBe(false);
});
