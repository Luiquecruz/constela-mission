test('prepareArticleProps serializes Date to ISO string and strips dbClient, functions, and Map', () => {
  const raw = {
    id: 'art-99',
    slug: 'rsc-streams',
    title: 'Streaming Server Trees',
    summary: 'How server data avoids client waterfalls.',
    body: 'Body content.',
    author: 'Elena Vance',
    publishedAt: new Date('2026-05-01T10:15:00.000Z'),
    initialLikes: 12,
    tags: ['nextjs', 'rsc'],
    dbClient: { secret: 'pg://internal' },
    formatDate: () => 'May 1',
    analyticsMap: new Map([['reads', 900]]),
  };

  const dto = mod.prepareArticleProps(raw);

  expect(dto).toEqual({
    id: 'art-99',
    slug: 'rsc-streams',
    title: 'Streaming Server Trees',
    summary: 'How server data avoids client waterfalls.',
    body: 'Body content.',
    author: 'Elena Vance',
    publishedAt: '2026-05-01T10:15:00.000Z',
    initialLikes: 12,
    tags: ['nextjs', 'rsc'],
  });
  expect('dbClient' in dto).toBe(false);
  expect('formatDate' in dto).toBe(false);
  expect('analyticsMap' in dto).toBe(false);
  expect(mod.isJsonSerializable(dto)).toBe(true);
});

test('prepareArticleProps rejects invalid Date values with a TypeError', () => {
  expect(() =>
    mod.prepareArticleProps({
      id: 'bad-1',
      slug: 'bad',
      title: 'Bad Date',
      summary: 'Summary',
      body: 'Body',
      author: 'Author',
      publishedAt: new Date('not-a-date'),
      initialLikes: 0,
      tags: ['test'],
    })
  ).toThrow(TypeError);
});

test('ArticleReaderApp renders loading status, article DTO, and interactive LikeButton', async () => {
  let resolveFetch;
  const fetchArticle = fn(
    () =>
      new Promise((resolve) => {
        resolveFetch = resolve;
      })
  );

  render(React.createElement(mod.ArticleReaderApp, { fetchArticle, slug: 'rsc-streams' }));
  expect(screen.getByRole('status')).toHaveTextContent(/loading/i);

  resolveFetch({
    id: 'art-10',
    slug: 'rsc-streams',
    title: 'Async Server Fetching',
    summary: 'Summary line',
    body: 'Detailed article body.',
    author: 'Samira Cho',
    publishedAt: new Date('2026-06-12T08:00:00.000Z'),
    initialLikes: 5,
    tags: ['data'],
    dbClient: { internal: true },
    onInternalTick: () => {},
  });

  await waitFor(() => {
    expect(screen.getByText('Async Server Fetching')).toBeInTheDocument();
  });
  expect(screen.getByText('2026-06-12T08:00:00.000Z')).toBeInTheDocument();

  const likeBtn = screen.getByRole('button', { name: /likes: 5/i });
  expect(likeBtn).toHaveAttribute('aria-pressed', 'false');
  await user.click(likeBtn);
  expect(screen.getByRole('button', { name: /likes: 6/i })).toHaveAttribute('aria-pressed', 'true');
});

test('ArticleReaderApp renders not-found state when fetchArticle resolves to null', async () => {
  const fetchArticle = fn(async () => null);
  render(React.createElement(mod.ArticleReaderApp, { fetchArticle, slug: 'unknown-post' }));

  await waitFor(() => {
    expect(screen.getByText('Article not found')).toBeInTheDocument();
  });
});

test('ArticleReaderApp renders error alert and retries on button click', async () => {
  let calls = 0;
  const fetchArticle = fn(async () => {
    calls += 1;
    if (calls === 1) {
      throw new Error('Database timeout');
    }
    return {
      id: 'art-22',
      slug: 'recovered',
      title: 'Recovered Article',
      summary: 'Recovered after retry.',
      body: 'Recovered body.',
      author: 'Tariq',
      publishedAt: new Date('2026-06-15T10:00:00.000Z'),
      initialLikes: 3,
      tags: ['recovery'],
    };
  });

  render(React.createElement(mod.ArticleReaderApp, { fetchArticle, slug: 'recovered' }));

  await waitFor(() => {
    expect(screen.getByRole('alert')).toHaveTextContent('Database timeout');
  });

  await user.click(screen.getByRole('button', { name: /retry/i }));

  await waitFor(() => {
    expect(screen.getByText('Recovered Article')).toBeInTheDocument();
  });
  expect(fetchArticle.mock.calls.length).toBe(2);
});
