import React, { useState } from 'react';

export interface CatalogItem {
  id: string;
  name: string;
  price: number;
}

export interface ActionState {
  ok: boolean;
  error: string | null;
  item: CatalogItem | null;
}

const INITIAL_ITEMS: CatalogItem[] = [
  { id: 'item-1', name: 'Analog Drum Machine', price: 649 },
  { id: 'item-2', name: 'Ribbon Studio Microphone', price: 420 },
];

export function buildSearchFormUrl(
  actionPath: string,
  formData: FormData | Record<string, string>
): string {
  const params = new URLSearchParams();
  const entries =
    formData instanceof FormData
      ? Array.from(formData.entries())
      : Object.entries(formData);

  for (const [key, value] of entries) {
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed.length > 0) {
        params.set(key, trimmed);
      }
    }
  }

  const queryString = params.toString();
  return queryString ? `${actionPath}?${queryString}` : actionPath;
}

export async function createProductAction(
  prevState: ActionState,
  payload: FormData | { name?: string; price?: number | string }
): Promise<ActionState> {
  const rawName =
    payload instanceof FormData ? payload.get('name') : payload.name;
  const rawPrice =
    payload instanceof FormData ? payload.get('price') : payload.price;

  const trimmedName = String(rawName ?? '').trim();
  const numericPrice = Number(rawPrice);

  if (trimmedName.length < 3) {
    return {
      ok: false,
      error: 'Product name must be at least 3 characters',
      item: null,
    };
  }

  if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
    return {
      ok: false,
      error: 'Price must be greater than zero',
      item: null,
    };
  }

  return {
    ok: true,
    error: null,
    item: {
      id: `item-${trimmedName.toLowerCase().replace(/\s+/g, '-')}`,
      name: trimmedName,
      price: numericPrice,
    },
  };
}

export function CatalogSearchAndCreateApp({
  onNavigate,
}: {
  onNavigate?: (url: string) => void;
}) {
  const [query, setQuery] = useState('');
  const [lastUrl, setLastUrl] = useState('/catalog');
  const [items, setItems] = useState<CatalogItem[]>(INITIAL_ITEMS);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [actionState, setActionState] = useState<ActionState>({
    ok: true,
    error: null,
    item: null,
  });

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const url = buildSearchFormUrl('/catalog', { q: query });
    setLastUrl(url);
    onNavigate?.(url);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nextState = await createProductAction(actionState, { name, price });
    setActionState(nextState);
    if (nextState.ok && nextState.item) {
      setItems((prev) => [...prev, nextState.item!]);
      setName('');
      setPrice('');
    }
  };

  return (
    <div style={{ fontFamily: 'sans-serif', maxWidth: 640, margin: '0 auto', padding: 16 }}>
      <h2>Catalog Search & Server Action Mutation</h2>

      <form
        aria-label="Catalog Search"
        onSubmit={handleSearchSubmit}
        style={{ display: 'flex', gap: 8, marginBottom: 12 }}
      >
        <input
          name="q"
          placeholder="Search catalog..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button type="submit">Search</button>
      </form>
      <p style={{ fontSize: 14, color: '#475569' }}>Navigated to: {lastUrl}</p>

      <form
        aria-label="Create Product"
        onSubmit={handleCreateSubmit}
        style={{
          display: 'flex',
          gap: 8,
          marginBottom: 12,
          padding: 12,
          border: '1px solid #cbd5e1',
          borderRadius: 8,
        }}
      >
        <input
          name="name"
          placeholder="Product name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          name="price"
          placeholder="Price"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />
        <button type="submit">Create product</button>
      </form>

      {actionState.error && (
        <p role="alert" style={{ color: '#dc2626', fontWeight: 600 }}>
          {actionState.error}
        </p>
      )}

      <ul aria-label="Catalog List">
        {items.map((item) => (
          <li key={item.id}>
            {item.name} - ${item.price}
          </li>
        ))}
      </ul>
    </div>
  );
}

export const App = CatalogSearchAndCreateApp;
export default CatalogSearchAndCreateApp;
