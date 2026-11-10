const task = (id: string, dependencies: string[] = []) => ({ id, dependencies, command: `run ${id}` });

test('groups a diamond of tasks into batches that run in parallel', async () => {
  const tasks = [task('install'), task('lint', ['install']), task('test', ['install']), task('package', ['lint', 'test'])];
  expect(mod.resolveBuildOrder(tasks)).toEqual([['install'], ['lint', 'test'], ['package']]);
});

test('puts every task without dependencies in the first batch, in input order', async () => {
  expect(mod.resolveBuildOrder([task('docs'), task('lint'), task('test')])).toEqual([['docs', 'lint', 'test']]);
});

test('keeps the input order inside a batch even when the input is shuffled', async () => {
  const tasks = [task('package', ['lint', 'test']), task('test', ['install']), task('install'), task('lint', ['install'])];
  expect(mod.resolveBuildOrder(tasks)).toEqual([['install'], ['test', 'lint'], ['package']]);
});

test('returns no batches for an empty task list', async () => {
  expect(mod.resolveBuildOrder([])).toEqual([]);
});

// beginner mistake: treating a task that depends on itself as ready to run
test('rejects a cycle, including a task that depends on itself', async () => {
  expect(() => mod.resolveBuildOrder([task('a', ['a'])])).toThrow('Cyclic dependency detected');
  expect(() => mod.resolveBuildOrder([task('setup'), task('a', ['b']), task('b', ['c']), task('c', ['a'])])).toThrow('Cyclic dependency detected');
});

test('names the missing dependency before looking for cycles', async () => {
  expect(() => mod.resolveBuildOrder([task('a', ['b']), task('b', ['a']), task('c', ['ghost'])])).toThrow('Missing dependency: ghost');
});
