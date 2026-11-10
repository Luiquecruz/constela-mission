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
  // TODO: Use readCached('catalog', ['catalog-products'], ...) and strip supplierSecret
  const { value } = await readCached('catalog', ['catalog-products'], () => {
    return dbProducts.map((product) => ({ ...product }));
  });
  return value;
}

export async function updateProductPriceInDb(
  id: string,
  newPrice: number
): Promise<void> {
  // TODO: Update the matching product price in dbProducts
  void id;
  void newPrice;
}
