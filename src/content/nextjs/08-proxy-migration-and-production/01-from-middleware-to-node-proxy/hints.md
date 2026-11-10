Check for static assets (`pathname.startsWith('/_next')` or `pathname === '/favicon.ico'`) before generating `'x-request-id'` so static asset requests return `{ action: 'next', headers: request.headers }` untouched.
---
After creating `const headers = { ...request.headers, 'x-request-id': request.headers['x-request-id'] || 'req-generated' }`, check `pathname.startsWith('/dashboard') && !request.cookies.session` before checking the subdomain rewrite. For the subdomain check, `host.endsWith('.app.local')` lets you extract the tenant prefix with `host.slice(0, -'.app.local'.length)`.
---
In `authorizeTenantMutation(session, targetTenant)`, check `!session` first and throw `new Error('Unauthorized: missing session')`. Then check `session.tenant !== targetTenant || session.role !== 'admin'` and throw `new Error('Forbidden: role or tenant mismatch')`. Finally return `{ allowed: true, actor: session.userId }`.
