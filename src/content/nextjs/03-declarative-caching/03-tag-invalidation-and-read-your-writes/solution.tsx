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

interface InternalEntry<T = unknown> {
  data: T;
  tags: string[];
  state: EntryState;
  profile?: string;
}

export function createTaggedCacheStore(): TaggedCacheStore {
  const entries = new Map<string, InternalEntry>();

  return {
    async readCached<T>(key: string, tags: string[], loader: () => Promise<T>): Promise<ReadCachedResult<T>> {
      const existing = entries.get(key) as InternalEntry<T> | undefined;

      if (existing && existing.state === 'fresh') {
        return {
          data: existing.data,
          cacheState: 'HIT',
        };
      }

      if (existing && existing.state === 'stale') {
        const staleData = existing.data;
        const staleProfile = existing.profile;

        void Promise.resolve(loader()).then((freshData) => {
          entries.set(key, {
            data: freshData,
            tags,
            state: 'fresh',
          });
        });

        return {
          data: staleData,
          cacheState: 'STALE',
          profile: staleProfile,
        };
      }

      const freshData = await loader();
      entries.set(key, {
        data: freshData,
        tags,
        state: 'fresh',
      });

      return {
        data: freshData,
        cacheState: 'MISS',
      };
    },

    revalidateTag(tag: string, profile: string) {
      if (!profile) {
        throw new Error('revalidateTag requires a cacheLife profile as second argument');
      }
      for (const entry of entries.values()) {
        if (entry.tags.includes(tag)) {
          entry.state = 'stale';
          entry.profile = profile;
        }
      }
    },

    updateTag(tag: string) {
      for (const entry of entries.values()) {
        if (entry.tags.includes(tag)) {
          entry.state = 'expired';
          delete entry.profile;
        }
      }
    },

    getTagState(tag: string): EntryState | 'empty' {
      for (const entry of entries.values()) {
        if (entry.tags.includes(tag)) {
          return entry.state;
        }
      }
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
    storeRef.current!.updateTag('categories-data');
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
