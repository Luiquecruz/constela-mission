# Migration Playbook: Codemods, Turbopack and Self-Hosted Cache Handlers

Upgrading a production Next.js codebase to Next.js 16 is smoothest when treated as an automated, deterministic checklist rather than an ad-hoc find-and-replace exercise. Modern Next.js pairs official AST codemods with clear runtime baselines, Turbopack as the default bundler, and pluggable cache handlers for multi-instance self-hosting.

## 1. Runtime Baselines and LTS Lifecycle Discipline

Before running any upgrade scripts, verify your foundational toolchain:

- **Node.js `20.9.0` or newer**: Next.js 16 drops support for older Node.js lines and tracks the Node.js Long-Term Support (LTS) lifecycle—specifically targeting runtimes in the Active LTS or Maintenance LTS stages so native Web Crypto, `fetch`, and stream primitives behave consistently across local machines and production containers.
- **TypeScript `5.1.0` or newer**: Required for async Server Component return types and generated route type helpers (`PageProps`, `LayoutProps`).
- **Modern Browser Baseline**: Targets evergreens supporting native ES modules and baseline CSS features.

## 2. Running Automated Codemods

The `@next/codemod` CLI upgrades dependencies and rewrites breaking AST patterns across your project:

```bash
# Run the interactive upgrade orchestrator
npx @next/codemod@canary upgrade latest

# Convert synchronous params, searchParams, cookies(), and headers() to async await
npx @next/codemod@canary next-async-request-api .

# Migrate middleware.ts convention to proxy.ts
npx @next/codemod@canary middleware-to-proxy .
```

### What the Codemods and Manual Checks Address

1. **Async Request APIs (`next-async-request-api`)**: `params`, `searchParams`, `cookies()`, `headers()`, and `draftMode()` are asynchronous Promises. Any remaining synchronous property accesses must be awaited.
2. **Network Boundary Rename (`middleware-to-proxy`)**: Renames `middleware.ts` to `proxy.ts` and updates the exported `middleware` function to `proxy`.
3. **Cache Components and Tag Invalidation**:
   - Replace legacy `experimental.dynamicIO` or `experimental.ppr` flags with `cacheComponents: true` in `next.config.ts`.
   - Single-argument `revalidateTag(tag)` calls are deprecated. Pass a `cacheLife` profile as the second argument (`revalidateTag('products', 'max')`) for background stale-while-revalidate invalidation, or switch to `updateTag('products')` inside Server Actions when callers require immediate read-your-own-writes consistency.
4. **Turbopack by Default**: `next dev` and `next build` use Turbopack automatically. Remove redundant `--turbopack` CLI flags from `package.json`, or pass `--webpack` explicitly if a legacy custom webpack plugin still blocks migration.

## 3. Self-Hosting Across Multiple Replicas

When deploying a single Node.js container, Next.js stores cached entries in local memory and on the container's filesystem. However, as soon as you scale horizontally to **multiple containers or Kubernetes pods (`replicas > 1`)**, an in-memory or local-disk cache becomes isolated per instance:

- Calling `updateTag('catalog')` on Pod A leaves Pod B serving stale entries until Pod B's TTL expires.

To achieve coherent cache invalidation across a self-hosted fleet, configure a shared distributed `cacheHandler` (backed by Redis, Valkey, or shared object storage) in `next.config.ts`:

```ts
// next.config.ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  cacheComponents: true,
  cacheHandler: require.resolve('./cache-handler.mjs'),
  cacheMaxMemorySize: 0, // Disable per-pod in-memory duplication when using Redis
  images: {
    qualities: [75],
  },
}

export default nextConfig
```

## When to choose it

- **Run `@next/codemod@canary upgrade latest`** first on every repository upgrade before fixing edge cases manually.
- **Keep the default filesystem/memory cache** only for single-instance self-hosted deployments or managed serverless platforms that provide built-in shared cache storage.
- **Configure a custom `cacheHandler` with `cacheMaxMemorySize: 0`** whenever you self-host Next.js across two or more load-balanced containers or pods.
