export type CacheStatus = 'HIT' | 'MISS' | 'STALE';

interface CacheEntry<T = unknown> {
  value: T;
  tags: string[];
  stale: boolean;
}

const store = new Map<string, CacheEntry>();
let lastStatus: CacheStatus = 'MISS';
const resetListeners = new Set<() => void>();

export function onCacheReset(listener: () => void) {
  resetListeners.add(listener);
}

export function getLastCacheStatus(): CacheStatus {
  return lastStatus;
}

export async function readCached<T>(
  key: string,
  tags: string[],
  compute: () => Promise<T> | T
): Promise<{ value: T; status: CacheStatus }> {
  const existing = store.get(key) as CacheEntry<T> | undefined;

  if (existing && !existing.stale) {
    lastStatus = 'HIT';
    return { value: existing.value, status: 'HIT' };
  }

  if (existing && existing.stale) {
    const freshValue = await compute();
    store.set(key, { value: freshValue, tags, stale: false });
    lastStatus = 'STALE';
    return { value: freshValue, status: 'STALE' };
  }

  const value = await compute();
  store.set(key, { value, tags, stale: false });
  lastStatus = 'MISS';
  return { value, status: 'MISS' };
}

export function updateTag(tag: string): void {
  for (const [key, entry] of store.entries()) {
    if (entry.tags.includes(tag)) {
      store.delete(key);
    }
  }
}

export function revalidateTag(tag: string, _profile: string = 'max'): void {
  for (const [key, entry] of store.entries()) {
    if (entry.tags.includes(tag)) {
      store.set(key, { ...entry, stale: true });
    }
  }
}

export function resetCacheStore(): void {
  store.clear();
  lastStatus = 'MISS';
  resetListeners.forEach((fn) => fn());
}
