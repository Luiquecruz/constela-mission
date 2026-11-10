export interface CacheEntry {
  key: string;
  createdAt: number;
  ttlMs: number;
  branch: string;
}

export interface CacheRequest {
  primaryKey: string;
  restoreKeys: string[];
  branch: string;
  defaultBranch: string;
}

export interface CacheResolution {
  hit: boolean;
  matchedKey: string | null;
  exact: boolean;
  reason: string;
}

export function generateCacheKey(prefix: string, lockfileHash: string): string {
  return `${prefix}-${lockfileHash}`;
}

function newest(entries: CacheEntry[]): CacheEntry | undefined {
  return entries.reduce<CacheEntry | undefined>((best, entry) => (best === undefined || entry.createdAt > best.createdAt ? entry : best), undefined);
}

export function resolveCache(entries: CacheEntry[], request: CacheRequest, now: number): CacheResolution {
  const visible = entries.filter(
    (entry) => now - entry.createdAt <= entry.ttlMs && (entry.branch === request.branch || entry.branch === request.defaultBranch),
  );

  const exact = newest(visible.filter((entry) => entry.key === request.primaryKey));
  if (exact) {
    return { hit: true, matchedKey: exact.key, exact: true, reason: 'Exact cache hit' };
  }

  for (const restoreKey of request.restoreKeys) {
    const partial = newest(visible.filter((entry) => entry.key.startsWith(restoreKey)));
    if (partial) {
      return { hit: true, matchedKey: partial.key, exact: false, reason: 'Restored from fallback key' };
    }
  }

  return { hit: false, matchedKey: null, exact: false, reason: 'Cache miss' };
}
