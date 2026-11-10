# Challenge: Eliminate Request Waterfalls and Stream Slow Sections

A product detail page is suffering from slow Time to First Byte (TTFB) because its data loader awaits three independent services sequentially, and its UI blocks the entire product header while waiting for slow customer reviews.

## Requirements

1. **`loadProductDashboardParallel(loaders, productId)`**:
   - Accept `loaders` (`{ fetchProduct, fetchReviews, fetchInventory }`) and `productId: string`.
   - Start **all three** async calls (`fetchProduct(productId)`, `fetchReviews(productId)`, `fetchInventory(productId)`) in parallel using `Promise.all` so none of them waits for another to finish before starting.
   - Return `{ product, reviews, inventory }`.

2. **`<StreamingProductPage product={...} slowReviewsSlot={...} isReviewsLoading={...} />`**:
   - Immediately render the critical above-the-fold product information: `product.name`, formatted price (`$${product.price}`), and stock badge (`product.stockCount` units available).
   - Isolate the reviews section inside a streaming boundary region:
     - While `isReviewsLoading` is `true`, render an accessible status fallback (`role="status"`) containing the text `"Loading customer reviews..."` instead of blocking the product header.
     - When `isReviewsLoading` is `false`, render `slowReviewsSlot`.

3. **Interactive Preview (`App`)**:
   - Render `<StreamingProductPage>` with a button `"Toggle reviews stream"` that flips `isReviewsLoading` between `true` and `false` so you can inspect the immediate product shell alongside the streamed reviews boundary.
