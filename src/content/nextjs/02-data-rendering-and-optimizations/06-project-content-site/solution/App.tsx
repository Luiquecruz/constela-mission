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
  const articleSlug = route.view === 'article' ? route.slug : '';

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
      Promise.all([getPostBySlug(articleSlug), generatePostMetadata(articleSlug)]).then(
        ([post, meta]) => {
          if (!active) return;
          setActivePost(post);
          setMetaTitle(meta.title);
          setLoading(false);
        }
      );
    } else {
      setActivePost(null);
      setMetaTitle('Article Not Found | Constela Press');
      setLoading(false);
    }

    return () => {
      active = false;
    };
  }, [pathname, route.view, articleSlug]);

  function navigate(nextPath: string, e?: React.MouseEvent) {
    e?.preventDefault();
    setPathname(nextPath);
  }

  const normalizedPath = pathname.split('?')[0].replace(/\/+$/, '') || '/';
  const isNotFound =
    route.view === 'not-found' || (route.view === 'article' && !loading && !activePost);

  return (
    <div style={{ fontFamily: 'sans-serif', maxWidth: 760, margin: '0 auto', padding: 16 }}>
      <header style={{ borderBottom: '1px solid #cbd5e1', paddingBottom: 12, marginBottom: 16 }}>
        <nav
          aria-label="Primary"
          style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}
        >
          <a
            href="/"
            aria-current={normalizedPath === '/' ? 'page' : undefined}
            onClick={(e) => navigate('/', e)}
          >
            Home
          </a>
          <a
            href="/articles/server-data-boundaries"
            aria-current={
              normalizedPath === '/articles/server-data-boundaries' ? 'page' : undefined
            }
            onClick={(e) => navigate('/articles/server-data-boundaries', e)}
          >
            Server Data
          </a>
          <a
            href="/articles/static-params-and-layouts"
            aria-current={
              normalizedPath === '/articles/static-params-and-layouts' ? 'page' : undefined
            }
            onClick={(e) => navigate('/articles/static-params-and-layouts', e)}
          >
            Static Params
          </a>
          <button type="button" onClick={() => setNoteCount((c) => c + 1)}>
            Add reader note
          </button>
          <span data-testid="saved-notes">Saved notes: {noteCount}</span>
        </nav>
        <p data-testid="metadata-title" style={{ margin: '8px 0 0 0', fontSize: 13, color: '#475569' }}>
          Title: {metaTitle}
        </p>
      </header>

      {loading && <p role="status">Loading...</p>}

      {!loading && route.view === 'home' && (
        <main>
          <h1>Constela Press</h1>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            {['all', 'rendering', 'routing', 'optimization'].map((tag) => (
              <button
                key={tag}
                type="button"
                aria-pressed={selectedTag === tag}
                onClick={() => setSelectedTag(tag)}
              >
                {tag === 'all' ? 'All' : tag}
              </button>
            ))}
          </div>
          {filterPostsByTag(posts, selectedTag).map((post) => (
            <article
              key={post.slug}
              style={{
                border: '1px solid #e2e8f0',
                borderRadius: 8,
                padding: 12,
                marginBottom: 12,
              }}
            >
              <h2 style={{ margin: '0 0 6px 0' }}>
                <a
                  href={`/articles/${post.slug}`}
                  onClick={(e) => navigate(`/articles/${post.slug}`, e)}
                >
                  {post.title}
                </a>
              </h2>
              <p style={{ margin: '0 0 6px 0' }}>{post.summary}</p>
              <small>
                #{post.tag} · {post.readingTimeMinutes} min read
              </small>
            </article>
          ))}
        </main>
      )}

      {!loading && route.view === 'article' && activePost && (
        <main>
          <article>
            <h1>{activePost.title}</h1>
            <p style={{ color: '#475569', fontSize: 14 }}>
              By {activePost.author} · {activePost.readingTimeMinutes} min read · #{activePost.tag}
            </p>
            <p>{activePost.body}</p>
          </article>
          <p>
            <a href="/" onClick={(e) => navigate('/', e)}>
              Back to all articles
            </a>
          </p>
        </main>
      )}

      {!loading && isNotFound && (
        <main>
          <h1>Article not found</h1>
          <p>The requested page or engineering article does not exist.</p>
          <a href="/" onClick={(e) => navigate('/', e)}>
            Back to home
          </a>
        </main>
      )}
    </div>
  );
}
