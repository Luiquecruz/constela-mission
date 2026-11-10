import { POSTS, type PostDto } from './data';

export type BlogRouteMatch =
  | { view: 'home' }
  | { view: 'article'; slug: string }
  | { view: 'not-found' };

// TODO 1: Return Array<{ slug: string }> from POSTS
export function generateStaticParams(): Array<{ slug: string }> {
  // BUG: Returns empty array instead of mapping POSTS to { slug }
  void POSTS;
  return [];
}

// TODO 2: Match '/', '/articles/<slug>', and unknown paths -> 'not-found'
export function matchBlogRoute(pathname: string): BlogRouteMatch {
  // BUG: Always falls back to home instead of distinguishing /articles/[slug] and not-found
  void pathname;
  return { view: 'home' };
}

// TODO 3: Filter posts by tag (returning all when tag === 'all' or empty)
export function filterPostsByTag(posts: PostDto[], tag: string): PostDto[] {
  // BUG: Ignores tag filter
  void tag;
  return posts;
}
