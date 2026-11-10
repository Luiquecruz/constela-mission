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
  // TODO:
  // 1. Verify input.role === 'admin' (throw new Error('Forbidden') otherwise)
  // 2. Validate input.newPrice > 0 (return { ok: false, error: 'Price must be positive' } otherwise)
  // 3. Update price in DB and call updateTag('catalog-products')
  // 4. Schedule PRICE_UPDATED audit entry via input.after
  void updateTag;
  void updateProductPriceInDb;
  const products = await getProductsCatalog();
  return { ok: true, products };
}
