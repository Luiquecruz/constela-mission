# Challenge: Metadata Resolver, Sitemap & Robots Generators, and SEO Preview

You are building the metadata resolution and SEO file generation utilities for a Next.js content platform (`Constela`), along with an interactive `<SeoPreviewApp />` inspector.

## Requirements

1. **`resolvePageMetadata(parentMeta, pageMetaOrFn, context)`**:
   - Accept:
     - `parentMeta`: `{ title: string | { default: string; template: string }; description?: string; openGraph?: Record<string, string> }`
     - `pageMetaOrFn`: either a static child metadata object `{ title?: string; description?: string; openGraph?: Record<string, string> }`, `undefined`, or a function `(context) => ChildMetadata`
     - `context`: optional argument forwarded to `pageMetaOrFn(context)` when `pageMetaOrFn` is a function
   - Resolve `title`:
     - If the child supplies a non-empty string `title` and `parentMeta.title` is an object with `template` containing `'%s'`, replace `'%s'` with the child `title`.
     - If the child supplies a non-empty string `title` and `parentMeta.title` is a plain string (or has no `template`), use the child `title` as-is.
     - If the child omits `title` (or it is empty), fall back to `parentMeta.title.default` (or `parentMeta.title` if string).
   - Resolve `description`: `childMeta.description ?? parentMeta.description ?? ''`.
   - Resolve `openGraph`: merge `{ ...(parentMeta.openGraph ?? {}), ...(childMeta.openGraph ?? {}) }`, and default `openGraph.title` to the resolved `title` (when not explicitly set in `childMeta.openGraph?.title`) and `openGraph.description` to the resolved `description` (when not explicitly set in `childMeta.openGraph?.description`).

2. **`buildSitemap(baseUrl, posts)`**:
   - Strip any trailing slash from `baseUrl`.
   - Return an array of `SitemapEntry` objects starting with the root entry (`url: cleanBase`, `lastModified: posts[0]?.updatedAt ?? '2026-01-01'`, `changeFrequency: 'weekly'`, `priority: 1`) followed by one entry per post (`url: `${cleanBase}/blog/${post.slug}``, `lastModified: post.updatedAt`, `changeFrequency: 'monthly'`, `priority: 0.8`).

3. **`buildRobots(baseUrl, disallowPaths)`**:
   - Strip any trailing slash from `baseUrl`.
   - Return `{ rules: [{ userAgent: '*', allow: '/', disallow: [...disallowPaths] }], sitemap: `${cleanBase}/sitemap.xml` }`.

4. **`<SeoPreviewApp />`**:
   - Provide a selector for pages/posts (e.g., Home / default metadata, plus sample blog posts) and render live previews for:
     - Resolved `<title>` (`data-testid="resolved-title"`)
     - Open Graph card (`data-testid="og-preview"` displaying `og:title`, `og:description`, and `og:type`)
     - Generated `robots.txt` text (`data-testid="robots-preview"`)
     - Generated `sitemap.xml` URL list (`data-testid="sitemap-preview"`)
