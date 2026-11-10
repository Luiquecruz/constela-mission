import React, { useEffect, useState } from 'react';

export interface RawArticleRecord {
  id: string;
  slug: string;
  title: string;
  summary: string;
  body: string;
  author: string;
  publishedAt: Date | string;
  initialLikes: number;
  tags: string[];
  dbClient?: unknown;
  formatDate?: () => string;
  analyticsMap?: Map<string, number>;
  [key: string]: unknown;
}

export interface SerializedArticleDto {
  id: string;
  slug: string;
  title: string;
  summary: string;
  body: string;
  author: string;
  publishedAt: string;
  initialLikes: number;
  tags: string[];
}

const SAMPLE_ARTICLES: Record<string, RawArticleRecord> = {
  'server-components-data': {
    id: 'art-1',
    slug: 'server-components-data',
    title: 'Co-locating Data Reads in Server Components',
    summary: 'Eliminate client fetch waterfalls by awaiting data directly on the server.',
    body: 'Async Server Components run on the server before UI streams to the browser, keeping credentials and database clients off the client bundle.',
    author: 'Maya Lin',
    publishedAt: new Date('2026-03-10T12:00:00.000Z'),
    initialLikes: 18,
    tags: ['nextjs', 'rsc', 'data'],
    dbClient: { connectionString: 'postgres://secret:password@internal:5432/app' },
    formatDate: () => 'Mar 10',
    analyticsMap: new Map([['views', 420]]),
  },
  'serialization-boundary': {
    id: 'art-2',
    slug: 'serialization-boundary',
    title: 'Guarding the Server-to-Client Boundary',
    summary: 'Project explicit JSON-safe DTOs before handing props to Client Component leaves.',
    body: 'Convert Date instances to ISO strings and strip helper methods or database handles so props cross the network safely.',
    author: 'Devon Patel',
    publishedAt: new Date('2026-04-02T09:30:00.000Z'),
    initialLikes: 9,
    tags: ['serialization', 'dto'],
    dbClient: { poolSize: 10 },
  },
};

export async function defaultFetchArticle(slug: string): Promise<RawArticleRecord | null> {
  return SAMPLE_ARTICLES[slug] ?? null;
}

export function isJsonSerializable(value: unknown): boolean {
  if (value === null) return true;
  const type = typeof value;
  if (type === 'string' || type === 'boolean') return true;
  if (type === 'number') return Number.isFinite(value);
  if (type !== 'object') return false;
  if (Array.isArray(value)) {
    return value.every((item) => isJsonSerializable(item));
  }
  const proto = Object.getPrototypeOf(value);
  if (proto !== Object.prototype && proto !== null) {
    return false;
  }
  return Object.values(value as Record<string, unknown>).every((v) => isJsonSerializable(v));
}

export function prepareArticleProps(rawArticle: RawArticleRecord): SerializedArticleDto {
  if (!rawArticle || typeof rawArticle !== 'object') {
    throw new TypeError('rawArticle must be an object');
  }

  let publishedIso: string;
  if (rawArticle.publishedAt instanceof Date) {
    if (Number.isNaN(rawArticle.publishedAt.getTime())) {
      throw new TypeError('publishedAt must be a valid Date');
    }
    publishedIso = rawArticle.publishedAt.toISOString();
  } else if (typeof rawArticle.publishedAt === 'string' && rawArticle.publishedAt.trim().length > 0) {
    publishedIso = rawArticle.publishedAt;
  } else {
    throw new TypeError('publishedAt must be a valid Date or non-empty ISO string');
  }

  if (!Array.isArray(rawArticle.tags) || rawArticle.tags.some((t) => typeof t !== 'string')) {
    throw new TypeError('tags must be an array of strings');
  }

  const dto: SerializedArticleDto = {
    id: String(rawArticle.id),
    slug: String(rawArticle.slug),
    title: String(rawArticle.title),
    summary: String(rawArticle.summary),
    body: String(rawArticle.body),
    author: String(rawArticle.author),
    publishedAt: publishedIso,
    initialLikes: Number(rawArticle.initialLikes),
    tags: [...rawArticle.tags],
  };

  if (!isJsonSerializable(dto)) {
    throw new TypeError('Prepared article DTO is not JSON-serializable');
  }

  return dto;
}

