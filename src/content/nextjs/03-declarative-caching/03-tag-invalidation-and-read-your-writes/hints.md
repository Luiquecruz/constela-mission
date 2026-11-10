In `revalidateTag(tag, profile)`, validate `if (!profile) throw new Error('revalidateTag requires a cacheLife profile as second argument')`. Then iterate through your `Map` of entries and set `entry.state = 'stale'` and `entry.profile = profile` whenever `entry.tags.includes(tag)`.
---
In `readCached`, when `entry.state === 'stale'`, capture the current `staleData = entry.data` and `staleProfile = entry.profile`, kick off `Promise.resolve(loader()).then((fresh) => { entry.data = fresh; entry.state = 'fresh'; })`, and immediately return `{ data: staleData, cacheState: 'STALE', profile: staleProfile }`.
---
In `CategoryManager`'s submit handler, after pushing the trimmed category name to the backing list, call `store.updateTag('categories-data')` before calling your async load helper so `readCached` sees `'expired'` and awaits the fresh array instead of returning a cached copy.
