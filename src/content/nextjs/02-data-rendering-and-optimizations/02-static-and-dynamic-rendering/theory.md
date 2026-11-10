<!-- coderabbit-ai-generated:v1 -->

<!-- coderabbit-ai-generated-section:v1:4dc0d4a804c5c0b7e5f23018745bc491d56b3a14451316013dd2e030de8a9a0e -->

<!-- coderabbit-ai-generated-section:v1:ede5f3643365dd06f074ad1c1f66da6e6f8c896db601b183dc57a0967e88c3da -->

# Static and Dynamic Rendering with `generateStaticParams`

By default, Next.js tries to do as much rendering work as possible **once at build time** rather than repeating it on every incoming HTTP request. Understanding when a route stays **static** versus when it switches to **dynamic** per-request execution is essential for predictable latency, CDN cacheability, and avoiding accidental slowdowns in production.

## Static Rendering vs. Dynamic Rendering

- **Static Rendering (Prerendering)**: Next.js renders the route at build time, on the first request for an unlisted slug, or during background revalidation, producing cached HTML and React Server Component payloads that can be served directly from a CDN edge node with sub-50 ms TTFB.
- **Dynamic Rendering**: Next.js renders the route **at request time** for each incoming user request. This is necessary when output depends on per-user cookies, request headers, query strings, or uncached live data.

## Pre-rendering Dynamic Segments with `generateStaticParams`

A dynamic route file such as `app/blog/[slug]/page.tsx` can receive infinitely many URL values, so Next.js cannot guess which slugs to build ahead of time on its own. Exporting `generateStaticParams` supplies the exact list of parameter objects to prerender at build time:

```tsx
// app/blog/[slug]/page.tsx
export const dynamicParams = true; // default: render unknown slugs on demand

export async function generateStaticParams() {
  const posts = await getPublishedPosts();
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  return <article>{post.title}</article>;
}
```

The `dynamicParams` segment export controls what happens when a visitor requests a `slug` that was **not** returned by `generateStaticParams()`:

- **`dynamicParams = true` (default)**: For a route eligible for static rendering, Next.js statically generates the page on demand on the first request and caches it for subsequent visitors. This is distinct from dynamic rendering on every request; an unlisted slug alone does not make the route dynamic. Dynamic request APIs or an explicit `dynamic = 'force-dynamic'` configuration instead require per-request rendering. This lesson models the classic route configuration without Cache Components and assumes no other configuration or uncached data opts the route into dynamic rendering.
- **`dynamicParams = false`**: Any `slug` absent from `generateStaticParams()` immediately returns a **404 Not Found** response without hitting your page component or database. This is ideal for fixed documentation sets or closed catalogs where unknown URLs should fail fast.

## What Triggers Dynamic Rendering Automatically?

Even if a route exports `generateStaticParams()`, reading any **Dynamic Request API** inside a Server Component opts the route into **request-time Dynamic Rendering**:

- **`cookies()`** — reading user session tokens, theme preferences, or A/B test buckets.
- **`headers()`** — inspecting `Accept-Language`, `User-Agent`, `x-forwarded-for`, or authorization headers.
- **`searchParams`** — reading `?sort=asc` or `?q=nextjs` query parameters inside `page.tsx`.
- **`connection()`** — explicitly signaling that rendering must wait for an incoming request rather than running during prerendering.

## Bridging Baseline Rendering to PPR and `'use cache'`

In the classic mental model, an entire route was binary—either fully **static** or fully **dynamic**. A single `cookies()` call inside a header avatar forced the whole article body to re-render on every request.

Later modules build directly on this foundation to solve that all-or-nothing trade-off:

- **Module 04 (Partial Prerendering — PPR)** splits a single route into a static shell streamed immediately from the edge plus dynamic `<Suspense>` holes filled at request time.
- **Module 05 (`'use cache'`)** replaces implicit route-wide heuristics with explicit, declarative component-level and function-level caching via `'use cache'` and `cacheLife()`.

Mastering static vs. dynamic classification first gives you the exact mental model needed to design PPR boundaries and declarative cache scopes cleanly.

## When to choose it

- **Static Rendering with `generateStaticParams` (`dynamicParams = false`)**: Choose for marketing pages, fixed product docs, editorial guides, and finite static paths where unknown slugs should return 404 immediately.
- **Static Rendering with `generateStaticParams` (`dynamicParams = true`)**: Choose for large blogs or e-commerce catalogs where you prebuild the top 200 popular routes at build time and render long-tail pages on demand.
- **Dynamic Rendering (Dynamic APIs)**: Choose when the response genuinely varies per visitor—personalized dashboards, authenticated account screens, localized currency headers, or search results driven by `searchParams`.


<!-- /coderabbit-ai-generated:v1 -->