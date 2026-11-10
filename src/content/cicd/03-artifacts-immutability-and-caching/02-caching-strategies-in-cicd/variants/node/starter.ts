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
  // TODO: join the prefix and the lockfile hash with a dash.
  return prefix;
}

export function resolveCache(entries: CacheEntry[], request: CacheRequest, now: number): CacheResolution {
  // TODO: keep only entries that are not expired and were written by the current or the default branch.
  // TODO: prefer an exact match on the primary key, then try each restore key in order and take the newest entry.
  return { hit: false, matchedKey: null, exact: false, reason: 'Cache miss' };
}
