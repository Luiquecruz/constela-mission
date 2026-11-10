In `loadProductDashboardParallel`, invoke `loaders.fetchProduct(productId)`, `loaders.fetchReviews(productId)`, and `loaders.fetchInventory(productId)` inside `Promise.all([...])` rather than chaining three separate `await` statements.
---
Destructure the resolved tuple from `await Promise.all([productPromise, reviewsPromise, inventoryPromise])` and return `{ product, reviews, inventory }`.
---
In `<StreamingProductPage>`, always render `product.name` and `$${product.price}` in the top section, and conditionally render `<div role="status">Loading customer reviews...</div>` when `isReviewsLoading` is `true`, or `slowReviewsSlot` when `isReviewsLoading` is `false`.
