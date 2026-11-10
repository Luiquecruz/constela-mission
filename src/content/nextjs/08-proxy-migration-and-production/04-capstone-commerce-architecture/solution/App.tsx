import React, { useEffect, useState } from 'react';
import { getLastCacheStatus, type CacheStatus } from './cache';
import { getProductsCatalog, type ProductDTO } from './dal';
import { updatePriceAction, type AuditEntry } from './actions';

export default function App() {
  const [products, setProducts] = useState<ProductDTO[]>([]);
  const [cacheStatus, setCacheStatus] = useState<CacheStatus>('MISS');
  const [selectedProduct, setSelectedProduct] = useState<ProductDTO | null>(
    null
  );
  const [draftPrices, setDraftPrices] = useState<Record<string, string>>({});
  const [auditLogs, setAuditLogs] = useState<AuditEntry[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getProductsCatalog().then((items) => {
      if (!active) return;
      setProducts(items);
      setCacheStatus(getLastCacheStatus());
      const initialDrafts: Record<string, string> = {};
      items.forEach((p) => {
        initialDrafts[p.id] = String(p.price);
      });
      setDraftPrices(initialDrafts);
    });
    return () => {
      active = false;
    };
  }, []);

  async function handlePriceSubmit(e: React.FormEvent, product: ProductDTO) {
    e.preventDefault();
    setErrorMessage(null);
    const parsedPrice = Number(draftPrices[product.id]);

    const result = await updatePriceAction({
      productId: product.id,
      newPrice: parsedPrice,
      role: 'admin',
      after: (entryOrFn) => {
        const entry =
          typeof entryOrFn === 'function' ? entryOrFn() : entryOrFn;
        if (entry) {
          setAuditLogs((prev) => [...prev, entry]);
        }
      },
    });

    if (!result.ok) {
      setErrorMessage(result.error);
      return;
    }

    setProducts(result.products);
    setCacheStatus(getLastCacheStatus());
    if (selectedProduct && selectedProduct.id === product.id) {
      const updated = result.products.find((p) => p.id === product.id) ?? null;
      setSelectedProduct(updated);
    }
  }

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', padding: 16 }}>
      <header style={{ marginBottom: 16 }}>
        <h1>Next.js Commerce Storefront</h1>
        <div>
          <span>Cache Status: </span>
          <strong data-testid="cache-status">{cacheStatus}</strong>
        </div>
      </header>

      {errorMessage && <p role="alert">{errorMessage}</p>}

      <section aria-label="Catalog">
        <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: 12 }}>
          {products.map((product) => (
            <li
              key={product.id}
              style={{
                border: '1px solid #cbd5e1',
                borderRadius: 8,
                padding: 12,
              }}
            >
              <div>
                <button
                  type="button"
                  onClick={() => setSelectedProduct(product)}
                  style={{
                    fontWeight: 600,
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    textDecoration: 'underline',
                  }}
                >
                  {product.name}
                </button>
                <span> — ${product.price}</span>
                <span> ({product.stock} in stock)</span>
              </div>

              <form
                onSubmit={(e) => handlePriceSubmit(e, product)}
                style={{ marginTop: 8, display: 'flex', gap: 8 }}
              >
                <input
                  type="number"
                  aria-label={`New price for ${product.name}`}
                  value={draftPrices[product.id] ?? ''}
                  onChange={(e) =>
                    setDraftPrices((prev) => ({
                      ...prev,
                      [product.id]: e.target.value,
                    }))
                  }
                />
                <button type="submit">Save price</button>
              </form>
            </li>
          ))}
        </ul>
      </section>

      {selectedProduct && (
        <div
          role="dialog"
          aria-label={`${selectedProduct.name} Quick View`}
          style={{
            marginTop: 16,
            padding: 16,
            border: '2px solid #0f172a',
            borderRadius: 8,
          }}
        >
          <h2>{selectedProduct.name}</h2>
          <p>Price: ${selectedProduct.price}</p>
          <p>Stock available: {selectedProduct.stock}</p>
          <button type="button" onClick={() => setSelectedProduct(null)}>
            Close quick view
          </button>
        </div>
      )}

      <section style={{ marginTop: 20 }}>
        <h2>Audit Log</h2>
        <ul>
          {auditLogs.map((entry, idx) => (
            <li key={`${entry.productId}-${idx}`}>
              {entry.event}: {entry.productId} updated to ${entry.newPrice}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
