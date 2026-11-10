In `buildUpdatedQuery(currentSearch, key, value)`, initialize `const params = new URLSearchParams(currentSearch)` (it automatically ignores any leading `'?'`), call `params.delete(key)` when `value == null || value.trim() === ''`, otherwise call `params.set(key, value)`, and return `params.toString()`.
---
In `guardAuthRoute(session, targetPath, redirect)`, check `if (!session?.userId)` and invoke `redirect(\`/login?next=\${encodeURIComponent(targetPath)}\`)` before returning.
---
In `<NavBar />`, compare each nav item's `href` against `const pathname = usePathname()` and pass `aria-current={pathname === item.href ? 'page' : undefined}` to the rendered `<a>` element (calling `event.preventDefault()` before `onNavigate(item.href)`).
