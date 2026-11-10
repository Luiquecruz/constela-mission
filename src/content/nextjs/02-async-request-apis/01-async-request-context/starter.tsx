import React, { useState, useEffect } from 'react';

export interface AsyncRequestInput {
  params: Promise<{ tenant: string }>;
  searchParams: Promise<{ view?: string; page?: string }>;
  cookies: () => Promise<{ get(name: string): { value: string } | undefined }>;
  headers: () => Promise<{ get(name: string): string | null }>;
}

export interface TenantContext {
  tenant: string;
  view: string;
  page: number;
  theme: string;
  userAgent: string;
}

export async function resolveTenantContext(
  input: AsyncRequestInput
): Promise<TenantContext> {
  // TODO: Await params, searchParams, cookies(), and headers() concurrently
  // and return normalized { tenant, view, page, theme, userAgent } with defaults.
  return {
    tenant: '',
    view: '',
    page: 0,
    theme: '',
    userAgent: '',
  };
}

export function TenantDashboardView({ context }: { context: TenantContext }) {
  const isDark = context.theme === 'dark';

  return (
    <section
      data-testid="tenant-dashboard"
      data-theme={context.theme}
      style={{
        fontFamily: 'system-ui, sans-serif',
        padding: '16px',
        borderRadius: '10px',
        background: isDark ? '#0f172a' : '#f8fafc',
        color: isDark ? '#f8fafc' : '#0f172a',
        border: '1px solid #cbd5e1',
      }}
    >
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>Tenant: {context.tenant}</h2>
        <span data-testid="theme-badge">Theme: {context.theme}</span>
      </header>
      <div style={{ marginTop: '12px', display: 'grid', gap: '6px' }}>
        <p style={{ margin: 0 }} data-testid="active-view">
          View: {context.view}
        </p>
        <p style={{ margin: 0 }} data-testid="current-page">
          Page: {context.page}
        </p>
        <p style={{ margin: 0, fontSize: '13px', opacity: 0.8 }} data-testid="user-agent">
          User-Agent: {context.userAgent}
        </p>
      </div>
    </section>
  );
}

export default function App() {
  const [tenant, setTenant] = useState('acme-corp');
  const [view, setView] = useState('analytics');
  const [page, setPage] = useState('2');
  const [theme, setTheme] = useState('dark');
  const [context, setContext] = useState<TenantContext | null>(null);

  useEffect(() => {
    let active = true;
    resolveTenantContext({
      params: Promise.resolve({ tenant }),
      searchParams: Promise.resolve({ view: view || undefined, page: page || undefined }),
      cookies: async () => ({
        get: (name: string) => (name === 'theme' && theme ? { value: theme } : undefined),
      }),
      headers: async () => ({
        get: (name: string) => (name === 'user-agent' ? 'NextJS-Simulator/16.0' : null),
      }),
    }).then((res) => {
      if (active) setContext(res);
    });
    return () => {
      active = false;
    };
  }, [tenant, view, page, theme]);

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', padding: '16px', display: 'grid', gap: '16px' }}>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <label>
          Tenant:{' '}
          <select value={tenant} onChange={(e) => setTenant(e.target.value)}>
            <option value="acme-corp">acme-corp</option>
            <option value="globex">globex</option>
          </select>
        </label>
        <label>
          View:{' '}
          <select value={view} onChange={(e) => setView(e.target.value)}>
            <option value="analytics">analytics</option>
            <option value="billing">billing</option>
            <option value="">(empty - default)</option>
          </select>
        </label>
        <label>
          Page:{' '}
          <input
            type="text"
            value={page}
            onChange={(e) => setPage(e.target.value)}
            style={{ width: '50px' }}
          />
        </label>
        <label>
          Cookie Theme:{' '}
          <select value={theme} onChange={(e) => setTheme(e.target.value)}>
            <option value="dark">dark</option>
            <option value="light">light</option>
            <option value="">(missing)</option>
          </select>
        </label>
      </div>
      {context && <TenantDashboardView context={context} />}
    </div>
  );
}
