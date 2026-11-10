Write a small helper `compareSemver(actual: string, minimum: string): number` that splits both strings on `'.'`, converts each segment to a `Number`, and compares major, minor, and patch in order.
---
When `hasMiddlewareFile` is true, push both the human-readable blocker `'Rename middleware.ts to proxy.ts'` to `blockers` and `'middleware-to-proxy'` to `codemods`. Do the same for `syncRequestApiUsages > 0` with `'next-async-request-api'`.
---
Don't forget the multi-instance self-hosting check: a single replica (`replicas === 1`) does not require a shared cache handler, so only add `'Configure a shared cacheHandler for multi-instance self-hosting'` when `project.replicas > 1 && !project.hasSharedCacheHandler`.
