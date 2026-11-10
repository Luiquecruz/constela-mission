# Challenge: URL-Synchronized Docs Navigation & Auth Redirect Guard

You are building an App Router documentation shell with an accessible `<NavBar />`, URL-synchronized category/sort filters, client router history (`push`, `replace`, `back`), and an authentication route guard using Next.js `redirect()` semantics.

## Requirements

1. **`buildUpdatedQuery(currentSearch, key, value)`**:
   - Accept `currentSearch: string` (with or without a leading `?`), `key: string`, and `value: string | null | undefined`.
   - Clone `currentSearch` with `URLSearchParams` so unrelated query parameters are preserved.
   - If `value` is `null`, `undefined`, or an empty/whitespace-only string, **delete** `key`; otherwise set `key` to `value`.
   - Return the resulting query string (`params.toString()`, without a leading `?`, or `""` if empty).

2. **`guardAuthRoute(session, targetPath, redirect)`**:
   - Accept `session: { userId: string } | null | undefined`, `targetPath: string`, and `redirect: (url: string) => void`.
   - When `session` is missing or lacks `userId`, call `redirect(\`/login?next=\${encodeURIComponent(targetPath)}\`)`.
   - When authenticated, do **not** call `redirect`, and return `{ allowed: true, userId: session.userId }`.

3. **`<NavBar usePathname={...} onNavigate={...} />`**:
   - Render navigation links (`/` → `"Overview"`, `/docs` → `"Docs"`, `/guides` → `"Guides"`, `/dashboard` → `"Dashboard"`).
   - Call `usePathname()` to determine the current route and set `aria-current="page"` strictly on the active link.

4. **`<DocsNavApp />`** (also exported as `default`):
   - Provide an interactive App Router navigation simulation (`push`, `replace`, `back`), `<NavBar />`, category filter buttons (`All`, `Routing`, `Data`), a sort `<select aria-label="Sort by">` (`recent`, `popular`), a `"Back"` button, and an auth toggle (`"Sign out"` / `"Sign in"`) that protects `/dashboard` using `guardAuthRoute` and redirects unauthenticated visits to `/login?next=%2Fdashboard`.
