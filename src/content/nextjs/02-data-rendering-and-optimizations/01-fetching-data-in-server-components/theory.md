# Fetching Data in Server Components

In a traditional React Single-Page Application (SPA), a component mounts on the client with empty state, triggers a `useEffect` call, renders a loading spinner, waits for a JSON API round-trip, and finally paints the content. When child components also fetch inside their own `useEffect` hooks, you end up with **network waterfalls**—each nested fetch waits for its parent to finish rendering before it even starts.

Next.js App Router flips this model by making every component a **Server Component** by default. Because Server Components run on the server before HTML or component payloads stream to the browser, they can be declared `async` and `await` databases, CMS SDKs, or `fetch()` calls directly inside the component body.

## From `useEffect` Waterfalls to `async` Server Components

Compare a client-side SPA fetch pattern with a Server Component:

```tsx
// app/articles/[slug]/page.tsx — async Server Component
import { db } from '@/lib/db';
import { LikeButton } from './LikeButton';

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = await db.articles.findBySlug(slug);

  if (!article) {
    return <p>Article not found</p>;
  }

  return (
    <article>
      <h1>{article.title}</h1>
      <time dateTime={article.publishedAt.toISOString()}>
        {article.publishedAt.toISOString()}
      </time>
      <p>{article.body}</p>
      <LikeButton
        articleId={article.id}
        initialLikes={article.initialLikes}
      />
    </article>
  );
}
```

Co-locating the data read directly inside the Server Component that needs it gives you three immediate benefits:

1. **Zero client bundle cost for data access**: Database drivers, query builders, and secret API keys stay strictly on the server.
2. **No client-side fetch waterfall for initial data**: The server resolves the query before streaming the rendered UI, eliminating extra browser-to-API round-trips.
3. **Parallel fetching when independent**: Multiple `async` sibling Server Components—or `Promise.all([getArticle(slug), getComments(slug)])` inside a single component—execute concurrently on the server instead of waiting sequentially.

## Handling Empty, Not-Found, and Error States

Server-first fetching does not remove the need for defensive UI states:

- **Not-found / empty records**: Always check for `null` or empty lists after `await`. In Next.js routes, calling `notFound()` renders the nearest `not-found.tsx` boundary, while an empty collection renders an explicit empty-state message.
- **Rejected queries and network errors**: Wrap fallible reads or let an `error.tsx` Error Boundary catch unexpected throws and offer a `reset()` recovery action. When rendering interactive client data readers (or fallback boundaries), show an accessible status indicator (`role="status"`) while pending and an alert (`role="alert"`) with retry controls on failure.

## The Serialization Boundary to Client Components

Even when data is fetched on the server, interactive UI leaves—like a `<LikeButton />` using `useState`—still require `'use client'`. Any prop you pass from a Server Component down to a Client Component must be **serializable** over the wire.

Treat the Server-to-Client prop boundary like a strict Data Transfer Object (DTO) contract:

- **Safe JSON-compatible values**: `string`, `number`, `boolean`, `null`, plain objects, and arrays of serializable values.
- **Convert `Date` instances explicitly**: Converting `publishedAt` to an ISO-8601 string (`publishedAt.toISOString()`) guarantees consistent formatting across server and client timezones, avoids React hydration mismatches from locale-dependent `toLocaleDateString()` calls, and keeps payloads pure JSON.
- **Never cross with live server objects**: Database clients (`dbClient`), ORM model methods, plain functions/callbacks, `Map` / `Set` instances with unprojected internal state, or private credentials must be stripped before passing props across the boundary.

Projecting raw database records through an explicit helper like `prepareArticleProps(raw)` ensures non-serializable fields are stripped, dates become deterministic ISO strings, and only safe DTO fields cross into `'use client'` components. (In the next module, you will build on this foundation to explore React Flight's full boundary semantics and `'use server'` actions.)

## When to choose it

- **Fetch in an `async` Server Component** whenever a route or subtree needs initial data from a database, file system, internal microservice, or authenticated third-party API. You avoid exposing credentials, skip building a throwaway REST endpoint just to feed your own page, and eliminate client `useEffect` waterfalls.
- **Fetch on the client (or pass an interactive fetcher)** only when data depends on live browser state that updates continuously after mount—such as real-time polling, debounced typeahead search, or client-only browser APIs.
- **Always add a DTO sanitizer (`prepareArticleProps`) at the boundary** when passing fetched records into a `'use client'` leaf component so raw database connections, helper methods, `Date` formatting inconsistencies, and internal fields never leak into serialized client props.
