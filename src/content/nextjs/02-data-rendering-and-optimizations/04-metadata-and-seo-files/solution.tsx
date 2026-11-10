import React, { useState } from 'react';

export interface ParentMetadata {
  title: string | { default: string; template: string };
  description?: string;
  openGraph?: Record<string, string>;
}

export interface ChildMetadata {
  title?: string;
  description?: string;
  openGraph?: Record<string, string>;
}

export interface ResolvedMetadata {
  title: string;
  description: string;
  openGraph: Record<string, string>;
}

export interface SeoPost {
  slug: string;
  title: string;
  summary: string;
  updatedAt: string;
}

export interface SitemapEntry {
  url: string;
  lastModified: string;
  changeFrequency: 'weekly' | 'monthly';
  priority: number;
}

export interface RobotsConfig {
  rules: Array<{
    userAgent: string;
    allow: string;
    disallow: string[];
  }>;
  sitemap: string;
}

export const ROOT_METADATA: ParentMetadata = {
  title: {
    default: 'Constela Engineering',
    template: '%s | Constela',
  },
  description: 'Guides and architecture patterns for Next.js production teams.',
  openGraph: {
    siteName: 'Constela',
    type: 'website',
  },
};

export const SAMPLE_SEO_POSTS: SeoPost[] = [
  {
    slug: 'app-router-metadata',
    title: 'Mastering App Router Metadata',
    summary: 'Compose title templates and Open Graph tags across nested segments.',
    updatedAt: '2026-04-10',
  },
  {
    slug: 'sitemap-and-robots',
    title: 'Dynamic Sitemaps and Robots Rules',
    summary: 'Generate typed sitemap.xml and robots.txt endpoints directly in App Router.',
    updatedAt: '2026-04-18',
  },
];

export function resolvePageMetadata<TContext = unknown>(
  parentMeta: ParentMetadata,
  pageMetaOrFn: ChildMetadata | ((ctx: TContext) => ChildMetadata) | undefined,
  context?: TContext
): ResolvedMetadata {
  const child =
    typeof pageMetaOrFn === 'function'
      ? pageMetaOrFn(context as TContext)
      : pageMetaOrFn ?? {};

  const childTitle = child.title?.trim() ?? '';
  let resolvedTitle: string;

  if (childTitle.length > 0) {
    if (
      typeof parentMeta.title === 'object' &&
      parentMeta.title.template.includes('%s')
    ) {
      resolvedTitle = parentMeta.title.template.replace('%s', childTitle);
    } else {
      resolvedTitle = childTitle;
    }
  } else {
    resolvedTitle =
      typeof parentMeta.title === 'string'
        ? parentMeta.title
        : parentMeta.title.default;
  }

  const resolvedDescription = child.description ?? parentMeta.description ?? '';

  const mergedOpenGraph: Record<string, string> = {
    ...(parentMeta.openGraph ?? {}),
    ...(child.openGraph ?? {}),
  };

  if (!child.openGraph?.title && !mergedOpenGraph.title) {
    mergedOpenGraph.title = resolvedTitle;
  } else if (!child.openGraph?.title) {
    mergedOpenGraph.title = resolvedTitle;
  }

  if (!child.openGraph?.description && !mergedOpenGraph.description) {
    mergedOpenGraph.description = resolvedDescription;
  } else if (!child.openGraph?.description) {
    mergedOpenGraph.description = resolvedDescription;
  }

  return {
    title: resolvedTitle,
    description: resolvedDescription,
    openGraph: mergedOpenGraph,
  };
}

export function buildSitemap(baseUrl: string, posts: SeoPost[]): SitemapEntry[] {
  const cleanBase = baseUrl.replace(/\/+$/, '');
  const rootLastModified = posts[0]?.updatedAt ?? '2026-01-01';

  return [
    {
      url: cleanBase,
      lastModified: rootLastModified,
      changeFrequency: 'weekly',
      priority: 1,
    },
    ...posts.map((post) => ({
      url: `${cleanBase}/blog/${post.slug}`,
      lastModified: post.updatedAt,
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    })),
  ];
}

export function buildRobots(baseUrl: string, disallowPaths: string[]): RobotsConfig {
  const cleanBase = baseUrl.replace(/\/+$/, '');
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [...disallowPaths],
      },
    ],
    sitemap: `${cleanBase}/sitemap.xml`,
  };
}

export function SeoPreviewApp() {
  const [selectedRoute, setSelectedRoute] = useState<'home' | string>('home');

  const resolved =
    selectedRoute === 'home'
      ? resolvePageMetadata(ROOT_METADATA, {})
      : resolvePageMetadata(
          ROOT_METADATA,
          (ctx: { slug: string }) => {
            const post = SAMPLE_SEO_POSTS.find((p) => p.slug === ctx.slug);
            return post
              ? {
                  title: post.title,
                  description: post.summary,
                  openGraph: { type: 'article' },
                }
              : {};
          },
          { slug: selectedRoute }
        );

  const sitemap = buildSitemap('https://constela.dev', SAMPLE_SEO_POSTS);
  const robots = buildRobots('https://constela.dev', ['/admin', '/api']);

  return (
    <section style={{ fontFamily: 'sans-serif', maxWidth: 720, margin: '0 auto', padding: 16 }}>
      <h2>Metadata &amp; SEO Inspector</h2>

      <label style={{ display: 'block', marginBottom: 16 }}>
        Inspect route:{' '}
        <select
          aria-label="Inspect route"
          value={selectedRoute}
          onChange={(e) => setSelectedRoute(e.target.value)}
        >
          <option value="home">/ (Home — default title)</option>
          {SAMPLE_SEO_POSTS.map((post) => (
            <option key={post.slug} value={post.slug}>
              /blog/{post.slug}
            </option>
          ))}
        </select>
      </label>

      <div style={{ display: 'grid', gap: 12 }}>
        <div style={{ border: '1px solid #cbd5e1', borderRadius: 8, padding: 12 }}>
          <strong>Resolved &lt;title&gt;</strong>
          <p data-testid="resolved-title">{resolved.title}</p>
        </div>

        <div
          data-testid="og-preview"
          style={{ border: '1px solid #cbd5e1', borderRadius: 8, padding: 12 }}
        >
          <strong>Open Graph Card</strong>
          <p>og:title: {resolved.openGraph.title}</p>
          <p>og:description: {resolved.openGraph.description}</p>
          <p>og:type: {resolved.openGraph.type}</p>
        </div>

        <div
          data-testid="robots-preview"
          style={{ border: '1px solid #cbd5e1', borderRadius: 8, padding: 12 }}
        >
          <strong>robots.txt</strong>
          <pre style={{ margin: '8px 0 0 0' }}>
            {`User-agent: ${robots.rules[0].userAgent}\nAllow: ${robots.rules[0].allow}\n${robots.rules[0].disallow.map((p) => `Disallow: ${p}`).join('\n')}\nSitemap: ${robots.sitemap}`}
          </pre>
        </div>

        <div
          data-testid="sitemap-preview"
          style={{ border: '1px solid #cbd5e1', borderRadius: 8, padding: 12 }}
        >
          <strong>sitemap.xml entries</strong>
          <ul>
            {sitemap.map((entry) => (
              <li key={entry.url}>
                {entry.url} (priority {entry.priority})
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

export default SeoPreviewApp;
