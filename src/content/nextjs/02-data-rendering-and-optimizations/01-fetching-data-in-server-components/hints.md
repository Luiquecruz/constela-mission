In `prepareArticleProps(rawArticle)`, check `rawArticle.publishedAt instanceof Date` (verifying `!Number.isNaN(rawArticle.publishedAt.getTime())`) and convert it with `.toISOString()`. Reject non-Date/non-string values with a `TypeError`.
---
Construct a fresh object literal with only `{ id, slug, title, summary, body, author, publishedAt, initialLikes, tags }` instead of spreading `...rawArticle`, so `dbClient`, `Map` instances, and helper functions are never copied over.
---
In `ArticleReaderApp`, track `status` (`'loading' | 'loaded' | 'not-found' | 'error'`), `article`, `errorMessage`, and an `attempt` counter in `useState`. Incrementing `attempt` inside the `"Retry"` button handler cleanly re-triggers `useEffect`.
