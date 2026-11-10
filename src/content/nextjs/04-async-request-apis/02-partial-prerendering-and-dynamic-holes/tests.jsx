test('classifies a route with only static sections as static', () => {
  const analysis = mod.analyzeRouteTree({
    path: '/about',
    rootReadsDynamic: false,
    sections: [
      { id: 'hero', kind: 'static', wrappedInSuspense: false, html: '<header>About</header>' },
      { id: 'footer', kind: 'static', wrappedInSuspense: false, html: '<footer>Links</footer>' },
    ],
  });

  expect(analysis).toEqual({
    mode: 'static',
    unguardedDynamicIds: [],
  });
});

test('classifies a route with Suspense-wrapped dynamic holes and clean root as ppr', () => {
  const analysis = mod.analyzeRouteTree({
    path: '/products/42',
    rootReadsDynamic: false,
    sections: [
      { id: 'product-info', kind: 'static', wrappedInSuspense: false, html: '<article>Shoe</article>' },
      { id: 'cart-badge', kind: 'dynamic', wrappedInSuspense: true, html: '<span>2 items</span>' },
      { id: 'recommendations', kind: 'dynamic', wrappedInSuspense: true, html: '<aside>For you</aside>' },
    ],
  });

  expect(analysis).toEqual({
    mode: 'ppr',
    unguardedDynamicIds: [],
  });
});

test('classifies routes with root dynamic reads or unguarded dynamic sections as dynamic', () => {
  const rootBlocked = mod.analyzeRouteTree({
    path: '/dashboard',
    rootReadsDynamic: true,
    sections: [
      { id: 'feed', kind: 'dynamic', wrappedInSuspense: true, html: '<div>Feed</div>' },
    ],
  });
  expect(rootBlocked).toEqual({
    mode: 'dynamic',
    unguardedDynamicIds: [],
  });

  const unguardedChild = mod.analyzeRouteTree({
    path: '/profile',
    rootReadsDynamic: false,
    sections: [
      { id: 'header', kind: 'static', wrappedInSuspense: false, html: '<nav>Nav</nav>' },
      { id: 'user-cookie-banner', kind: 'dynamic', wrappedInSuspense: false, html: '<div>Hi</div>' },
      { id: 'audit-log', kind: 'dynamic', wrappedInSuspense: true, html: '<div>Logs</div>' },
    ],
  });
  expect(unguardedChild).toEqual({
    mode: 'dynamic',
    unguardedDynamicIds: ['user-cookie-banner'],
  });
});

test('prerenders static shell with Suspense fallbacks and streams dynamic chunks', async () => {
  const result = await mod.prerenderRouteShell({
    path: '/store',
    rootReadsDynamic: false,
    sections: [
      {
        id: 'hero',
        kind: 'static',
        wrappedInSuspense: false,
        html: '<section>Welcome</section>',
      },
      {
        id: 'cart',
        kind: 'dynamic',
        wrappedInSuspense: true,
        html: '',
        fallbackHtml: '<span class="skeleton">Cart...</span>',
        renderDynamic: async () => '<span>Cart (3)</span>',
      },
      {
        id: 'deals',
        kind: 'dynamic',
        wrappedInSuspense: true,
        html: '',
        renderDynamic: async () => '<div>VIP Deals</div>',
      },
    ],
  });

  expect(result.shellHtml).toBe(
    '<section>Welcome</section><span class="skeleton">Cart...</span><div data-fallback="deals">Loading...</div>'
  );
  expect(result.streamedChunks).toEqual([
    { id: 'cart', html: '<span>Cart (3)</span>' },
    { id: 'deals', html: '<div>VIP Deals</div>' },
  ]);
});
