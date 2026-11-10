export interface ProxyRequest {
  pathname: string;
  host: string;
  cookies: Record<string, string>;
  headers: Record<string, string>;
}

export interface ProxyResult {
  action: 'next' | 'redirect' | 'rewrite';
  destination?: string;
  status?: number;
  headers: Record<string, string>;
}

export interface Session {
  userId: string;
  tenant: string;
  role: 'admin' | 'member';
}

export function proxy(request: ProxyRequest): ProxyResult {
  // TODO:
  // 1. Skip static assets (/ _next* or /favicon.ico)
  // 2. Inject x-request-id header
  // 3. Redirect unauthenticated /dashboard requests to /login?from=...
  // 4. Rewrite <tenant>.app.local (except www) to /tenants/<tenant>...
  return {
    action: 'next',
    headers: request.headers,
  };
}

export function authorizeTenantMutation(
  session: Session | null | undefined,
  targetTenant: string
): { allowed: true; actor: string } {
  // TODO: Enforce defense-in-depth session, tenant, and admin role verification
  return { allowed: true, actor: session?.userId ?? 'anonymous' };
}
