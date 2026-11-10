# Project: Next.js Engineering Content Site

Before advancing to hybrid Server/Client execution boundaries, streaming Suspense, and declarative caching, this project ties together every foundational Next.js App Router building block into a cohesive **Engineering Content Site** (`Constela Press`).

## Architecture of a Content Site in App Router

A production editorial or documentation site separates four responsibilities cleanly across modules:

1. **Data Access & Serialization (`data.ts`)**:
   - Co-locate async read functions (`getPosts()`, `getPostBySlug(slug)`) on the server.
   - Return clean, JSON-serializable `PostDto` objects with normalized ISO date strings (`publishedAt`) and zero database handles or helper methods attached.
2. **Routing & Pre-rendering (`routing.ts`)**:
   - Export `generateStaticParams()` returning `[{ slug }]` entries so article pages can be statically prerendered at build time.
   - Match incoming paths (`/` for the article feed, `/articles/[slug]` for detail views, and unknown paths to a dedicated not-found boundary).
   - Provide deterministic filtering helpers (`filterPostsByTag`) for topic views.
3. **Metadata & SEO Files (`metadata.ts`)**:
   - Apply a consistent root title template (`'%s | Constela Press'`) when rendering individual articles while falling back to `'Constela Press'` on the index route.
   - Generate Open Graph tags (`og:title`, `og:description`, `og:type: 'article'`) per post and emit typed `sitemap.xml` entries for search crawlers.
4. **Persistent Root Layout Shell (`App.tsx`)**:
   - In the Next.js App Router, `layout.tsx` wraps child `page.tsx` views and **preserves state across client navigations** without unmounting.
   - A root navigation bar marks the active link with `aria-current="page"` for accessibility, while layout-level state (such as a reader's saved study notes or reading list counter) survives transitions between `'/'` and `'/articles/[slug]'`.
   - Async data loading displays an accessible status indicator (`role="status"`), and missing slugs or unknown paths render an explicit `"Article not found"` view with a link back home.

## Why Separate These Layers?

Keeping `data.ts`, `routing.ts`, `metadata.ts`, and `App.tsx` decoupled mirrors real Next.js App Router projects:

- **`generateMetadata` and `page.tsx`** share the exact same `getPostBySlug()` reader without duplicating query logic.
- **`sitemap.ts` and `generateStaticParams()`** read from the same canonical `getPosts()` source so new posts automatically appear in static builds and search sitemaps together.
- **Root Layout components** stay focused on navigation chrome and persistent cross-route state while individual pages focus on route data.

## When to choose it

- **Use this multi-module content-site architecture** for engineering blogs, documentation portals, changelogs? No—product guides, knowledge bases, and editorial publications where SEO metadata, static prerendering via `generateStaticParams`, and fast navigation across a persistent layout shell matter most.
- **Avoid coupling metadata formatting or route matching inside UI components**: extracting them into dedicated `metadata.ts` and `routing.ts` modules keeps server route handlers, `sitemap.ts`, `generateMetadata()`, and UI shells consistent and independently testable.
