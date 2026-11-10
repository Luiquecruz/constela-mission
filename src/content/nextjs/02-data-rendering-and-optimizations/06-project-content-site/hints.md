In `routing.ts`, normalize `pathname` by stripping trailing slashes (keeping `'/'` intact), then split on `'/'`: `segments.length === 0` maps to `{ view: 'home' }`, `segments.length === 2 && segments[0] === 'articles'` maps to `{ view: 'article', slug: segments[1] }`, and everything else maps to `{ view: 'not-found' }`.
---
In `metadata.ts`, import `getPosts` and `getPostBySlug` from `./data`. Apply `SITE_TITLE_TEMPLATE.replace('%s', post.title)` for resolved post titles and normalize `baseUrl.replace(/\/+$/, '')` inside `generateSitemap(baseUrl)`.
---
In `App.tsx`, keep `notes` (or `noteCount`) and `pathname` inside the root `App` state so navigating between `'/'` and `'/articles/[slug]'` updates the inner page view without resetting the layout's saved reader notes.
