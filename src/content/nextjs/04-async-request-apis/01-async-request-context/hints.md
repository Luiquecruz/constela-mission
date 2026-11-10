Remember that `input.params` and `input.searchParams` are already Promises, whereas `input.cookies` and `input.headers` are functions that return Promises when called (`input.cookies()`, `input.headers()`).
---
Use `const [resolvedParams, resolvedSearch, cookieStore, headerStore] = await Promise.all([input.params, input.searchParams, input.cookies(), input.headers()]);` to await all four request sources in parallel.
---
Normalize `page` with `Math.max(1, Number(resolvedSearch.page) || 1)`, read the cookie via `cookieStore.get('theme')?.value || 'light'`, and read the header via `headerStore.get('user-agent') || 'unknown'`.
