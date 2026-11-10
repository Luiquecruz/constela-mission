test('data.ts getPosts and getPostBySlug return cloned serializable DTOs and null for unknown slugs', async () => {
  const dataMod = modules['data.ts'];
  const posts = await dataMod.getPosts();

  expect(posts.length).toBeGreaterThanOrEqual(3);
  expect(typeof posts[0].publishedAt).toBe('string');

  const single = await dataMod.getPostBySlug('server-data-boundaries');
  expect(single).not.toBeNull();
  expect(single.title).toBe('Server Data Boundaries Without Waterfalls');

  const missing = await dataMod.getPostBySlug('non-existent-slug');
  expect(missing).toBeNull();
});

test('routing.ts generateStaticParams, matchBlogRoute, and filterPostsByTag handle all routes and tags', () => {
  const dataMod = modules['data.ts'];
  const routingMod = modules['routing.ts'];

  const params = routingMod.generateStaticParams();
  expect(params).toContainEqual({ slug: 'server-data-boundaries' });
  expect(params).toContainEqual({ slug: 'static-params-and-layouts' });

  expect(routingMod.matchBlogRoute('/')).toEqual({ view: 'home' });
  expect(routingMod.matchBlogRoute('/articles/server-data-boundaries/')).toEqual({
    view: 'article',
    slug: 'server-data-boundaries',
  });
  expect(routingMod.matchBlogRoute('/unknown/path')).toEqual({ view: 'not-found' });

  const filtered = routingMod.filterPostsByTag(dataMod.POSTS, 'routing');
  expect(filtered).toHaveLength(1);
  expect(filtered[0].slug).toBe('static-params-and-layouts');
  expect(routingMod.filterPostsByTag(dataMod.POSTS, 'all')).toHaveLength(dataMod.POSTS.length);
});

test('metadata.ts applies title template and builds normalized sitemap entries', async () => {
  const metaMod = modules['metadata.ts'];

  const postMeta = await metaMod.generatePostMetadata('images-fonts-and-seo');
  expect(postMeta.title).toBe('Zero-CLS Fonts, Images, and Dynamic Metadata | Constela Press');
  expect(postMeta.openGraph.type).toBe('article');

  const missingMeta = await metaMod.generatePostMetadata('unknown-post');
  expect(missingMeta.title).toBe('Article Not Found | Constela Press');

  const sitemap = await metaMod.generateSitemap('https://press.constela.dev/');
  expect(sitemap[0].url).toBe('https://press.constela.dev');
  expect(sitemap[0].priority).toBe(1);
  expect(sitemap.some((entry) => entry.url === 'https://press.constela.dev/articles/server-data-boundaries')).toBe(true);
});

test('App renders home feed, filters by tag, preserves layout reader notes across navigation, and updates aria-current', async () => {
  const App = mod.default;
  render(React.createElement(App));

  expect(screen.getByRole('status')).toHaveTextContent(/loading/i);

  await waitFor(() => {
    expect(screen.getByText('Server Data Boundaries Without Waterfalls')).toBeInTheDocument();
  });

  const nav = screen.getByRole('navigation', { name: 'Primary' });
  expect(within(nav).getByRole('link', { name: 'Home' })).toHaveAttribute('aria-current', 'page');

  await user.click(screen.getByRole('button', { name: 'Add reader note' }));
  await user.click(screen.getByRole('button', { name: 'Add reader note' }));
  expect(screen.getByTestId('saved-notes')).toHaveTextContent('Saved notes: 2');

  await user.click(screen.getByRole('button', { name: 'routing' }));
  expect(screen.queryByText('Server Data Boundaries Without Waterfalls')).toBeNull();
  expect(screen.getByText('Pre-rendering Slugs with Persistent Layouts')).toBeInTheDocument();

  await user.click(screen.getByRole('link', { name: 'Pre-rendering Slugs with Persistent Layouts' }));

  await waitFor(() => {
    expect(screen.getByTestId('metadata-title')).toHaveTextContent(
      'Pre-rendering Slugs with Persistent Layouts | Constela Press'
    );
  });
  expect(within(nav).getByRole('link', { name: 'Static Params' })).toHaveAttribute(
    'aria-current',
    'page'
  );
  expect(screen.getByTestId('saved-notes')).toHaveTextContent('Saved notes: 2');
});

test('App renders Article not found on unknown routes/slugs and navigates back home', async () => {
  const App = mod.default;
  render(React.createElement(App, { initialPath: '/articles/missing-entry' }));

  await waitFor(() => {
    expect(screen.getByText('Article not found')).toBeInTheDocument();
  });

  await user.click(screen.getByRole('link', { name: 'Back to home' }));

  await waitFor(() => {
    expect(screen.getByText('Constela Press')).toBeInTheDocument();
    expect(screen.getByText('Server Data Boundaries Without Waterfalls')).toBeInTheDocument();
  });
});
