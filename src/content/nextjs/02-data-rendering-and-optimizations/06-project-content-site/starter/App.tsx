import React, { useEffect, useState } from 'react';
import { getPostBySlug, getPosts, type PostDto } from './data';
import { generatePostMetadata, homeMetadata } from './metadata';
import { filterPostsByTag, matchBlogRoute } from './routing';

export default function App({ initialPath = '/' }: { initialPath?: string }) {
  const [pathname, setPathname] = useState(initialPath);
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [noteCount, setNoteCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<PostDto[]>([]);
  const [activePost, setActivePost] = useState<PostDto | null>(null);
  const [metaTitle, setMetaTitle] = useState(homeMetadata().title);

  const route = matchBlogRoute(pathname);

  useEffect(() => {
    let active = true;
    setLoading(true);
    if (route.view === 'home') {
      getPosts().then((items) => {
        if (!active) return;
        setPosts(items);
        setActivePost(null);
        setMetaTitle(homeMetadata().title);
        setLoading(false);
      });
    } else if (route.view === 'article') {
      Promise.all([getPostBySlug(route.slug), generatePostMetadata(route.slug)]).then(
        ([post, meta]) => {
          if (!active) return;
          setActivePost(post);
          setMetaTitle(meta.title);
          setLoading(false);
        }
      );
    } else {
      setLoading(false);
    }
    return () => {
      active = false;
    };
  }, [pathname, route.view, route.view === 'article' ? route.slug : '']);

  function navigate(nextPath: string, e?: React.MouseEvent) {
    e?.preventDefault();
    setPathname(nextPath);
  }

  return (
    <div style={{ fontFamily: 'sans-serif', maxWidth: 760, margin: '0 auto', padding: 16 }}>
      {/* TODO 6: Add aria-current="page" on active NavBar links and persistent layout controls */}
      <header style={{ borderBottom: '1px solid #cbd5e1', paddingBottom: 12, marginBottom: 16 }}>
        <nav aria-label="Primary" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <a href="/" onClick={(e) => navigate('/', e)}>
            Home
          </a>
          <a
            href="/articles/server-data-boundaries"
            onClick={(e) => navigate('/articles/server-data-boundaries', e)}
          >
            Server Data
          </a>
          <button type="button" onClick={() => setNoteCount((c) => c + 1)}>
            Add reader note
          </button>
          <span>Saved notes: {noteCount}</span>
        </nav>
        <p data-testid="metadata-title">Title: {metaTitle}</p>
      </header>

      {loading && <p role="status">Loading...</p>}

      {!loading && route.view === 'home' && (
        <main>
          <h1>Constela Press</h1>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            {['all', 'rendering', 'routing', 'optimization'].map((tag) => (
              <button key={tag} type="button" onClick={() => setSelectedTag(tag)}>
                {tag === 'all' ? 'All' : tag}
              </button>
            ))}
          </div>
          {filterPostsByTag(posts, selectedTag).map((post) => (
            <article key={post.slug} style={{ marginBottom: 12 }}>
              <h2>
                <a
                  href={`/articles/${post.slug}`}
                  onClick={(e) => navigate(`/articles/${post.slug}`, e)}
                >
                  {post.title}
                </a>
              </h2>
              <p>{post.summary}</p>
            </article>
          ))}
        </main>
      )}

      {/* TODO 7: Render article detail and "Article not found" fallback with "Back to home" link */}
      {!loading && route.view === 'article' && activePost && (
        <main>
          <h1>{activePost.title}</h1>
          <p>{activePost.body}</p>
        </main>
      )}
    </div>
  );
}
