1. Complete `data.ts` so `getPosts()` and `getPostBySlug(slug)` return cloned, JSON-safe `PostDto` records (and `null` when a slug is absent).
2. Implement `generateStaticParams()`, `matchBlogRoute(pathname)`, and `filterPostsByTag(posts, tag)` in `routing.ts` to map `'/'`, `'/articles/[slug]'`, and unknown paths accurately.
3. Implement `generatePostMetadata(slug)` and `generateSitemap(baseUrl)` in `metadata.ts` using `'%s | Constela Press'` and normalized URLs.
4. Wire `App.tsx` as a persistent root layout shell holding navigation (`aria-current="page"`), layout-level reader notes state, `role="status"` loading indicator, tag filtering on home, metadata banner on article pages, and `"Article not found"` recovery view.
