# Challenge: Server Data Serialization and Article Reader

You are building an article reader pipeline that fetches raw database records (`RawArticleRecord`) on the server, sanitizes them across the Server-to-Client serialization boundary, and renders loading, not-found, error, and loaded states cleanly.

## Requirements

1. **`prepareArticleProps(rawArticle)`**:
   - Accept a `RawArticleRecord` that may contain:
     - `publishedAt` as a `Date` instance or an ISO `string`
     - Non-serializable fields/methods such as `dbClient`, `formatDate` (functions), `analyticsMap` (`Map`), or arbitrary extra server-only properties
   - Convert `publishedAt` into an ISO-8601 string (`publishedAt instanceof Date ? publishedAt.toISOString() : String(publishedAt)`). Throw a `TypeError` if `publishedAt` is an invalid `Date` (for example `new Date('invalid')`) or not a `Date`/`string`.
   - Strip all non-serializable values (`function`, `Map`, `Set`, `dbClient`, etc.) and return an explicit JSON-safe `SerializedArticleDto` containing **only**:
     `{ id, slug, title, summary, body, author, publishedAt, initialLikes, tags }`.
   - Validate that `tags` contains strings and that the resulting DTO passes `isJsonSerializable(dto)` (no `Date`, `Map`, `Set`, `function`, `symbol`, or `undefined` values remain).

2. **`<LikeButton articleId={...} initialLikes={...} />`**:
   - Client leaf component that receives **only** serializable props (`articleId: string` and `initialLikes: number`).
   - Renders a `<button type="button">` with `aria-pressed={liked}` that toggles between liked and unliked states, updating the displayed count (`Likes: X`).

3. **`<ArticleReaderApp fetchArticle={...} slug={...} />`**:
   - Accepts optional `fetchArticle?: (slug: string) => Promise<RawArticleRecord | null>` and `slug?: string` (using a built-in default sample fetcher and slug when omitted for live preview).
   - While loading, renders an element with `role="status"` (`"Loading article..."`).
   - If `fetchArticle(slug)` resolves to `null`, renders `"Article not found"`.
   - If `fetchArticle(slug)` rejects, renders an element with `role="alert"` displaying the error message and a `"Retry"` button that re-invokes `fetchArticle(slug)`.
   - When resolved, passes the raw record through `prepareArticleProps(raw)`, renders the article title, author, `publishedAt`, tags, body, and `<LikeButton articleId={dto.id} initialLikes={dto.initialLikes} />`.
