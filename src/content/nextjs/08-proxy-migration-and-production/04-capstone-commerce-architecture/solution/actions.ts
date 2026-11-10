import { updateTag } from './cache';
import {
  getProductsCatalog,
  updateProductPriceInDb,
  type ProductDTO,
} from './dal';

export interface AuditEntry {
  productId: string;
  newPrice: number;
  event: 'PRICE_UPDATED';
}

export interface UpdatePriceInput {
  productId: string;
  newPrice: number;
  role: 'admin' | 'customer' | string;
  after?: (entryOrCallback: AuditEntry | (() => AuditEntry | void)) => void;
}

export type UpdatePriceResult =
  | { ok: true; products: ProductDTO[] }
  | { ok: false; error: string };

export async function updatePriceAction(
  input: UpdatePriceInput
): Promise<UpdatePriceResult> {
  const { productId, newPrice, role, after } = input;

  if (role !== 'admin') {
    throw new Error('Forbidden');
  }

  if (typeof newPrice !== 'number' || Number.isNaN(newPrice) || newPrice <= 0) {
    return { ok: false, error: 'Price must be positive' };
  }

  await updateProductPriceInDb(productId, newPrice);
  updateTag('catalog-products');

  if (after) {
    after({
      productId,
      newPrice,
      event: 'PRICE_UPDATED',
    });
  }

  const products = await getProductsCatalog();
  return { ok: true, products };
}
