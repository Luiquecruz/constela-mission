In `generatePostStaticParams(posts)`, map each post to `{ slug: post.slug }` so the return shape matches Next.js `generateStaticParams()`.
---
In `classifyRouteExecution`, extract the slug with `pathname.split('/').filter(Boolean).at(-1) ?? ''` and check `staticParams.some((p) => p.slug === slug)`.
---
Evaluate the rules in strict order: check `!isPreGenerated && !dynamicParams` (`'not-found'`) first, then `usesDynamicApi` (`'dynamic'`), then `!isPreGenerated` (`'dynamic'`), and finally `'static'`.
