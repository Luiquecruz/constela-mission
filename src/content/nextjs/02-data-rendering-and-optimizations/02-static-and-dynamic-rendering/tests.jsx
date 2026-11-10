test('generatePostStaticParams maps post objects to { slug } parameter objects', () => {
  const params = mod.generatePostStaticParams([
    { slug: 'intro-to-rsc', title: 'Intro to RSC' },
    { slug: 'caching-guide', title: 'Caching Guide' },
  ]);

  expect(params).toEqual([{ slug: 'intro-to-rsc' }, { slug: 'caching-guide' }]);
});

test('classifyRouteExecution distinguishes static prerender vs dynamic API execution', () => {
  const staticParams = [{ slug: 'intro-to-rsc' }];

  const staticResult = mod.classifyRouteExecution({
    pathname: '/blog/intro-to-rsc',
    staticParams,
    dynamicParams: false,
    usesDynamicApi: false,
  });
  expect(staticResult.mode).toBe('static');
  expect(staticResult.reason.toLowerCase()).toContain('build time');

  const dynamicResult = mod.classifyRouteExecution({
    pathname: '/blog/intro-to-rsc',
    staticParams,
    dynamicParams: false,
    usesDynamicApi: true,
  });
  expect(dynamicResult.mode).toBe('dynamic');
  expect(dynamicResult.reason.toLowerCase()).toContain('dynamic');
});

test('classifyRouteExecution handles un-prerendered slugs for dynamicParams true vs false', () => {
  const staticParams = [{ slug: 'intro-to-rsc' }];

  const onDemand = mod.classifyRouteExecution({
    pathname: '/blog/new-draft',
    staticParams,
    dynamicParams: true,
    usesDynamicApi: false,
  });
  expect(onDemand.mode).toBe('static');
  expect(onDemand.reason.toLowerCase()).toContain('first request');
  expect(onDemand.reason.toLowerCase()).toContain('caches');

  const perRequest = mod.classifyRouteExecution({
    pathname: '/blog/new-draft', staticParams, dynamicParams: true, usesDynamicApi: true,
  });
  expect(perRequest.mode).toBe('dynamic');

  const rejected = mod.classifyRouteExecution({
    pathname: '/blog/new-draft',
    staticParams,
    dynamicParams: false,
    usesDynamicApi: false,
  });
  expect(rejected.mode).toBe('not-found');
});

test('RenderModeExplorerApp updates mode badge when toggling dynamic APIs and dynamicParams', async () => {
  render(React.createElement(mod.RenderModeExplorerApp));

  expect(screen.getByTestId('execution-mode')).toHaveTextContent('static');

  const dynamicApiCheckbox = screen.getByLabelText(/reads dynamic api/i);
  await user.click(dynamicApiCheckbox);
  expect(screen.getByTestId('execution-mode')).toHaveTextContent('dynamic');

  await user.click(dynamicApiCheckbox);
  expect(screen.getByTestId('execution-mode')).toHaveTextContent('static');

  await user.selectOptions(screen.getByLabelText(/route slug/i), 'unlisted-draft');
  expect(screen.getByTestId('execution-mode')).toHaveTextContent('static');
  expect(screen.getByTestId('execution-reason')).toHaveTextContent(/caches/i);

  await user.click(screen.getByLabelText(/dynamicParams = true/i));
  expect(screen.getByTestId('execution-mode')).toHaveTextContent('not-found');
});
