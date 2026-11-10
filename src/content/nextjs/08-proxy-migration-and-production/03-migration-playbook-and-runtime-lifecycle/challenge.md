# Challenge: Next.js 16 Migration Readiness Auditor

Build `auditMigrationProject(project)` to inspect a legacy repository's metadata and produce a deterministic list of migration `blockers` and recommended `@next/codemod` transformations.

## Input Shape

`project` has the following properties:
- `nodeVersion: string` (semver string such as `'20.9.0'` or `'18.19.0'`)
- `tsVersion: string` (semver string such as `'5.1.0'` or `'4.9.5'`)
- `hasMiddlewareFile: boolean`
- `cacheComponentsEnabled: boolean`
- `singleArgRevalidateTags: number`
- `syncRequestApiUsages: number`
- `replicas: number`
- `hasSharedCacheHandler: boolean`

## Rules

Evaluate the checks below in order and collect `blockers: string[]` and `codemods: string[]`:

1. **Node.js Baseline**: If `nodeVersion` is lower than `'20.9.0'`, push blocker `'Upgrade Node.js runtime to 20.9.0 or newer'`.
2. **TypeScript Baseline**: If `tsVersion` is lower than `'5.1.0'`, push blocker `'Upgrade TypeScript to 5.1.0 or newer'`.
3. **Proxy Convention**: If `hasMiddlewareFile` is `true`, push blocker `'Rename middleware.ts to proxy.ts'` and push codemod `'middleware-to-proxy'`.
4. **Async Request APIs**: If `syncRequestApiUsages > 0`, push blocker `'Await async request APIs (params, searchParams, cookies, headers)'` and push codemod `'next-async-request-api'`.
5. **Cache Components**: If `!cacheComponentsEnabled`, push blocker `'Enable cacheComponents: true in next.config.ts'`.
6. **Tag Invalidation Signature**: If `singleArgRevalidateTags > 0`, push blocker `'Pass a cacheLife profile to revalidateTag(tag, profile) or use updateTag(tag) in Server Actions'`.
7. **Multi-Replica Self-Hosting**: If `replicas > 1 && !hasSharedCacheHandler`, push blocker `'Configure a shared cacheHandler for multi-instance self-hosting'`.

Return `{ ready: blockers.length === 0, blockers, codemods }`.
