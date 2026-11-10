import React, { useState } from 'react';

export interface RouteDescriptor {
  pattern: string;
  componentName: string;
}

export type RouteParams = Record<string, string | string[]>;

export interface RouteMatchResult {
  matched: boolean;
  componentName: string | null;
  params: RouteParams;
}

export const DEFAULT_ROUTE_TREE: RouteDescriptor[] = [
  { pattern: 'app/page.tsx', componentName: 'HomePage' },
  { pattern: 'app/(marketing)/pricing/page.tsx', componentName: 'PricingPage' },
  { pattern: 'app/_internal/debug/page.tsx', componentName: 'InternalDebugPage' },
  { pattern: 'app/blog/featured/page.tsx', componentName: 'FeaturedBlogPage' },
  { pattern: 'app/blog/[slug]/page.tsx', componentName: 'BlogPostPage' },
  { pattern: 'app/docs/[...slug]/page.tsx', componentName: 'DocsCatchAllPage' },
  { pattern: 'app/shop/[[...categories]]/page.tsx', componentName: 'ShopCatalogPage' },
];

const PRESET_PATHS = [
  '/',
  '/pricing',
  '/blog/featured',
  '/blog/app-router-guide',
  '/docs/routing/dynamic-segments',
  '/docs',
  '/shop',
  '/shop/audio/monitors',
  '/_internal/debug',
];

// TODO: Implement App Router pattern matching with:
// 1. Ignoring _private folders
// 2. Stripping (route-groups), optional leading `app/`, and trailing `/page.tsx`
// 3. Matching static, [param], [...rest], and [[...rest]] segments
// 4. Selecting the most specific route (static > [param] > [...rest] > [[...rest]])
export function matchRoute(
  routeTree: RouteDescriptor[],
  pathname: string
): RouteMatchResult {
  const normalizedPath = pathname.split(/[?#]/)[0];
  const exact = routeTree.find((route) => route.pattern === normalizedPath);
  if (exact) {
    return { matched: true, componentName: exact.componentName, params: {} };
  }
  return { matched: false, componentName: null, params: {} };
}

export function RouteExplorerApp({
  routeTree = DEFAULT_ROUTE_TREE,
}: {
  routeTree?: RouteDescriptor[];
}) {
  const [pathname, setPathname] = useState('/blog/app-router-guide');
  const result = matchRoute(routeTree, pathname);

  return (
    <section style={{ fontFamily: 'sans-serif', maxWidth: 720, margin: '0 auto', padding: 16 }}>
      <h2 style={{ marginTop: 0 }}>App Router Path Matcher</h2>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
        <label htmlFor="route-pathname-input">URL:</label>
        <input
          id="route-pathname-input"
          aria-label="Test URL pathname"
          type="text"
          value={pathname}
          onChange={(event) => setPathname(event.target.value)}
          style={{ flex: 1, padding: '6px 10px', borderRadius: 6, border: '1px solid #cbd5e1' }}
        />
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
        {PRESET_PATHS.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => setPathname(preset)}
            style={{
              padding: '4px 10px',
              borderRadius: 6,
              border: '1px solid #cbd5e1',
              background: pathname === preset ? '#0f172a' : '#f8fafc',
              color: pathname === preset ? '#ffffff' : '#0f172a',
              cursor: 'pointer',
            }}
          >
            {preset}
          </button>
        ))}
      </div>

      <div
        data-testid="match-result"
        style={{
          padding: 14,
          borderRadius: 8,
          border: '1px solid #cbd5e1',
          background: result.matched ? '#f0fdf4' : '#fef2f2',
          marginBottom: 16,
        }}
      >
        <p style={{ margin: '0 0 6px 0' }}>
          <strong>Status:</strong>{' '}
          {result.matched ? `Matched: ${result.componentName}` : 'No route matched (404)'}
        </p>
        <p style={{ margin: 0 }}>
          <strong>Params:</strong>{' '}
          <code data-testid="matched-params">{JSON.stringify(result.params)}</code>
        </p>
      </div>

      <h3 style={{ marginBottom: 8 }}>Registered app/ Tree</h3>
      <ul style={{ margin: 0, paddingLeft: 18 }}>
        {routeTree.map((route) => (
          <li key={route.pattern} style={{ marginBottom: 4 }}>
            <code>{route.pattern}</code> → <strong>{route.componentName}</strong>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default RouteExplorerApp;
