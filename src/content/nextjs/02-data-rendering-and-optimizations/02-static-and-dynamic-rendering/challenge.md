<!-- coderabbit-ai-generated:v1 -->

<!-- coderabbit-ai-generated-section:v1:5f55745a643221e7445016d13481383ea96e5ded87105a5357523bcd8c076a8b -->

<!-- coderabbit-ai-generated-section:v1:4dc05827c4bfd4eee9fc63a4a9fb9c8b05259a82ac2ded9aa33ddfca68ee240b -->

# Challenge: Static Params and Route Execution Classifier

You are building a route execution simulator for a Next.js blog route (`app/blog/[slug]/page.tsx`) to classify whether a request resolves as build-time or on-demand **Static**, per-request **Dynamic**, or **Not Found**.

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
     3. Otherwise, if `slug` is **not** in `staticParams` (meaning `dynamicParams !== false`), return `mode: 'static'` explaining on-demand static generation on the first request and caching for subsequent requests. An unlisted slug alone does not imply per-request dynamic rendering.
     4. Otherwise (`slug` is in `staticParams` and `usesDynamicApi` is `false`), return `mode: 'static'` explaining build-time prerendering.

3. **`<RenderModeExplorerApp />`**:
   - Render an interactive simulator allowing users to:
     - Select a route slug (pre-generated slugs such as `rsc-data-fetching` and `static-params`, plus an un-prerendered slug `unlisted-draft`).
     - Toggle `dynamicParams` (`true` vs `false`).
     - Toggle whether the route reads a Dynamic Request API (`usesDynamicApi` checkbox/button).
   - Compute the live classification via `classifyRouteExecution(...)` and display:
     - A clear status badge (`data-testid="execution-mode"`) showing `'static'`, `'dynamic'`, or `'not-found'`.
     - The human-readable `reason` explanation.


<!-- /coderabbit-ai-generated:v1 -->