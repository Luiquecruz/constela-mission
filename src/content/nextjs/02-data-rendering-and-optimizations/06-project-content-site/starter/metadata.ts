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

// TODO 4: Apply SITE_TITLE_TEMPLATE ('%s | Constela Press') for posts and handle missing slugs
export async function generatePostMetadata(slug: string): Promise<PostMetadataResult> {
  const post = await getPostBySlug(slug);
  if (!post) {
    return {
      title: DEFAULT_SITE_TITLE,
      description: 'Not found',
      openGraph: {
        title: DEFAULT_SITE_TITLE,
        description: 'Not found',
        type: 'website',
      },
    };
  }

  // BUG: Forgets to apply SITE_TITLE_TEMPLATE ('%s | Constela Press')
  return {
    title: post.title,
    description: post.summary,
    openGraph: {
      title: post.title,
      description: post.summary,
      type: 'article',
    },
  };
}

// TODO 5: Normalize baseUrl and include root + /articles/[slug] entries
export async function generateSitemap(baseUrl: string): Promise<SiteMapEntry[]> {
  const posts = await getPosts();
  // BUG: Missing root entry and trailing-slash normalization
  return posts.map((post) => ({
    url: `${baseUrl}/articles/${post.slug}`,
    lastModified: post.publishedAt,
    priority: 0.8,
  }));
}
