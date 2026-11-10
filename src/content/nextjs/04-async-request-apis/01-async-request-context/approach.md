1. **Await all async request sources in parallel**: Inside `resolveTenantContext(input)`, call `Promise.all([input.params, input.searchParams, input.cookies(), input.headers()])`.
2. **Extract and fallback route and query parameters**: Pull `tenant` from the resolved `params`. Default `view` to `'overview'` when `resolvedSearch.view` is missing or empty, and compute `page` using `Math.max(1, Math.floor(Number(resolvedSearch.page)) || 1)`.
3. **Read cookie and header stores**: Call `cookieStore.get('theme')?.value || 'light'` and `headerStore.get('user-agent') || 'unknown'`.
4. **Render the resolved context**: Pass the resolved `TenantContext` object into `<TenantDashboardView context={context} />` to display the tenant, active view, current page, theme badge, and user agent.
