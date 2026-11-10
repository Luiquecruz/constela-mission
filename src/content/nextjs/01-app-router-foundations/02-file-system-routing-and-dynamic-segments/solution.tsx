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

function extractPublicSegments(pattern: string): string[] | null {
  const rawSegments = pattern.split('/').filter(Boolean);

  if (rawSegments[0] === 'app') {
    rawSegments.shift();
  }
  const last = rawSegments.at(-1);
  if (last && /^page\.(tsx|ts|jsx|js)$/.test(last)) {
    rawSegments.pop();
  }

  // Private folders starting with "_" opt the folder and its descendants out of routing
  if (rawSegments.some((segment) => segment.startsWith('_'))) {
    return null;
  }

  // Route groups "(name)" organize files without appearing in the public URL
  return rawSegments.filter((segment) => !/^\([^)]+\)$/.test(segment));
}

function compareRanks(a: number[], b: number[]): number {
  const maxLength = Math.max(a.length, b.length);
  for (let i = 0; i < maxLength; i++) {
    const rankA = a[i] ?? 0;
    const rankB = b[i] ?? 0;
    if (rankA !== rankB) {
      return rankB - rankA;
    }
  }
  return 0;
}

interface CandidateMatch {
  componentName: string;
  params: RouteParams;
  ranks: number[];
}

function evaluatePattern(
  route: RouteDescriptor,
  pathSegments: string[]
): CandidateMatch | null {
  const patternSegments = extractPublicSegments(route.pattern);
  if (!patternSegments) {
    return null;
  }

  const params: RouteParams = {};
  const ranks: number[] = [];
  let pathIndex = 0;

  for (let i = 0; i < patternSegments.length; i++) {
    const seg = patternSegments[i];
    const isLastPattern = i === patternSegments.length - 1;

    const optionalCatchAll = /^\[\[\.\.\.([^\]]+)\]\]$/.exec(seg);
    if (optionalCatchAll) {
      if (!isLastPattern) {
        return null;
      }
      const remaining = pathSegments.slice(pathIndex);
      if (remaining.length > 0) {
        params[optionalCatchAll[1]] = remaining;
      }
      ranks.push(1);
      pathIndex = pathSegments.length;
      continue;
    }

    const catchAll = /^\[\.\.\.([^\]]+)\]$/.exec(seg);
    if (catchAll) {
      if (!isLastPattern) {
        return null;
      }
      const remaining = pathSegments.slice(pathIndex);
      if (remaining.length === 0) {
        return null;
      }
      params[catchAll[1]] = remaining;
      ranks.push(2);
      pathIndex = pathSegments.length;
      continue;
    }

    if (pathIndex >= pathSegments.length) {
      return null;
    }

    const dynamic = /^\[([^\]]+)\]$/.exec(seg);
    if (dynamic) {
      params[dynamic[1]] = pathSegments[pathIndex];
      ranks.push(3);
      pathIndex++;
      continue;
    }

    if (seg !== pathSegments[pathIndex]) {
      return null;
    }
    ranks.push(4);
    pathIndex++;
  }

  if (pathIndex !== pathSegments.length) {
    return null;
  }

  return {
    componentName: route.componentName,
    params,
    ranks,
  };
}

export function matchRoute(
  routeTree: RouteDescriptor[],
  pathname: string
): RouteMatchResult {
  const cleanPathname = pathname.split(/[?#]/)[0];
  const pathSegments = cleanPathname.split('/').filter(Boolean);

  const candidates = routeTree
    .map((route) => evaluatePattern(route, pathSegments))
    .filter((candidate): candidate is CandidateMatch => candidate !== null)
    .sort((a, b) => compareRanks(a.ranks, b.ranks));

  const winner = candidates[0];
  if (!winner) {
    return { matched: false, componentName: null, params: {} };
  }

  return {
    matched: true,
    componentName: winner.componentName,
    params: winner.params,
  };
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
