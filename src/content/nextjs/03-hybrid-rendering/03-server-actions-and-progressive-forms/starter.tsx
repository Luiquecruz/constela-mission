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

// TODO 1: Simulate next/form string action URL serialization
export function buildSearchFormUrl(
  actionPath: string,
  formData: FormData | Record<string, string>
): string {
  // BUG: Does not serialize query parameters or trim empty values
  return actionPath;
}

// TODO 2: Validate inputs inside the Server Action and return structured ActionState
export async function createProductAction(
  prevState: ActionState,
  payload: FormData | { name?: string; price?: number | string }
): Promise<ActionState> {
  // BUG: Missing validation for name length >= 3 and price > 0
  return {
    ok: false,
    error: 'Not implemented',
    item: null,
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

