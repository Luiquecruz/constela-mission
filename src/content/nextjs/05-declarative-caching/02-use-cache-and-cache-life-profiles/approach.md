1. Define `BUILTIN_PROFILES` with exact seconds for `hours`, `days`, and `max`.
2. In `buildCacheKey`, normalize each item of `args`: if it is a plain object, clone it without the `'children'` property. Format the key string as `${buildId}:${fnId}:${JSON.stringify(sanitizedArgs)}:${JSON.stringify(closureVars ?? {})}`.
3. In `mergeCacheLifetimes`, map `stale`, `revalidate`, and `expire` across the input array and pass each list into `Math.min(...)`.
4. In `createCachedFunction`, resolve the active `CacheLifeProfile` and maintain a `Map<string, CacheEntry>` keyed by `buildCacheKey`.
5. Compute `ageMs = clock() - entry.createdAt`. Branch on `< revalidate * 1000` (`HIT`), `< expire * 1000` (`STALE` + deduplicated background refresh), and `>= expire * 1000` (`MISS` awaiting `loader`).
