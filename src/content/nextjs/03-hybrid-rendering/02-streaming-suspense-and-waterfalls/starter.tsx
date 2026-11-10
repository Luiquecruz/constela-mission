import React, { useState } from 'react';

export interface ProductSummary {
  id: string;
  name: string;
  price: number;
  stockCount: number;
}

export interface ReviewItem {
  id: string;
  author: string;
  rating: number;
  comment: string;
}

export interface InventoryStatus {
  warehouse: string;
  available: number;
}

export interface DashboardLoaders {
  fetchProduct: (id: string) => Promise<ProductSummary>;
  fetchReviews: (id: string) => Promise<ReviewItem[]>;
  fetchInventory: (id: string) => Promise<InventoryStatus>;
}

// TODO 1: Eliminate the sequential waterfall by starting all 3 requests in parallel
export async function loadProductDashboardParallel(
  loaders: DashboardLoaders,
  productId: string
): Promise<{
  product: ProductSummary;
  reviews: ReviewItem[];
  inventory: InventoryStatus;
}> {
  // BUG: Sequential waterfall! fetchReviews waits for fetchProduct, and fetchInventory waits for both.
  const product = await loaders.fetchProduct(productId);
  const reviews = await loaders.fetchReviews(productId);
  const inventory = await loaders.fetchInventory(productId);

  return { product, reviews, inventory };
}

export function ReviewsSlotList({ reviews }: { reviews: ReviewItem[] }) {
  return (
    <ul aria-label="Customer Reviews" style={{ paddingLeft: 18, margin: '8px 0' }}>
      {reviews.map((review) => (
        <li key={review.id} style={{ marginBottom: 6 }}>
          <strong>{review.author}</strong> ({review.rating}/5): {review.comment}
        </li>
      ))}
    </ul>
  );
}

// TODO 2: Render the fast product header even while isReviewsLoading is true,
// and show a role="status" fallback ("Loading customer reviews...") inside the reviews boundary.
export function StreamingProductPage({
  product,
  slowReviewsSlot,
  isReviewsLoading,
}: {
  product: ProductSummary;
  slowReviewsSlot: React.ReactNode;
  isReviewsLoading: boolean;
}) {
  // BUG: Blocking the entire component when reviews are loading!
  if (isReviewsLoading) {
    return <div>Waiting for everything...</div>;
  }

  return (
    <article
      style={{
        border: '1px solid #cbd5e1',
        borderRadius: 8,
        padding: 16,
      }}
    >
      <header style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: 12, marginBottom: 12 }}>
        <h2 style={{ margin: 0 }}>{product.name}</h2>
        <p style={{ margin: '4px 0', fontWeight: 600 }}>${product.price}</p>
        <small>In stock: {product.stockCount} units</small>
      </header>

      <section aria-label="Reviews Boundary">
        <h3 style={{ margin: '0 0 8px' }}>Verified Reviews</h3>
        {slowReviewsSlot}
      </section>
    </article>
  );
}

const DEMO_PRODUCT: ProductSummary = {
  id: 'prod-42',
  name: 'Ultra-Low Latency Audio Interface',
  price: 349,
  stockCount: 14,
};

const DEMO_REVIEWS: ReviewItem[] = [
  {
    id: 'rev-1',
    author: 'Elena R.',
    rating: 5,
    comment: 'Sub-2ms roundtrip latency over USB-C with crystal clear preamps.',
  },
  {
    id: 'rev-2',
    author: 'Marcus T.',
    rating: 5,
    comment: 'Rock-solid drivers and zero noise floor on high-gain dynamic mics.',
  },
];

export function App() {
  const [isReviewsLoading, setIsReviewsLoading] = useState(false);

  return (
    <div style={{ fontFamily: 'sans-serif', maxWidth: 640, margin: '0 auto', padding: 16 }}>
      <div style={{ marginBottom: 12 }}>
        <button type="button" onClick={() => setIsReviewsLoading((prev) => !prev)}>
          Toggle reviews stream
        </button>
      </div>
      <StreamingProductPage
        product={DEMO_PRODUCT}
        isReviewsLoading={isReviewsLoading}
        slowReviewsSlot={<ReviewsSlotList reviews={DEMO_REVIEWS} />}
      />
    </div>
  );
}

export default App;
