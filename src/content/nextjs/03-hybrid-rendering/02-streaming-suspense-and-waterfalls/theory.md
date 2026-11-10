# Streaming, Suspense Boundaries and Eliminating Waterfalls

When an `async` Server Component awaits multiple independent data sources one after another, each network round-trip waits for the previous one to finish before even starting. Worse, if a single slow query sits at the top of a page component without a `<Suspense>` boundary, the entire HTTP response is blocked until the slowest query resolves.

## Sequential Waterfalls vs Parallel Initiation

A classic server waterfall looks harmless in code:

```tsx
// Anti-pattern: sequential server waterfall (sum of all latencies)
export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await fetchProduct(id);     // 80ms
  const inventory = await fetchInventory(id); // 90ms (waits for product!)
  const reviews = await fetchReviews(id);     // 450ms (waits for inventory!)
  return <ProductView product={product} inventory={inventory} reviews={reviews} />;
}
```

When the queries only depend on `id`, initiate the promises immediately and await them together with `Promise.all` (or pass the unawaited promise down to a suspended child):

```tsx
export async function loadProductDashboardParallel(loaders: Loaders, productId: string) {
  const [product, reviews, inventory] = await Promise.all([
    loaders.fetchProduct(productId),
    loaders.fetchReviews(productId),
    loaders.fetchInventory(productId),
  ]);
  return { product, reviews, inventory };
}
```

Now total latency drops from `80 + 90 + 450 = 620ms` to `max(80, 90, 450) = 450ms`.

## Streaming Slow Subtrees with `<Suspense>`

Even with parallel initiation, awaiting `fetchReviews` in the top-level page delays the initial HTML until the 450ms reviews query completes. By moving the `await` into a child Server Component (or passing the promise to a Client Component that reads it with `use(reviewsPromise)`) wrapped in `<Suspense>`, Next.js flushes the critical product header immediately and streams the reviews HTML chunk over the same HTTP connection once ready:

```tsx
export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // Start both immediately!
  const reviewsPromise = fetchReviews(id);
  const product = await fetchProduct(id);

  return (
    <main>
      <ProductHeader product={product} />
      <Suspense fallback={<div role="status">Loading customer reviews...</div>}>
        <CustomerReviews reviewsPromise={reviewsPromise} />
      </Suspense>
    </main>
  );
}
```

### Granular `<Suspense>` vs Coarse `loading.tsx`

- **`loading.tsx`** wraps the entire route segment in a single `<Suspense>` boundary. It is ideal for immediate route transitions when the whole page needs a skeleton.
- **Explicit `<Suspense>`** boundaries inside a page let you prioritize critical above-the-fold data (product title, price, buy button) while streaming secondary regions (reviews, recommendations, activity logs) independently.

## When to choose it

- **Use `Promise.all` / `Promise.allSettled`** when multiple independent queries are all required to render the same cohesive UI block.
- **Initiate a promise early and wrap a child in `<Suspense>`** when one data source is significantly slower or less critical than the primary page content.
- **Keep `<Suspense>` fallbacks dimensionally stable** so streamed replacements do not trigger Cumulative Layout Shift (CLS).

