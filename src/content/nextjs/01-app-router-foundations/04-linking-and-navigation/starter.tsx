import React, { useState } from 'react';

export interface Session {
  userId: string;
}

export interface NavItem {
  href: string;
  label: string;
}

export const NAV_ITEMS: NavItem[] = [
  { href: '/', label: 'Overview' },
  { href: '/docs', label: 'Docs' },
  { href: '/guides', label: 'Guides' },
  { href: '/dashboard', label: 'Dashboard' },
];

const DOC_ARTICLES = [
  { id: '1', title: 'App Router File Conventions', category: 'routing', popularity: 98, recency: 3 },
  { id: '2', title: 'Dynamic & Catch-All Segments', category: 'routing', popularity: 85, recency: 2 },
  { id: '3', title: 'Server Data Fetching Patterns', category: 'data', popularity: 95, recency: 4 },
  { id: '4', title: 'URL Search Params Synchronization', category: 'data', popularity: 79, recency: 1 },
];

// TODO 1: Update or delete `key` while preserving all unrelated search params
export function buildUpdatedQuery(
  currentSearch: string,
  key: string,
  value: string | null | undefined
): string {
  // BUG: Overwrites all existing query parameters instead of cloning currentSearch
  if (value == null || value.trim() === '') {
    return '';
  }
  return new URLSearchParams({ [key]: value }).toString();
}

// TODO 2: Redirect unauthenticated users to /login?next=<encoded targetPath>
export function guardAuthRoute(
  session: Session | null | undefined,
  targetPath: string,
  redirect: (url: string) => void
): { allowed: true; userId: string } | void {
  // BUG: Allows access without calling redirect() when session is missing
  if (session?.userId) {
    return { allowed: true, userId: session.userId };
  }
}

export function NavBar({
  usePathname = () => '/',
  onNavigate,
}: {
  usePathname?: () => string;
  onNavigate?: (href: string) => void;
}) {
  const pathname = usePathname();

  return (
    <nav aria-label="Main navigation" style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
      {NAV_ITEMS.map((item) => {
        const isActive = pathname === item.href;
        return (
          <a
            key={item.href}
            href={item.href}
            // TODO 3: Set aria-current="page" when isActive is true
            onClick={(event) => {
              event.preventDefault();
              onNavigate?.(item.href);
            }}
            style={{
              padding: '6px 10px',
              borderRadius: 6,
              textDecoration: 'none',
              background: isActive ? '#0f172a' : '#f1f5f9',
              color: isActive ? '#ffffff' : '#0f172a',
              fontWeight: isActive ? 600 : 400,
            }}
          >
            {item.label}
          </a>
        );
      })}
    </nav>
  );
}

interface HistoryEntry {
  pathname: string;
  search: string;
}

function parseLocation(href: string): HistoryEntry {
  const [rawPath, rawSearch = ''] = href.split('?');
  return { pathname: rawPath || '/', search: rawSearch };
}

export function DocsNavApp({
  initialPath = '/docs',
  initialSearch = 'sort=recent',
  initialAuthenticated = true,
}: {
  initialPath?: string;
  initialSearch?: string;
  initialAuthenticated?: boolean;
}) {
  const [history, setHistory] = useState<HistoryEntry[]>([
    { pathname: initialPath, search: initialSearch.replace(/^\?/, '') },
  ]);
  const [authenticated, setAuthenticated] = useState(initialAuthenticated);
  const current = history[history.length - 1];

  const usePathname = () => current.pathname;
  const useSearchParams = () => new URLSearchParams(current.search);

  const push = (href: string) => {
    const next = parseLocation(href);
    if (next.pathname === '/dashboard') {
      let redirectedTo: string | null = null;
      guardAuthRoute(authenticated ? { userId: 'user-1' } : null, next.pathname, (url) => {
        redirectedTo = url;
      });
      if (redirectedTo) {
        setHistory((prev) => [...prev, parseLocation(redirectedTo!)]);
        return;
      }
    }
    setHistory((prev) => [...prev, next]);
  };

  const replace = (href: string) => {
    const next = parseLocation(href);
    setHistory((prev) => [...prev.slice(0, -1), next]);
  };

  const back = () => {
    setHistory((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev));
  };

  const searchParams = useSearchParams();
  const activeCategory = searchParams.get('category') ?? 'all';
  const activeSort = searchParams.get('sort') ?? 'recent';

  const updateFilter = (key: string, value: string | null) => {
    const nextQuery = buildUpdatedQuery(searchParams.toString(), key, value);
    replace(`${current.pathname}${nextQuery ? `?${nextQuery}` : ''}`);
  };

  const visibleArticles = DOC_ARTICLES.filter(
    (item) => activeCategory === 'all' || item.category === activeCategory
  ).sort((a, b) => (activeSort === 'popular' ? b.popularity - a.popularity : b.recency - a.recency));

  const displayUrl = `${current.pathname}${current.search ? `?${current.search}` : ''}`;

  return (
    <section style={{ fontFamily: 'sans-serif', maxWidth: 720, margin: '0 auto', padding: 16 }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h2 style={{ margin: 0 }}>Docs Router Simulation</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" onClick={back} disabled={history.length <= 1}>
            Back
          </button>
          <button type="button" onClick={() => setAuthenticated((prev) => !prev)}>
            {authenticated ? 'Sign out' : 'Sign in'}
          </button>
        </div>
      </header>

      <NavBar usePathname={usePathname} onNavigate={push} />

      <div
        data-testid="current-url"
        style={{ padding: '6px 10px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 6, marginBottom: 12 }}
      >
        <strong>URL:</strong> <code>{displayUrl}</code>
      </div>

      {current.pathname === '/login' ? (
        <div style={{ padding: 14, border: '1px solid #f59e0b', background: '#fffbeb', borderRadius: 8 }}>
          <strong>Login Required:</strong> Redirected with <code>next={searchParams.get('next')}</code>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 12 }}>
            <span>Category:</span>
            {(['all', 'routing', 'data'] as const).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => updateFilter('category', cat === 'all' ? null : cat)}
                style={{
                  padding: '4px 10px',
                  borderRadius: 6,
                  border: '1px solid #cbd5e1',
                  background: activeCategory === cat ? '#0284c7' : '#ffffff',
                  color: activeCategory === cat ? '#ffffff' : '#0f172a',
                }}
              >
                {cat[0].toUpperCase() + cat.slice(1)}
              </button>
            ))}

            <label htmlFor="sort-select" style={{ marginLeft: 8 }}>
              Sort:
            </label>
            <select
              id="sort-select"
              aria-label="Sort by"
              value={activeSort}
              onChange={(event) => updateFilter('sort', event.target.value)}
            >
              <option value="recent">Recent</option>
              <option value="popular">Popular</option>
            </select>
          </div>

          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {visibleArticles.map((article) => (
              <li key={article.id} style={{ marginBottom: 4 }}>
                {article.title} <small>({article.category})</small>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

export default DocsNavApp;
