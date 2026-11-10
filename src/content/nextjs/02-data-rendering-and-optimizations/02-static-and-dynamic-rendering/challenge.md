# Challenge: Static Params and Route Execution Classifier

You are building a route execution simulator for a Next.js blog route (`app/blog/[slug]/page.tsx`) to classify whether a request resolves as build-time **Static**, request-time **Dynamic**, or **Not Found**.

## Requirements

1. **`generatePostStaticParams(posts)`**:
   - Accept an array of post objects containing `{ slug: string, ... }`.
   - Return an array of parameter objects `Array<{ slug: string }>` suitable for Next.js `generateStaticParams()`.

2. **`classifyRouteExecution({ pathname, staticParams, dynamicParams, usesDynamicApi })`**:
   - Extract the dynamic `slug` from `pathname` (the final non-empty path segment, e.g. `/blog/rsc-basics` -> `'rsc-basics'`).
   - Check whether `staticParams` contains an entry matching `slug`.
   - Return `{ mode: 'static' | 'dynamic' | 'not-found', reason: string }` using these exact rules:
     1. If `slug` is **not** in `staticParams` and `dynamicParams === false`, return `mode: 'not-found'` with an explanatory `reason`.
     2. Otherwise, if `usesDynamicApi` is `true`, return `mode: 'dynamic'` with a `reason` mentioning dynamic request APIs.
     3. Otherwise, if `slug` is **not** in `staticParams` (meaning `dynamicParams !== false`), return `mode: 'dynamic'` explaining on-demand rendering.
     4. Otherwise (`slug` is in `staticParams` and `usesDynamicApi` is `false`), return `mode: 'static'` explaining build-time prerendering.

3. **`<RenderModeExplorerApp />`**:
   - Render an interactive simulator allowing users to:
     - Select a route slug (pre-generated slugs such as `rsc-data-fetching` and `static-params`, plus an un-prerendered slug `unlisted-draft`).
     - Toggle `dynamicParams` (`true` vs `false`).
     - Toggle whether the route reads a Dynamic Request API (`usesDynamicApi` checkbox/button).
   - Compute the live classification via `classifyRouteExecution(...)` and display:
     - A clear status badge (`data-testid="execution-mode"`) showing `'static'`, `'dynamic'`, or `'not-found'`.
     - The human-readable `reason` explanation.
