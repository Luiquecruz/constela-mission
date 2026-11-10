test('SegmentBoundaryShell renders loading fallback with role="status" when isLoading is true', () => {
  render(
    React.createElement(
      mod.SegmentBoundaryShell,
      { isLoading: true },
      React.createElement('p', null, 'Course body')
    )
  );

  expect(screen.getByRole('status')).toBeInTheDocument();
  expect(screen.queryByText('Course body')).toBeNull();
});

test('SegmentBoundaryShell renders error alert and invokes onRetry when "Try again" is clicked', async () => {
  const onRetry = fn();
  render(
    React.createElement(
      mod.SegmentBoundaryShell,
      { error: new Error('Database connection timed out'), onRetry },
      React.createElement('p', null, 'Course body')
    )
  );

  const alert = screen.getByRole('alert');
  expect(alert).toHaveTextContent('Database connection timed out');
  expect(screen.queryByText('Course body')).toBeNull();

  await user.click(screen.getByRole('button', { name: /try again/i }));
  expect(onRetry.mock.calls.length).toBe(1);
});

test('SegmentBoundaryShell renders "Resource not found" when isNotFound is true', () => {
  render(
    React.createElement(
      mod.SegmentBoundaryShell,
      { isNotFound: true },
      React.createElement('p', null, 'Course body')
    )
  );

  expect(screen.getByText(/Resource not found/i)).toBeInTheDocument();
  expect(screen.queryByText('Course body')).toBeNull();
});

test('SegmentBoundaryShell prioritizes error over loading and renders children when healthy', () => {
  const { rerender } = render(
    React.createElement(
      mod.SegmentBoundaryShell,
      { isLoading: true, error: 'Segment crashed' },
      React.createElement('p', null, 'Course body')
    )
  );

  expect(screen.getByRole('alert')).toHaveTextContent('Segment crashed');
  expect(screen.queryByRole('status')).toBeNull();

  rerender(
    React.createElement(
      mod.SegmentBoundaryShell,
      { isLoading: false, error: null, isNotFound: false },
      React.createElement('p', null, 'Course body')
    )
  );

  expect(screen.getByText('Course body')).toBeInTheDocument();
});

test('CourseViewerApp transitions through loading, error recovery, not-found, and loaded states while preserving layout notes', async () => {
  render(React.createElement(mod.CourseViewerApp));

  await user.type(screen.getByLabelText('Persistent layout notes'), 'Keep layout alive');
  expect(screen.getByText('App Router Foundations')).toBeInTheDocument();

  await user.click(screen.getByRole('button', { name: 'Loading' }));
  expect(screen.getByRole('status')).toBeInTheDocument();
  expect(screen.getByLabelText('Persistent layout notes')).toHaveValue('Keep layout alive');

  await user.click(screen.getByRole('button', { name: 'Error' }));
  expect(screen.getByRole('alert')).toHaveTextContent('Failed to load course module');

  await user.click(screen.getByRole('button', { name: /try again/i }));
  expect(screen.getByText('App Router Foundations')).toBeInTheDocument();
  expect(screen.getByLabelText('Persistent layout notes')).toHaveValue('Keep layout alive');

  await user.click(screen.getByRole('button', { name: 'missing-slug' }));
  expect(screen.getByText(/Resource not found/i)).toBeInTheDocument();
  expect(screen.getByLabelText('Persistent layout notes')).toHaveValue('Keep layout alive');
});
