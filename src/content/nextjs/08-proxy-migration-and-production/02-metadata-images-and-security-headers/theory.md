# Dynamic Metadata, Image Guardrails and Content Security Policy

Shipping a production Next.js application requires more than fast component rendering. Search engines and social crawlers rely on accurate metadata, Core Web Vitals depend on zero-layout-shift images and fonts, and enterprise security policies demand strict Content Security Policy (CSP) headers and image optimization guardrails.

## Dynamic Metadata with `generateMetadata` and Request Memoization

In the App Router, pages and layouts can export an asynchronous `generateMetadata` function to compute `<title>`, `<meta>`, and Open Graph tags dynamically. Because `params` is a Promise, you must `await params` before querying data.

A common worry is that calling the same data-fetching function in both `generateMetadata` and the Page component will hit the database or upstream API twice. By wrapping your query in `React.cache` (or using `fetch`), Next.js automatically deduplicates calls with identical arguments within the same render pass:

```tsx
// app/products/[slug]/page.tsx
import { cache } from 'react'
import type { Metadata } from 'next'

const getProduct = cache(async (slug: string) => {
  const res = await fetch(`https://api.example.com/products/${slug}`)
  return res.json() as Promise<{ name: string; summary: string; heroUrl: string }>
})

type Props = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const product = await getProduct(slug)

  return {
    title: `${product.name} | Acme Store`,
    description: product.summary,
    openGraph: {
      images: [{ url: product.heroUrl }],
    },
  }
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params
  const product = await getProduct(slug)
  return <h1>{product.name}</h1>
}
```

## `next/image` Guardrails and Zero-CLS Fonts

The `<Image>` component prevents Cumulative Layout Shift (CLS) by reserving aspect-ratio space before bytes arrive and serving modern formats like WebP or AVIF resized for the device viewport. However, an unguarded image optimizer can be abused by attackers requesting arbitrary external URLs or dozens of quality permutations (`?q=71`, `?q=72`, etc.) to exhaust CPU and CDN cache storage.

Modern Next.js tightens these defaults and lets you declare strict guardrails in `next.config.ts`:

```ts
// next.config.ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    qualities: [75],
    minimumCacheTTL: 14400, // 4 hours default revalidation ceiling
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.example.com',
        pathname: '/catalog/**',
      },
    ],
  },
}

export default nextConfig
```

- **`images.qualities: [75]`**: Restricts the optimizer to an explicit allowlist of quality values. Any request for an unlisted quality parameter is rejected, preventing cache-fragmentation attacks.
- **`minimumCacheTTL: 14400`**: Keeps optimized images cached for at least four hours (14,400 seconds) when upstream origin headers omit `Cache-Control` `max-age`, drastically reducing redundant re-optimizations.
- **`remotePatterns`**: Whitelists exact protocol, hostname, and path globs so the server never proxies arbitrary third-party domains.
- **`next/font`**: Downloads web fonts at build time, hosts them alongside your static assets with zero external network requests to font CDNs at runtime, and computes CSS `size-adjust` fallback metrics to eliminate font-swap layout shifts.

## Per-Request Content Security Policy (CSP) Nonces in `proxy.ts`

When your security posture forbids `'unsafe-inline'` scripts, you can generate a cryptographic nonce inside `proxy.ts` on every request, attach a `Content-Security-Policy` header, and read `x-nonce` via `await headers()` in your Root Layout:

```tsx
// proxy.ts
import { NextResponse, type NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64')
  const csp = `default-src 'self'; script-src 'self' 'nonce-${nonce}' 'strict-dynamic';`

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-nonce', nonce)
  requestHeaders.set('Content-Security-Policy', csp)

  const response = NextResponse.next({ request: { headers: requestHeaders } })
  response.headers.set('Content-Security-Policy', csp)
  return response
}
```

**Important trade-off**: Because a cryptographic nonce must be unique for every single HTTP response, reading the nonce during rendering opts the route into dynamic rendering per request.

## When to choose it

- **Use `generateMetadata` with `React.cache`** whenever route metadata depends on dynamic `params` or database lookups shared with the page tree.
- **Always configure `images.remotePatterns` and `images.qualities`** in `next.config.ts` to protect your image optimization pipeline from SSRF and cache-exhaustion vectors.
- **Use per-request CSP nonces in `proxy.ts`** for authenticated or compliance-critical routes that require strict inline script execution control, and use static CSP hashes or standard headers on fully cached marketing pages.
