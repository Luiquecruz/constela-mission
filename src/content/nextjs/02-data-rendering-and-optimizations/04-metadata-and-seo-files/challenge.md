<!-- coderabbit-ai-generated:v1 -->

<!-- coderabbit-ai-generated-section:v1:1a698c6f29461dd9b48af1f4bb5e4568b051a612bd9e1a7da3d1e6c21b70ef7f -->

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
   - Resolve `openGraph`: if `childMeta.openGraph` is defined (including `{}`), copy that object, replacing the parent's entire `openGraph` object. Otherwise copy `parentMeta.openGraph ?? {}`. Parent fields such as `siteName` and `images` are lost on replacement unless explicitly included in the child.
   - For this simulator's preview defaults, set `openGraph.title` to the resolved `title` when `childMeta.openGraph?.title` is falsy, and `openGraph.description` to the resolved `description` when `childMeta.openGraph?.description` is falsy. Preserve explicit non-empty child values and do not mutate either input. These preview defaults supplement Next.js's shallow segment merging. To retain shared Open Graph values, explicitly spread them into the child object (or read parent metadata in a real `generateMetadata`).

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


<!-- /coderabbit-ai-generated:v1 -->