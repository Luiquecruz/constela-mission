import React, { useEffect, useRef, useState } from 'react';

export type EntryState = 'fresh' | 'stale' | 'expired';

export interface ReadCachedResult<T> {
  data: T;
  cacheState: 'HIT' | 'STALE' | 'MISS';
  profile?: string;
}

export interface TaggedCacheStore {
  readCached<T>(key: string, tags: string[], loader: () => Promise<T>): Promise<ReadCachedResult<T>>;
  revalidateTag(tag: string, profile: string): void;
  updateTag(tag: string): void;
  getTagState(tag: string): EntryState | 'empty';
}

export function createTaggedCacheStore(): TaggedCacheStore {
  // TODO: Implement tagged cache store supporting HIT, STALE (via revalidateTag), and MISS (cold or via updateTag)
  return {
    async readCached<T>(_key: string, _tags: string[], loader: () => Promise<T>): Promise<ReadCachedResult<T>> {
      const data = await loader();
      return { data, cacheState: 'MISS' };
    },
    revalidateTag(_tag: string, _profile: string) {
      // TODO: Require profile and mark matching entries as 'stale'
    },
    updateTag(_tag: string) {
      // TODO: Mark matching entries as 'expired' for immediate read-your-own-writes
    },
    getTagState(_tag: string) {
      return 'empty';
    },
  };
}

export function CategoryManager({ initialCategories = ['Electronics', 'Books'] }: { initialCategories?: string[] }) {
  const storeRef = useRef<TaggedCacheStore | null>(null);
  if (!storeRef.current) {
    storeRef.current = createTaggedCacheStore();
  }
  const dbRef = useRef<string[]>([...initialCategories]);
  const [categories, setCategories] = useState<string[]>(initialCategories);
  const [lastCacheState, setLastCacheState] = useState<string>('MISS');
  const [input, setInput] = useState('');

  const loadCategories = async () => {
    const res = await storeRef.current!.readCached('categories', ['categories-data'], async () => {
      return [...dbRef.current];
    });
    setCategories(res.data);
    setLastCacheState(res.cacheState);
  };

  useEffect(() => {
    void loadCategories();
  }, []);

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;
    dbRef.current = [...dbRef.current, trimmed];
    setInput('');
    // TODO: Call storeRef.current!.updateTag('categories-data') before reloading so the user sees their write
    await loadCategories();
  };

  return (
    <section aria-label="Category Manager">
      <h2>Storefront Categories</h2>
      <p>
        Cache status: <strong data-testid="cache-status">{lastCacheState}</strong>
      </p>
      <form onSubmit={handleAddCategory}>
        <input
          aria-label="New category name"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="e.g. Home Office"
        />
        <button type="submit">Add Category</button>
      </form>
      <ul aria-label="Category list">
        {categories.map((cat) => (
          <li key={cat}>{cat}</li>
        ))}
      </ul>
    </section>
  );
}

export default CategoryManager;
