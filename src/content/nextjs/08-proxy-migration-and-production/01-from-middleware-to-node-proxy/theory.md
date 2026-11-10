# From middleware.ts to proxy.ts: Network Boundary and Defense-in-Depth

For a long time, request interception in Next.js lived inside `middleware.ts` and defaulted to a constrained Edge runtime. While lightweight, that execution model created friction whenever teams needed standard Node.js APIs, shared observability libraries, or predictable runtime semantics at the network boundary. Modern Next.js replaces `middleware.ts` with `proxy.ts`, making the application's outer request boundary explicit and running it on the full Node.js runtime by default.

## The `proxy.ts` Convention and Request Interception

Placed at the root of your project (or inside `src/`), `proxy.ts` exports a `proxy` function that runs before cached routes and application code execute. Because it acts as a reverse proxy layer in front of your routes, it is ideal for cross-cutting network concerns:

- Injecting correlation headers such as `x-request-id` for distributed tracing.
- Rewriting multi-tenant hostnames (for example, `acme.example.com/dashboard`) to internal dynamic route trees (`/tenants/acme/dashboard`).
- Performing fast, optimistic redirects when a session cookie is completely absent.

```tsx
// proxy.ts
import { NextResponse, type NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const host = request.headers.get('host') ?? ''
  const requestHeaders = new Headers(request.headers)

  if (!requestHeaders.has('x-request-id')) {
    requestHeaders.set('x-request-id', crypto.randomUUID())
  }

  // Optimistic check for protected routes
  if (pathname.startsWith('/dashboard') && !request.cookies.has('session')) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('from', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Subdomain multi-tenant rewrite
  const tenantMatch = host.match(/^([a-z0-9-]+)\.app\.example\.com$/i)
  if (tenantMatch && tenantMatch[1] !== 'www') {
    const tenant = tenantMatch[1]
    requestHeaders.set('x-tenant', tenant)
    const rewriteUrl = new URL(
      `/tenants/${tenant}${pathname === '/' ? '' : pathname}`,
      request.url
    )
    return NextResponse.rewrite(rewriteUrl, {
      request: { headers: requestHeaders },
    })
  }

  return NextResponse.next({
    request: { headers: requestHeaders },
  })
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
```

Scoping `config.matcher` so static assets (`/_next/static`, `/_next/image`, `/favicon.ico`) bypass the proxy avoids unnecessary overhead on every asset fetch.

## Why `proxy.ts` Is Not a Complete Security Strategy

Treating `proxy.ts` as your sole authentication and authorization layer is one of the most dangerous architectural pitfalls in full-stack React applications.

1. **Optimistic Cookie Checks Are Not Full Verification**: At the network boundary, you want low latency. Checking whether a cookie exists or decoding lightweight claims avoids database round-trips on every public navigation, but it does not prove that a user's role is still active or that their tenant membership has not been revoked.
2. **Matcher Misconfigurations and Direct Invocations**: A subtle typo in `config.matcher`, a newly added route prefix, or an internal rewrite can accidentally leave a Server Component or Server Action exposed if no downstream check exists.
3. **Tenant Spoofing Risks**: In multi-tenant platforms, knowing a valid session cookie is not enough; you must verify that the authenticated actor actually belongs to the target tenant and holds the required role before reading or mutating tenant data.

## Defense-in-Depth at the Data Access Layer and Server Actions

Modern Next.js security follows a defense-in-depth model:

- **Outer Layer (`proxy.ts`)**: Handles routing ergonomics—redirecting unauthenticated visitors away from `/dashboard` early and rewriting tenant subdomains cleanly.
- **Inner Layer (Data Access Layer & Server Actions)**: Performs authoritative session and role verification right next to the data read or mutation.

```tsx
// lib/dal.ts
import 'server-only'

export interface Session {
  userId: string
  tenant: string
  role: 'admin' | 'member'
}

export function authorizeTenantMutation(
  session: Session | null,
  targetTenant: string
) {
  if (!session) {
    throw new Error('Unauthorized: missing session')
  }
  if (session.tenant !== targetTenant || session.role !== 'admin') {
    throw new Error('Forbidden: role or tenant mismatch')
  }
  return { allowed: true, actor: session.userId }
}
```

By enforcing `authorizeTenantMutation` inside every Server Action and DAL helper, even if `proxy.ts` is bypassed or misconfigured, unauthorized callers can never read or mutate protected tenant state.

## When to choose it

- **Use `proxy.ts`** for request-level routing concerns: locale negotiation, subdomain-to-path rewrites, correlation header propagation, A/B test bucket rewrites, and fast optimistic login redirects.
- **Use the Data Access Layer (DAL) and Server Action guards** for authoritative authentication, role-based access control (RBAC), and tenant isolation checks that protect database queries and mutations.
- **Avoid** placing heavy database queries or sole authorization checks exclusively in `proxy.ts`.
