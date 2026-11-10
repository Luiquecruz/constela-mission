import React, { useState } from 'react';

export interface RawProductRecord {
  id: string;
  name: string;
  price: number;
  category: string;
  inStock: boolean;
  supplierCost: number;
  internalSku: string;
  specsMarkdown: string;
}

export interface PublicProductDto {
  id: string;
  name: string;
  price: number;
  category: string;
  inStock: boolean;
}

export interface ValidationResult {
  valid: boolean;
  violations: string[];
}

const RAW_PRODUCTS: RawProductRecord[] = [
  {
    id: 'prod-1',
    name: 'Studio Condenser Microphone',
    price: 249,
    category: 'Audio',
    inStock: true,
    supplierCost: 84.5,
    internalSku: 'WH-MIC-9921-SECRET',
    specsMarkdown: 'Cardioid polar pattern | 20Hz - 20kHz frequency response | 48V Phantom Power',
  },
  {
    id: 'prod-2',
    name: 'Planar Magnetic Headphones',
    price: 399,
    category: 'Monitoring',
    inStock: true,
    supplierCost: 142.0,
    internalSku: 'WH-HDP-4410-SECRET',
    specsMarkdown: 'Open-back acoustic design | 32 Ohm impedance | Detachable braided cable',
  },
];

// TODO 1: Strip confidential fields (supplierCost, internalSku, specsMarkdown)
export function toPublicProductDto(record: RawProductRecord): PublicProductDto {
  // BUG: Currently returns the raw record including confidential fields!
  return { ...(record as unknown as PublicProductDto) };
}

// TODO 2: Validate props crossing the 'use client' boundary
export function validateClientProps(props: Record<string, unknown>): ValidationResult {
  // BUG: Does not detect leaked sensitive fields or plain non-Server-Action functions
  return { valid: true, violations: [] };
}

// Server Component that renders static specification details on the server
export function ServerSpecsSlot({ specsMarkdown }: { specsMarkdown: string }) {
  const bullets = specsMarkdown.split('|').map((item) => item.trim());
  return (
    <ul aria-label="Technical Specifications" style={{ marginTop: 8, paddingLeft: 18 }}>
      {bullets.map((bullet) => (
        <li key={bullet}>{bullet}</li>
      ))}
    </ul>
  );
}

// Client Component boundary leaf
export function InteractiveProductCard({
  product,
  onAddToCart,
  children,
}: {
  product: PublicProductDto;
  onAddToCart?: (productId: string) => void;
  children?: React.ReactNode;
}) {
  const [count, setCount] = useState(0);
  const [showSpecs, setShowSpecs] = useState(false);

  return (
    <article
      style={{
        border: '1px solid #cbd5e1',
        borderRadius: 8,
        padding: 16,
        marginBottom: 12,
      }}
    >
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ margin: 0 }}>{product.name}</h3>
          <small>{product.category}</small>
        </div>
        <strong>${product.price}</strong>
      </header>

      <div style={{ display: 'flex', gap: 8, marginTop: 12, alignItems: 'center' }}>
        <button
          type="button"
          onClick={() => {
            setCount((c) => c + 1);
            onAddToCart?.(product.id);
          }}
        >
          Add to cart
        </button>
        <span>In cart: {count}</span>

        <button
          type="button"
          aria-expanded={showSpecs}
          onClick={() => setShowSpecs((prev) => !prev)}
        >
          Toggle specifications
        </button>
      </div>

      {/* TODO 3: Render the server-rendered children slot when showSpecs is true */}
    </article>
  );
}

export function CatalogPage() {
  const [cartLog, setCartLog] = useState<string[]>([]);

  const serverActionAdd = Object.assign(
    (productId: string) => {
      setCartLog((prev) => [...prev, productId]);
    },
    { $$serverAction: true as const }
  );

  return (
    <section style={{ fontFamily: 'sans-serif', maxWidth: 640, margin: '0 auto', padding: 16 }}>
      <h2>Catalog — Server & Client Boundary</h2>
      <p>Cart events processed: {cartLog.length}</p>
      {RAW_PRODUCTS.map((raw) => {
        const dto = toPublicProductDto(raw);
        return (
          <InteractiveProductCard key={dto.id} product={dto} onAddToCart={serverActionAdd}>
            <ServerSpecsSlot specsMarkdown={raw.specsMarkdown} />
          </InteractiveProductCard>
        );
      })}
    </section>
  );
}

export default CatalogPage;
