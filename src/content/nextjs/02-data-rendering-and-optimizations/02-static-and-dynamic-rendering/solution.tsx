import React, { useState } from 'react';

export interface PostSummary {
  slug: string;
  title: string;
}

export interface StaticParam {
  slug: string;
}

export interface ClassifyRouteInput {
  pathname: string;
  staticParams: StaticParam[];
  dynamicParams: boolean;
  usesDynamicApi: boolean;
}

export interface RouteExecutionClassification {
  mode: 'static' | 'dynamic' | 'not-found';
  reason: string;
}

export const SAMPLE_POSTS: PostSummary[] = [
  { slug: 'rsc-data-fetching', title: 'Fetching Data in Server Components' },
  { slug: 'static-params', title: 'Pre-rendering with generateStaticParams' },
];

export function generatePostStaticParams(posts: PostSummary[]): StaticParam[] {
  return posts.map((post) => ({ slug: post.slug }));
}

export function classifyRouteExecution({
  pathname,
  staticParams,
  dynamicParams,
  usesDynamicApi,
}: ClassifyRouteInput): RouteExecutionClassification {
  const slug = pathname.split('/').filter(Boolean).at(-1) ?? '';
  const isPreGenerated = staticParams.some((param) => param.slug === slug);

  if (!isPreGenerated && dynamicParams === false) {
    return {
      mode: 'not-found',
      reason: `Slug "${slug}" is not in generateStaticParams() and dynamicParams is false, so Next.js returns 404 Not Found.`,
    };
  }

  if (usesDynamicApi) {
    return {
      mode: 'dynamic',
      reason:
        'Route reads a dynamic request API (cookies, headers, searchParams, or connection), switching execution to request-time Dynamic Rendering.',
    };
  }

  if (!isPreGenerated) {
    return {
      mode: 'static',
      reason: `Slug "${slug}" was not pre-generated, so Next.js statically generates it on demand on the first request and caches it for subsequent requests because dynamicParams is true.`,
    };
  }

  return {
    mode: 'static',
    reason: `Slug "${slug}" matches generateStaticParams() and reads no dynamic request APIs, so it is statically prerendered at build time.`,
  };
}

export function RenderModeExplorerApp() {
  const [selectedSlug, setSelectedSlug] = useState('rsc-data-fetching');
  const [dynamicParams, setDynamicParams] = useState(true);
  const [usesDynamicApi, setUsesDynamicApi] = useState(false);

  const staticParams = generatePostStaticParams(SAMPLE_POSTS);
  const result = classifyRouteExecution({
    pathname: `/blog/${selectedSlug}`,
    staticParams,
    dynamicParams,
    usesDynamicApi,
  });

  return (
    <section style={{ fontFamily: 'sans-serif', maxWidth: 680, margin: '0 auto', padding: 16 }}>
      <h2>Static vs. Dynamic Route Execution Explorer</h2>

      <div style={{ display: 'grid', gap: 12, marginBottom: 16 }}>
        <label>
          Route slug:{' '}
          <select
            aria-label="Route slug"
            value={selectedSlug}
            onChange={(e) => setSelectedSlug(e.target.value)}
          >
            <option value="rsc-data-fetching">/blog/rsc-data-fetching (pre-generated)</option>
            <option value="static-params">/blog/static-params (pre-generated)</option>
            <option value="unlisted-draft">/blog/unlisted-draft (not in staticParams)</option>
          </select>
        </label>

        <label>
          <input
            type="checkbox"
            checked={dynamicParams}
            onChange={(e) => setDynamicParams(e.target.checked)}
          />{' '}
          dynamicParams = true (allow on-demand slugs)
        </label>

        <label>
          <input
            type="checkbox"
            checked={usesDynamicApi}
            onChange={(e) => setUsesDynamicApi(e.target.checked)}
          />{' '}
          Reads dynamic API (cookies / headers / searchParams / connection)
        </label>
      </div>

      <div style={{ border: '1px solid #cbd5e1', borderRadius: 8, padding: 16 }}>
        <p>
          Mode: <strong data-testid="execution-mode">{result.mode}</strong>
        </p>
        <p data-testid="execution-reason">{result.reason}</p>
      </div>
    </section>
  );
}

export default RenderModeExplorerApp;