export function LikeButton({
  articleId,
  initialLikes,
}: {
  articleId: string;
  initialLikes: number;
}) {
  const [liked, setLiked] = useState(false);
  const count = liked ? initialLikes + 1 : initialLikes;

  return (
    <button
      type="button"
      data-article-id={articleId}
      aria-pressed={liked}
      onClick={() => setLiked((prev) => !prev)}
      style={{
        padding: '6px 12px',
        borderRadius: 6,
        border: '1px solid #cbd5e1',
        cursor: 'pointer',
      }}
    >
      {liked ? 'Liked' : 'Like'} — Likes: {count}
    </button>
  );
}

type LoadState =
  | { status: 'loading' }
  | { status: 'not-found' }
  | { status: 'error'; message: string }
  | { status: 'loaded'; article: SerializedArticleDto };

export function ArticleReaderApp({
  fetchArticle = defaultFetchArticle,
  slug: initialSlug = 'server-components-data',
}: {
  fetchArticle?: (slug: string) => Promise<RawArticleRecord | null>;
  slug?: string;
}) {
  const [slug, setSlug] = useState(initialSlug);
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<LoadState>({ status: 'loading' });

  useEffect(() => {
    setSlug(initialSlug);
  }, [initialSlug]);

  useEffect(() => {
    let active = true;
    setState({ status: 'loading' });

    fetchArticle(slug)
      .then((raw) => {
        if (!active) return;
        if (!raw) {
          setState({ status: 'not-found' });
          return;
        }
        const dto = prepareArticleProps(raw);
        setState({ status: 'loaded', article: dto });
      })
      .catch((err: unknown) => {
        if (!active) return;
        const message = err instanceof Error ? err.message : 'Failed to load article';
        setState({ status: 'error', message });
      });

    return () => {
      active = false;
    };
  }, [fetchArticle, slug, attempt]);

  return (
    <section style={{ fontFamily: 'sans-serif', maxWidth: 680, margin: '0 auto', padding: 16 }}>
      {fetchArticle === defaultFetchArticle && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <button type="button" onClick={() => setSlug('server-components-data')}>
            Server Data
          </button>
          <button type="button" onClick={() => setSlug('serialization-boundary')}>
            Serialization Boundary
          </button>
          <button type="button" onClick={() => setSlug('missing-slug')}>
            Missing Slug
          </button>
        </div>
      )}

      {state.status === 'loading' && <p role="status">Loading article...</p>}

      {state.status === 'not-found' && (
        <div>
          <h2>Article not found</h2>
          <p>No article matched slug &ldquo;{slug}&rdquo;.</p>
        </div>
      )}

      {state.status === 'error' && (
        <div role="alert">
          <p>Error: {state.message}</p>
          <button type="button" onClick={() => setAttempt((n) => n + 1)}>
            Retry
          </button>
        </div>
      )}

      {state.status === 'loaded' && (
        <article>
          <header style={{ marginBottom: 12 }}>
            <h1 style={{ margin: '0 0 4px 0' }}>{state.article.title}</h1>
            <p style={{ margin: 0, color: '#475569', fontSize: 14 }}>
              By {state.article.author} · <time dateTime={state.article.publishedAt}>{state.article.publishedAt}</time>
            </p>
          </header>
          <p style={{ fontWeight: 500 }}>{state.article.summary}</p>
          <p>{state.article.body}</p>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            {state.article.tags.map((tag) => (
              <span
                key={tag}
                style={{ background: '#e2e8f0', padding: '2px 8px', borderRadius: 999, fontSize: 12 }}
              >
                #{tag}
              </span>
            ))}
          </div>
          <LikeButton articleId={state.article.id} initialLikes={state.article.initialLikes} />
        </article>
      )}
    </section>
  );
}

export default ArticleReaderApp;
