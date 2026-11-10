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
  // TODO: Implement HIT, STALE, and MISS semantics
  const value = await compute();
  store.set(key, { value, tags, stale: false });
  lastStatus = 'MISS';
  return { value, status: 'MISS' };
}

export function updateTag(tag: string): void {
  // TODO: Immediately evict entries matching tag for read-your-own-writes consistency
  void tag;
}

export function revalidateTag(tag: string, _profile: string = 'max'): void {
  // TODO: Mark entries matching tag as stale
  void tag;
}

export function resetCacheStore(): void {
  store.clear();
  lastStatus = 'MISS';
  resetListeners.forEach((fn) => fn());
}
