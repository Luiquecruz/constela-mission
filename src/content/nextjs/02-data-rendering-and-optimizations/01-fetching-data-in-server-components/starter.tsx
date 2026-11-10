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

// TODO 1: Convert Date -> ISO string, strip non-serializable fields (dbClient, functions, Map),
// and validate serializability of the projected DTO.
export function prepareArticleProps(rawArticle: RawArticleRecord): SerializedArticleDto {
  // BUG: Spreads rawArticle directly, keeping Date, dbClient, functions, and Map!
  return { ...(rawArticle as unknown as SerializedArticleDto) };
}

// TODO 2: Implement client-safe LikeButton toggling liked state and updating Likes: X
export function LikeButton({
  articleId,
  initialLikes,
}: {
  articleId: string;
  initialLikes: number;
}) {
  const [liked] = useState(false);

  return (
    <button type="button" data-article-id={articleId} aria-pressed={liked}>
      Likes: {initialLikes}
    </button>
  );
}

// TODO 3: Handle loading (role="status"), not-found ("Article not found"), error (role="alert" + Retry),
// and loaded states using prepareArticleProps.
export function ArticleReaderApp({
  fetchArticle = defaultFetchArticle,
  slug: initialSlug = 'server-components-data',
}: {
  fetchArticle?: (slug: string) => Promise<RawArticleRecord | null>;
  slug?: string;
}) {
  const [slug] = useState(initialSlug);
  const [article, setArticle] = useState<SerializedArticleDto | null>(null);

  useEffect(() => {
    fetchArticle(slug)
      .then((raw) => {
        if (raw) {
          setArticle(prepareArticleProps(raw));
        }
      })
      .catch(() => {
        // BUG: Swallows fetch errors silently instead of rendering role="alert" + Retry
      });
  }, [fetchArticle, slug]);

  if (!article) {
    return <p role="status">Loading article...</p>;
  }

  return (
    <section style={{ fontFamily: 'sans-serif', maxWidth: 680, margin: '0 auto', padding: 16 }}>
      <h1>{article.title}</h1>
      <p>{article.body}</p>
      <LikeButton articleId={article.id} initialLikes={article.initialLikes} />
    </section>
  );
}

export default ArticleReaderApp;
