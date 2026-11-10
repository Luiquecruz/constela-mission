import { POSTS, type PostDto } from './data';

export type BlogRouteMatch =
  | { view: 'home' }
  | { view: 'article'; slug: string }
  | { view: 'not-found' };

export function generateStaticParams(): Array<{ slug: string }> {
  return POSTS.map((post) => ({ slug: post.slug }));
}

export function matchBlogRoute(pathname: string): BlogRouteMatch {
  const cleanPath = pathname.split('?')[0].replace(/\/+$/, '') || '/';
  if (cleanPath === '/') {
    return { view: 'home' };
  }

  const segments = cleanPath.split('/').filter(Boolean);
  if (segments.length === 2 && segments[0] === 'articles' && segments[1].length > 0) {
    return { view: 'article', slug: segments[1] };
  }

  return { view: 'not-found' };
}

export function filterPostsByTag(posts: PostDto[], tag: string): PostDto[] {
  const normalized = tag.trim();
  if (!normalized || normalized === 'all') {
    return posts;
  }
  return posts.filter((post) => post.tag === normalized);
}
