test('resolvePageMetadata applies title.template for dynamic generateMetadata and falls back to title.default', () => {
  const parent = {
    title: { default: 'Constela Engineering', template: '%s | Constela' },
    description: 'Default site description.',
    openGraph: { siteName: 'Constela', type: 'website' },
  };

  const homeMeta = mod.resolvePageMetadata(parent, {});
  expect(homeMeta.title).toBe('Constela Engineering');
  expect(homeMeta.description).toBe('Default site description.');
  expect(homeMeta.openGraph.siteName).toBe('Constela');

  const postMeta = mod.resolvePageMetadata(
    parent,
    ({ slug }) => ({
      title: `Post: ${slug}`,
      description: 'Post summary',
      openGraph: { type: 'article' },
    }),
    { slug: 'routing-basics' }
  );

  expect(postMeta.title).toBe('Post: routing-basics | Constela');
  expect(postMeta.description).toBe('Post summary');
  expect(postMeta.openGraph).toEqual({
    type: 'article',
    title: 'Post: routing-basics | Constela',
    description: 'Post summary',
  });
});

test('resolvePageMetadata replaces Open Graph objects and preserves explicit shared fields without mutating inputs', () => {
  const parent = { title: 'Site', description: 'Site summary', openGraph: {
    siteName: 'Constela', images: '/shared.png', title: 'Old title', description: 'Old summary',
  } };
  const before = JSON.stringify(parent);
  const inherited = mod.resolvePageMetadata(parent, undefined);
  expect(inherited.openGraph).toEqual({ siteName: 'Constela', images: '/shared.png', title: 'Site', description: 'Site summary' });
  const empty = mod.resolvePageMetadata(parent, { openGraph: {} });
  expect(empty.openGraph).toEqual({ title: 'Site', description: 'Site summary' });
  const child = { openGraph: { siteName: parent.openGraph.siteName, title: 'Social title', description: 'Social summary' } };
  const result = mod.resolvePageMetadata(parent, child);
  expect(result.openGraph).toEqual(child.openGraph);
  expect(JSON.stringify(parent)).toBe(before);
  expect(child.openGraph).toEqual({ siteName: 'Constela', title: 'Social title', description: 'Social summary' });
});

test('buildSitemap normalizes baseUrl and generates root plus blog post entries', () => {
  const entries = mod.buildSitemap('https://constela.dev/', [
    { slug: 'first-post', title: 'First', summary: 'S1', updatedAt: '2026-03-01' },
    { slug: 'second-post', title: 'Second', summary: 'S2', updatedAt: '2026-03-05' },
  ]);

  expect(entries).toEqual([
    {
      url: 'https://constela.dev',
      lastModified: '2026-03-01',
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: 'https://constela.dev/blog/first-post',
      lastModified: '2026-03-01',
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: 'https://constela.dev/blog/second-post',
      lastModified: '2026-03-05',
      changeFrequency: 'monthly',
      priority: 0.8,
    },
  ]);
});

test('buildRobots configures allow/disallow rules and canonical sitemap URL', () => {
  const robots = mod.buildRobots('https://constela.dev/', ['/admin', '/internal']);
  expect(robots).toEqual({
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/internal'],
      },
    ],
    sitemap: 'https://constela.dev/sitemap.xml',
  });
});

test('SeoPreviewApp updates resolved title, Open Graph card, robots.txt, and sitemap preview on route change', async () => {
  render(React.createElement(mod.SeoPreviewApp));

  expect(screen.getByTestId('resolved-title')).toHaveTextContent('Constela Engineering');
  expect(screen.getByTestId('robots-preview')).toHaveTextContent('Disallow: /admin');
  expect(screen.getByTestId('robots-preview')).toHaveTextContent('https://constela.dev/sitemap.xml');
  expect(screen.getByTestId('sitemap-preview')).toHaveTextContent('https://constela.dev/blog/app-router-metadata');

  await user.selectOptions(screen.getByLabelText(/inspect route/i), 'app-router-metadata');

  expect(screen.getByTestId('resolved-title')).toHaveTextContent(
    'Mastering App Router Metadata | Constela'
  );
  expect(screen.getByTestId('og-preview')).toHaveTextContent('og:type: article');
  expect(screen.getByTestId('og-preview')).toHaveTextContent(
    'Mastering App Router Metadata | Constela'
  );
});
