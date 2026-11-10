To sanitize `args` in `buildCacheKey`, map over `args`: if an argument `arg` is `typeof arg === 'object' && arg !== null && !Array.isArray(arg)`, destructure `{ children: _ignored, ...rest } = arg` and use `rest`.
---
To resolve a `profile` in `createCachedFunction`, check if `typeof profile === 'string'`. If so, look it up in `customProfiles?.[profile] ?? BUILTIN_PROFILES[profile]`. If `profile` is already an object, use it directly.
---
For the `STALE` window (`ageMs >= revalidate * 1000 && ageMs < expire * 1000`), store an `inFlight?: Promise<unknown>` reference on the cache entry so multiple concurrent stale reads only trigger a single background `loader(...args)` call. When that promise resolves, update `entry.value`, reset `entry.createdAt = clock()`, and clear `entry.inFlight`.
