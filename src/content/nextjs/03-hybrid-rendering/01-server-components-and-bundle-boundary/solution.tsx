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

const SENSITIVE_KEYS = ['supplierCost', 'internalSku'] as const;

export function toPublicProductDto(record: RawProductRecord): PublicProductDto {
  return {
    id: record.id,
    name: record.name,
    price: record.price,
    category: record.category,
    inStock: record.inStock,
  };
}

export function validateClientProps(props: Record<string, unknown>): ValidationResult {
  const violations: string[] = [];

  for (const sensitiveKey of SENSITIVE_KEYS) {
    if (sensitiveKey in props) {
      violations.push(`Leaked sensitive field: ${sensitiveKey}`);
    } else if (
      props.product &&
      typeof props.product === 'object' &&
      sensitiveKey in (props.product as Record<string, unknown>)
    ) {
      violations.push(`Leaked sensitive field: ${sensitiveKey}`);
    }
  }

  for (const [key, value] of Object.entries(props)) {
    if (typeof value === 'function') {
      const isServerAction = Boolean(
        (value as unknown as { $$serverAction?: boolean }).$$serverAction
      );
      if (!isServerAction) {
        violations.push(`Non-serializable function prop: ${key}`);
      }
    }
  }

  return {
    valid: violations.length === 0,
    violations,
  };
}

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

      {showSpecs && <div data-testid="server-specs-slot">{children}</div>}
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
