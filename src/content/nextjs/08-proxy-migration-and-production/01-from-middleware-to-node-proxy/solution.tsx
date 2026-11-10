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
  const { pathname, host, cookies } = request;

  if (pathname.startsWith('/_next') || pathname === '/favicon.ico') {
    return {
      action: 'next',
      headers: request.headers,
    };
  }

  const headers: Record<string, string> = {
    ...request.headers,
    'x-request-id': request.headers['x-request-id'] || 'req-generated',
  };

  if (pathname.startsWith('/dashboard') && !cookies.session) {
    return {
      action: 'redirect',
      destination: '/login?from=' + encodeURIComponent(pathname),
      status: 307,
      headers,
    };
  }

  const tenantMatch = host.match(/^([^.]+)\.app\.local$/i);
  if (tenantMatch && tenantMatch[1] !== 'www') {
    const tenant = tenantMatch[1];
    return {
      action: 'rewrite',
      destination: '/tenants/' + tenant + (pathname === '/' ? '' : pathname),
      headers: {
        ...headers,
        'x-tenant': tenant,
      },
    };
  }

  return {
    action: 'next',
    headers,
  };
}

export function authorizeTenantMutation(
  session: Session | null | undefined,
  targetTenant: string
): { allowed: true; actor: string } {
  if (!session) {
    throw new Error('Unauthorized: missing session');
  }

  if (session.tenant !== targetTenant || session.role !== 'admin') {
    throw new Error('Forbidden: role or tenant mismatch');
  }

  return {
    allowed: true,
    actor: session.userId,
  };
}
