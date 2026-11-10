# Challenge: Build an App Router Path Matcher & Route Explorer

Next.js maps `app/` file patterns to URLs by ignoring `_private` folders, stripping `(route-groups)`, matching static, `[param]`, `[...rest]`, and `[[...rest]]` segments, and ranking matches by specificity.

## Requirements

1. **`matchRoute(routeTree, pathname)`**:
   - Accept `routeTree: RouteDescriptor[]` (where each item has `{ pattern: string; componentName: string }`) and `pathname: string`.
   - Patterns may be written either as App Router file paths (e.g., `"app/(marketing)/pricing/page.tsx"`, `"app/blog/[slug]/page.tsx"`) or route patterns (e.g., `"/(marketing)/pricing"`, `"/blog/[slug]"`). Strip optional leading `app/` and trailing `/page.tsx` (or `/page.jsx` / `/page.ts` / `/page.js`).
   - **Private folders**: If any segment in the pattern starts with `_` (such as `_internal` or `_components`), ignore that route completely.
   - **Route groups**: Strip segments wrapped in parentheses like `(marketing)` or `(shop)` when matching URLs.
   - **Segment matching & `params` extraction**:
     - Static segment (`pricing`): matches exact segment string.
     - Dynamic segment (`[slug]`): matches exactly one segment and sets `params.slug = segment`.
     - Catch-all (`[...slug]`): matches **one or more** trailing segments and sets `params.slug = [...segments]`.
     - Optional catch-all (`[[...slug]]`): matches **zero or more** trailing segments; sets `params.slug = [...segments]` when one or more segments are present, or omits `slug` (`{}`) when zero segments remain.
   - **Precedence**: When multiple routes match `pathname`, choose the most specific match segment-by-segment: static > `[param]` > `[...rest]` > `[[...rest]]`.
   - Return `{ matched: true, componentName, params }` on a match, or `{ matched: false, componentName: null, params: {} }` when no route matches.

2. **`<RouteExplorerApp />`** (also exported as `default`):
   - Render the interactive route explorer with an input labeled `"Test URL pathname"` (`aria-label="Test URL pathname"`), quick preset buttons for sample URLs, the route tree list, and the live match output showing the matched component name (or `"No route matched (404)"`) and extracted `params` JSON.
