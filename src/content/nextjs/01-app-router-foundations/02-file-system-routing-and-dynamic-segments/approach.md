1. **Normalize patterns & pathnames**: Strip query strings/hashes from `pathname` and split into segments. For each route `pattern`, strip optional `app/` prefix and `/page.*` suffix, reject any route containing a `_` segment, and drop `(group)` segments.
2. **Evaluate segment kinds**: Walk pattern segments alongside pathname segments:
   - `[[...name]]` at the end consumes `pathSegments.slice(i)` (0 or more); only add `params[name]` when non-empty. Rank: `1`.
   - `[...name]` at the end requires at least 1 segment (`pathSegments.slice(i)`). Rank: `2`.
   - `[name]` requires 1 segment and sets `params[name] = segment`. Rank: `3`.
   - Static literal requires `segment === patternSegment`. Rank: `4`.
3. **Select best match**: Sort matching candidates by comparing rank arrays lexicographically descending, then return `{ matched: true, componentName, params }` for the highest-ranked match or `{ matched: false, componentName: null, params: {} }`.
4. **Interactive Explorer**: Wire `<RouteExplorerApp />` to call `matchRoute(DEFAULT_ROUTE_TREE, pathname)` on every input change or preset button click and display the matched component and `JSON.stringify(result.params)`.
