# Implement Tagged Cache Invalidation: `revalidateTag` vs `updateTag`

In this challenge, you will build a tagged cache engine that models the exact behavioral difference between `revalidateTag(tag, profile)` (stale-while-revalidate background refresh) and `updateTag(tag)` (immediate expiration for read-your-own-writes), and wire `updateTag` into a `CategoryManager` UI so newly added categories appear immediately after submission.

## Requirements

1. **`createTaggedCacheStore()`**:
   - **`readCached(key, tags, loader)`**:
     - If no entry exists for `key` or its state is `'expired'`, await `loader()`, store `{ data, tags, state: 'fresh' }`, and return `{ data, cacheState: 'MISS' }`.
     - If the entry's state is `'stale'`, return `{ data: entry.data, cacheState: 'STALE', profile: entry.profile }` immediately and trigger `loader()` in the background; when `loader()` resolves, update `entry.data` and reset `entry.state = 'fresh'`.
     - If the entry's state is `'fresh'`, return `{ data: entry.data, cacheState: 'HIT' }` without calling `loader()`.
   - **`revalidateTag(tag, profile)`**:
     - Throw `new Error('revalidateTag requires a cacheLife profile as second argument')` if `!profile`.
     - Mark every cached entry whose `tags` array includes `tag` as `state: 'stale'` with `profile`.
   - **`updateTag(tag)`**:
     - Mark every cached entry whose `tags` array includes `tag` as `state: 'expired'` so the next `readCached` call awaits fresh data.
   - **`getTagState(tag)`**:
     - Return `'fresh' | 'stale' | 'expired' | 'empty'` for the first entry matching `tag` (or `'empty'` if none).

2. **`CategoryManager` Component (and default export `App`)**:
   - Render a form with an `<input aria-label="New category name" />` and a `<button type="submit">Add Category</button>`.
   - When submitted with a non-empty name, append the new category to the backing data source, call `store.updateTag('categories-data')` (for read-your-own-writes), and immediately reload via `store.readCached('categories', ['categories-data'], ...)` so the updated list and latest `cacheState` badge are displayed.
