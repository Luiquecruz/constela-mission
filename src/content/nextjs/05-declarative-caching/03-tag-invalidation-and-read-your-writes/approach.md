1. Maintain a `Map<string, InternalEntry>` inside `createTaggedCacheStore()` where each entry tracks `{ data, tags, state: 'fresh' | 'stale' | 'expired', profile? }`.
2. In `revalidateTag(tag, profile)`, guard against a missing `profile` and transition matching entries to `'stale'`.
3. In `updateTag(tag)`, transition matching entries to `'expired'`.
4. In `readCached(key, tags, loader)`, handle `'fresh'` (`HIT`), `'stale'` (`STALE` + background `loader()`), and missing/`'expired'` (`MISS` awaiting `loader()`).
5. In `CategoryManager`, call `store.updateTag('categories-data')` inside the form action before re-reading the cached categories so the user immediately sees their newly added category.
