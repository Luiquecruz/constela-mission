<!-- coderabbit-ai-generated:v1 -->

<!-- coderabbit-ai-generated-section:v1:6fee13839af9534cd947c5a1646de073d86a5bab79c7bb4bc49d0819350ff669 -->

<!-- coderabbit-ai-generated-section:v1:22e7e9f0f9ad1561b506f4a759970a91c3ff756ffea1ff0dd2c3ea9aff611908 -->

# Project Challenge: Constela Press Engineering Content Site

Build a complete multi-file Next.js-style engineering blog across four modules: `data.ts`, `routing.ts`, `metadata.ts`, and `App.tsx`.

## Requirements

1. **`data.ts`**:
   - Export `POSTS: PostDto[]` (at least 3 engineering articles across distinct tags such as `'rendering'`, `'routing'`, and `'optimization'`).
   - Export `async getPosts(): Promise<PostDto[]>` returning cloned serializable `PostDto` objects (`slug`, `title`, `summary`, `body`, `author`, `tag`, `publishedAt`, `readingTimeMinutes`).
   - Export `async getPostBySlug(slug: string): Promise<PostDto | null>` returning a matching cloned `PostDto` or `null` when not found.

2. **`routing.ts`**:
   - Export `generateStaticParams()` returning `Array<{ slug: string }>` for all posts in `POSTS`.
   - Export `matchBlogRoute(pathname: string)`:
     - `'/'` (after normalizing trailing slashes) -> `{ view: 'home' }`
     - `'/articles/<slug>'` (single non-empty segment after `/articles/`) -> `{ view: 'article', slug }`
     - Any other pathname -> `{ view: 'not-found' }`
   - Export `filterPostsByTag(posts: PostDto[], tag: string): PostDto[]` returning all posts when `tag === 'all'` or blank, otherwise only posts whose `post.tag === tag`.

3. **`metadata.ts`**:
   - Export `SITE_TITLE_TEMPLATE = '%s | Constela Press'` and `DEFAULT_SITE_TITLE = 'Constela Press'`.
   - Export `async generatePostMetadata(slug: string)` returning `{ title, description, openGraph: { title, description, type } }`:
     - When `getPostBySlug(slug)` finds a post, apply `'%s | Constela Press'` (`${post.title} | Constela Press`) and set `openGraph.type` to `'article'`.
     - When missing, return `{ title: 'Article Not Found | Constela Press', description: 'The requested engineering article could not be found.', openGraph: { title: 'Article Not Found | Constela Press', description: 'The requested engineering article could not be found.', type: 'website' } }`.
   - Export `async generateSitemap(baseUrl: string)` trimming trailing slashes from `baseUrl` and returning the root entry (`url: cleanBase`, `priority: 1`) plus one entry per post (`url: `${cleanBase}/articles/${post.slug}``, `priority: 0.8`).

4. **`App.tsx`**:
   - Root layout shell accepting optional `{ initialPath?: string }` (default `'/'`) with:
     - A persistent `<nav aria-label="Primary">` containing links (`Home` -> `'/'`, plus quick article links including `Static Params` -> `'/articles/static-params-and-layouts'`) that applies `aria-current="page"` to the active route link.
     - Persistent layout-level reader notes state with a button named `"Add reader note"` that increments a `"Saved notes: X"` counter with `data-testid="saved-notes"` inside the layout shell that **persists across route navigations**.
   - Show a loading indicator (`role="status"`) while async data loads.
   - On `'/'`: render tag filter buttons (`All`, `rendering`, `routing`, `optimization`) and clickable article cards linking to `/articles/${post.slug}`.
   - On `'/articles/[slug]'`: display a metadata preview bar (`data-testid="metadata-title"`) showing the resolved `generatePostMetadata(slug).title`, the article title, author, reading time, body, and a `"Back to all articles"` link.
   - On `'not-found'` (either unknown path or unknown article slug): render heading `"Article not found"` and a `"Back to home"` link returning to `'/'`.


<!-- /coderabbit-ai-generated:v1 -->