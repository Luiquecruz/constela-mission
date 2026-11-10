1. Refactor `loadProductDashboardParallel(loaders, productId)` to invoke all three loader functions before awaiting:
   ```ts
   const [product, reviews, inventory] = await Promise.all([
     loaders.fetchProduct(productId),
     loaders.fetchReviews(productId),
     loaders.fetchInventory(productId),
   ]);
   return { product, reviews, inventory };
   ```
2. In `StreamingProductPage`, keep the product header (`product.name`, `$${product.price}`, and stock count) outside the loading check so it always renders immediately.
3. Inside the reviews boundary section, check `isReviewsLoading`: if `true`, render `<p role="status">Loading customer reviews...</p>`; otherwise render `{slowReviewsSlot}`.
4. In `App`, manage `isReviewsLoading` state and wire the `"Toggle reviews stream"` button to toggle the boundary state.
