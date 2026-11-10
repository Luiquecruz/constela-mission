import { onCacheReset, readCached } from './cache';

export interface ProductRecord {
  id: string;
  name: string;
  price: number;
  stock: number;
  supplierSecret: string;
}

export interface ProductDTO {
  id: string;
  name: string;
  price: number;
  stock: number;
}

const INITIAL_PRODUCTS: ProductRecord[] = [
  {
    id: 'p1',
    name: 'Quantum Keyboard',
    price: 180,
    stock: 5,
    supplierSecret: 'margin-42',
  },
  {
    id: 'p2',
    name: 'Studio Display',
    price: 620,
    stock: 2,
    supplierSecret: 'margin-55',
  },
];

let dbProducts: ProductRecord[] = INITIAL_PRODUCTS.map((item) => ({ ...item }));

export function resetCatalogDb(): void {
  dbProducts = INITIAL_PRODUCTS.map((item) => ({ ...item }));
}

onCacheReset(resetCatalogDb);

export async function getProductsCatalog(): Promise<ProductDTO[]> {
  const { value } = await readCached('catalog', ['catalog-products'], () => {
    return dbProducts.map(({ id, name, price, stock }) => ({
      id,
      name,
      price,
      stock,
    }));
  });
  return value;
}

export async function updateProductPriceInDb(
  id: string,
  newPrice: number
): Promise<void> {
  dbProducts = dbProducts.map((product) =>
    product.id === id ? { ...product, price: newPrice } : product
  );
}
