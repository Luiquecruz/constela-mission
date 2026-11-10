A CI cache saves slow work, such as downloading dependencies, between runs. Restoring it has to be fast, predictable and safe: the key says which content a cache holds, fallback keys allow a close match when the exact one is missing, an entry stops being valid after its time to live, and a branch must not be able to feed caches to others.

### Requirements

Export `generateCacheKey(prefix: string, lockfileHash: string): string`, which returns the prefix and the hash joined by a dash.

Export `resolveCache(entries, request, now)`. Each entry is `{ key, createdAt, ttlMs, branch }`; `request` is `{ primaryKey, restoreKeys, branch, defaultBranch }`; times are in milliseconds. It returns `{ hit, matchedKey, exact, reason }`.

An entry is visible to a request when both conditions hold:

- It is not expired: `now - createdAt` is less than or equal to `ttlMs`. An entry exactly at its limit is still valid.
- It was written by the request's branch or by its default branch. Entries from any other branch are invisible.

Resolve among the visible entries, in this order:

1. If any entry has the primary key, take the newest of them: `{ hit: true, matchedKey: <key>, exact: true, reason: 'Exact cache hit' }`.
2. Otherwise try each restore key in the given order. A restore key matches the entries whose key starts with it; the first restore key that matches anything wins, and the newest matching entry is restored: `{ hit: true, matchedKey: <key>, exact: false, reason: 'Restored from fallback key' }`.
3. Otherwise: `{ hit: false, matchedKey: null, exact: false, reason: 'Cache miss' }`.
