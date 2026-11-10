import { getPostBySlug, getPosts } from './data';

export const SITE_TITLE_TEMPLATE = '%s | Constela Press';
export const DEFAULT_SITE_TITLE = 'Constela Press';

export interface PostMetadataResult {
  title: string;
  description: string;
  openGraph: {
    title: string;
    description: string;
    type: 'article' | 'website';
  };
}

export interface SiteMapEntry {
  url: string;
  lastModified: string;
  priority: number;
}

export function homeMetadata(): PostMetadataResult {
  const description = 'Engineering deep dives on Next.js rendering, routing, and web performance.';
  return {
    title: DEFAULT_SITE_TITLE,
    description,
    openGraph: {
      title: DEFAULT_SITE_TITLE,
      description,
      type: 'website',
    },
  };
}

export async function generatePostMetadata(slug: string): Promise<PostMetadataResult> {
  const post = await getPostBySlug(slug);
  if (!post) {
    const title = SITE_TITLE_TEMPLATE.replace('%s', 'Article Not Found');
    const description = 'The requested engineering article could not be found.';
    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: 'website',
      },
    };
  }

  const title = SITE_TITLE_TEMPLATE.replace('%s', post.title);
  return {
    title,
    description: post.summary,
    openGraph: {
      title,
      description: post.summary,
      type: 'article',
    },
  };
}

export async function generateSitemap(baseUrl: string): Promise<SiteMapEntry[]> {
  const cleanBase = baseUrl.replace(/\/+$/, '');
  const posts = await getPosts();
  const rootLastModified = posts[0]?.publishedAt ?? '2026-01-01T00:00:00.000Z';

  return [
    {
      url: cleanBase,
      lastModified: rootLastModified,
      priority: 1,
    },
    ...posts.map((post) => ({
      url: `${cleanBase}/articles/${post.slug}`,
      lastModified: post.publishedAt,
      priority: 0.8,
    })),
  ];
}
