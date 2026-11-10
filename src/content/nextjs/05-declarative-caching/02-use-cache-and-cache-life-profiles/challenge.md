# Build the `'use cache'` Key Hasher and `cacheLife` Runtime

In this challenge, you will implement the core runtime mechanics behind Next.js `'use cache'` and `cacheLife`: deterministic key generation (with pass-through `children` exclusion), nested profile lifetime merging, and the three-phase cache state machine (`HIT` → `STALE` with deduplicated background refresh → `MISS` after hard expiration).

## Requirements

1. **`BUILTIN_PROFILES`**: Export a constant mapping built-in profile names to `{ stale, revalidate, expire }` (in seconds):
   - `'hours'`: `{ stale: 300, revalidate: 3600, expire: 86400 }`
   - `'days'`: `{ stale: 300, revalidate: 86400, expire: 604800 }`
   - `'max'`: `{ stale: 300, revalidate: 2592000, expire: 31536000 }`

2. **`buildCacheKey({ buildId, fnId, args, closureVars })`**:
   - For each element in `args`, if the element is a non-null plain object (not an array), omit any top-level `'children'` property so pass-through React slots do not pollute the cache key.
   - Return the exact format:
     `${buildId}:${fnId}:${JSON.stringify(sanitizedArgs)}:${JSON.stringify(closureVars ?? {})}`

3. **`mergeCacheLifetimes(profiles)`**:
   - Given a non-empty array of `{ stale, revalidate, expire }` objects, return `{ stale, revalidate, expire }` containing the minimum value across all profiles for each field.

4. **`createCachedFunction(options, loader)`**:
   - `options` provides `{ buildId, fnId, profile, customProfiles, closureVars, now }` where `profile` can be a built-in profile name, a key in `customProfiles`, or an inline `{ stale, revalidate, expire }` object (defaulting to `BUILTIN_PROFILES.hours` if omitted).
   - Return an async function `(...args) => Promise<{ value, status: 'HIT' | 'STALE' | 'MISS', profile }>` that computes the key via `buildCacheKey`:
     - **Cold or Expired (`ageMs >= expire * 1000`)**: Await `loader(...args)`, store the result with the current timestamp `now()`, and return `{ value, status: 'MISS', profile: resolvedProfile }`.
     - **Fresh (`ageMs < revalidate * 1000`)**: Do **not** call `loader`; return `{ value: entry.value, status: 'HIT', profile: resolvedProfile }`.
     - **Stale-While-Revalidate (`revalidate * 1000 <= ageMs < expire * 1000`)**: Immediately return `{ value: entry.value, status: 'STALE', profile: resolvedProfile }` and trigger a single deduplicated background call to `loader(...args)` that updates `entry.value` and `entry.createdAt = now()` when it resolves.
