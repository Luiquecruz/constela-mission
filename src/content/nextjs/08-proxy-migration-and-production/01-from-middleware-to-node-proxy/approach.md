# Step-by-Step Approach

1. **Bypass Static Assets Early**:
   Inside `proxy(request)`, check `if (request.pathname.startsWith('/_next') || request.pathname === '/favicon.ico')`. When true, immediately return `{ action: 'next', headers: request.headers }`.

2. **Propagate the Correlation Header**:
   Build a new `headers` object:
   ```ts
   const headers: Record<string, string> = {
     ...request.headers,
     'x-request-id': request.headers['x-request-id'] || 'req-generated',
   };
   ```

3. **Guard `/dashboard` Optimistically**:
   If `request.pathname.startsWith('/dashboard') && !request.cookies.session`, return a `307` redirect to `'/login?from=' + encodeURIComponent(request.pathname)` along with `headers`.

4. **Rewrite Tenant Subdomains**:
   Match `request.host` against `/^([a-z0-9-]+)\.app\.local$/i`. If it matches and the captured `tenant` is not `'www'`, compute `const suffix = request.pathname === '/' ? '' : request.pathname` and return `{ action: 'rewrite', destination: '/tenants/' + tenant + suffix, headers: { ...headers, 'x-tenant': tenant } }`.

5. **Enforce Defense-in-Depth in `authorizeTenantMutation`**:
   Validate `!session` first, then verify `session.tenant === targetTenant && session.role === 'admin'`, throwing the exact error messages required when either check fails.
