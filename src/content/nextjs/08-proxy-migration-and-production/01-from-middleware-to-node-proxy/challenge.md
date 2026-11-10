# Challenge: Network Proxy Boundary & Defense-in-Depth Guard

You are migrating a multi-tenant SaaS application to use the `proxy.ts` convention alongside a strict Data Access Layer (DAL) authorization guard.

## Requirements

1. **`proxy(request)`**:
   Accepts a `request` object with `{ pathname: string, host: string, cookies: Record<string, string>, headers: Record<string, string> }`.
   - **Static Asset Bypass**: If `pathname.startsWith('/_next')` or `pathname === '/favicon.ico'`, return `{ action: 'next', headers: request.headers }` immediately without mutating headers.
   - **Correlation Header**: Create a headers copy that preserves existing `request.headers` and ensures `'x-request-id'` is set to `request.headers['x-request-id'] || 'req-generated'`.
   - **Optimistic Dashboard Protection**: If `pathname.startsWith('/dashboard')` and `!request.cookies.session`, return:
     `{ action: 'redirect', destination: '/login?from=' + encodeURIComponent(pathname), status: 307, headers }`.
   - **Multi-Tenant Subdomain Rewrite**: If `host` matches `<tenant>.app.local` (for example, `acme.app.local`) where `tenant !== 'www'`, return:
     `{ action: 'rewrite', destination: '/tenants/' + tenant + (pathname === '/' ? '' : pathname), headers: { ...headers, 'x-tenant': tenant } }`.
   - **Default Pass-Through**: Otherwise return `{ action: 'next', headers }`.

2. **`authorizeTenantMutation(session, targetTenant)`**:
   Acts as the inner DAL / Server Action defense-in-depth check.
   - If `!session`, throw `new Error('Unauthorized: missing session')`.
   - If `session.tenant !== targetTenant || session.role !== 'admin'`, throw `new Error('Forbidden: role or tenant mismatch')`.
   - Otherwise return `{ allowed: true, actor: session.userId }`.
