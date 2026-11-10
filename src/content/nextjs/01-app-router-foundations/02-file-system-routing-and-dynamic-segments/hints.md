Start by writing a helper that splits `pattern` by `'/'`, drops empty parts, removes a leading `'app'` and trailing `'page.tsx'` (if present), returns `null` if any segment starts with `'_'`, and filters out `(group)` segments matching `/^\([^)]+\)$/`.
---
Match `pathSegments` (from `pathname.split(/[?#]/)[0].split('/').filter(Boolean)`) against the cleaned pattern segments while accumulating both `params` and a numeric specificity array (`4` for static, `3` for `[param]`, `2` for `[...rest]`, `1` for `[[...rest]]`).
---
Check that `[...rest]` receives at least 1 remaining segment (`pathSegments.slice(i).length > 0`), whereas `[[...rest]]` succeeds even when `remaining.length === 0` (omitting the param key when empty). Compare specificity rank arrays lexicographically so static routes always beat dynamic and catch-all routes.
