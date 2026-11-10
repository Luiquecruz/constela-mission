export interface PostDto {
  slug: string;
  title: string;
  summary: string;
  body: string;
  author: string;
  tag: 'rendering' | 'routing' | 'optimization';
  publishedAt: string;
  readingTimeMinutes: number;
}

export const POSTS: PostDto[] = [
  {
    slug: 'server-data-boundaries',
    title: 'Server Data Boundaries Without Waterfalls',
    summary: 'Awaiting database queries directly in Server Components while projecting safe client DTOs.',
    body: 'Fetching directly inside async Server Components eliminates sequential browser useEffect waterfalls. Always convert Dates to ISO strings and strip database handles before crossing into Client Components.',
    author: 'Maya Lin',
    tag: 'rendering',
    publishedAt: '2026-03-14T10:00:00.000Z',
    readingTimeMinutes: 5,
  },
  {
    slug: 'static-params-and-layouts',
    title: 'Pre-rendering Slugs with Persistent Layouts',
    summary: 'Combining generateStaticParams with App Router layouts that keep navigation state intact.',
    body: 'Exporting generateStaticParams tells Next.js which dynamic article slugs to prerender at build time, while root layouts stay mounted across client transitions to preserve user context.',
    author: 'Devon Patel',
    tag: 'routing',
    publishedAt: '2026-04-02T14:30:00.000Z',
    readingTimeMinutes: 4,
  },
  {
    slug: 'images-fonts-and-seo',
    title: 'Zero-CLS Fonts, Images, and Dynamic Metadata',
    summary: 'Pairing next/image and next/font with title templates and generated sitemaps.',
    body: 'Self-hosting typography through next/font and sizing hero imagery through next/image eliminates layout shifts, while generateMetadata and sitemap.ts keep crawler indexing accurate.',
    author: 'Elena Vance',
    tag: 'optimization',
    publishedAt: '2026-04-19T08:15:00.000Z',
    readingTimeMinutes: 6,
  },
];

export async function getPosts(): Promise<PostDto[]> {
  return POSTS.map((post) => ({ ...post }));
}

export async function getPostBySlug(slug: string): Promise<PostDto | null> {
  const match = POSTS.find((post) => post.slug === slug);
  return match ? { ...match } : null;
}
