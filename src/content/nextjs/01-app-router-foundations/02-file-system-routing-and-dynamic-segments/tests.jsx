test('strips (route-groups) from URLs and ignores _private folders', () => {
  const tree = [
    { pattern: 'app/(marketing)/pricing/page.tsx', componentName: 'PricingPage' },
    { pattern: 'app/_internal/debug/page.tsx', componentName: 'InternalDebugPage' },
    { pattern: 'app/blog/_components/card/page.tsx', componentName: 'PrivateCardPage' },
  ];

  expect(mod.matchRoute(tree, '/pricing')).toEqual({
    matched: true,
    componentName: 'PricingPage',
    params: {},
  });
  expect(mod.matchRoute(tree, '/(marketing)/pricing')).toEqual({
    matched: false,
    componentName: null,
    params: {},
  });
  expect(mod.matchRoute(tree, '/_internal/debug')).toEqual({
    matched: false,
    componentName: null,
    params: {},
  });
  expect(mod.matchRoute(tree, '/blog/_components/card')).toEqual({
    matched: false,
    componentName: null,
    params: {},
  });
});

test('extracts params for [slug] and [...slug] catch-all routes', () => {
  const tree = [
    { pattern: 'app/blog/[slug]/page.tsx', componentName: 'BlogPostPage' },
    { pattern: 'app/docs/[...slug]/page.tsx', componentName: 'DocsCatchAllPage' },
  ];

  expect(mod.matchRoute(tree, '/blog/server-components')).toEqual({
    matched: true,
    componentName: 'BlogPostPage',
    params: { slug: 'server-components' },
  });
  expect(mod.matchRoute(tree, '/docs/routing/dynamic-segments')).toEqual({
    matched: true,
    componentName: 'DocsCatchAllPage',
    params: { slug: ['routing', 'dynamic-segments'] },
  });
  expect(mod.matchRoute(tree, '/docs')).toEqual({
    matched: false,
    componentName: null,
    params: {},
  });
});

test('matches [[...categories]] optional catch-all for zero or more segments', () => {
  const tree = [
    { pattern: 'app/shop/[[...categories]]/page.tsx', componentName: 'ShopCatalogPage' },
  ];

  expect(mod.matchRoute(tree, '/shop')).toEqual({
    matched: true,
    componentName: 'ShopCatalogPage',
    params: {},
  });
  expect(mod.matchRoute(tree, '/shop/audio/monitors')).toEqual({
    matched: true,
    componentName: 'ShopCatalogPage',
    params: { categories: ['audio', 'monitors'] },
  });
});

test('prefers static routes over dynamic [param] and catch-all [...rest] routes', () => {
  const tree = [
    { pattern: 'app/blog/[...rest]/page.tsx', componentName: 'BlogCatchAllPage' },
    { pattern: 'app/blog/[slug]/page.tsx', componentName: 'BlogPostPage' },
    { pattern: 'app/blog/featured/page.tsx', componentName: 'FeaturedBlogPage' },
  ];

  expect(mod.matchRoute(tree, '/blog/featured')).toEqual({
    matched: true,
    componentName: 'FeaturedBlogPage',
    params: {},
  });
  expect(mod.matchRoute(tree, '/blog/hello-world')).toEqual({
    matched: true,
    componentName: 'BlogPostPage',
    params: { slug: 'hello-world' },
  });
  expect(mod.matchRoute(tree, '/blog/2026/recap')).toEqual({
    matched: true,
    componentName: 'BlogCatchAllPage',
    params: { rest: ['2026', 'recap'] },
  });
});

test('RouteExplorerApp updates matched component and params interactively', async () => {
  render(React.createElement(mod.RouteExplorerApp));

  expect(screen.getByText(/Matched: BlogPostPage/)).toBeInTheDocument();
  expect(screen.getByTestId('matched-params')).toHaveTextContent('{"slug":"app-router-guide"}');

  await user.click(screen.getByRole('button', { name: '/shop/audio/monitors' }));
  expect(screen.getByText(/Matched: ShopCatalogPage/)).toBeInTheDocument();
  expect(screen.getByTestId('matched-params')).toHaveTextContent('{"categories":["audio","monitors"]}');

  await user.click(screen.getByRole('button', { name: '/_internal/debug' }));
  expect(screen.getByText(/No route matched \(404\)/)).toBeInTheDocument();
});
