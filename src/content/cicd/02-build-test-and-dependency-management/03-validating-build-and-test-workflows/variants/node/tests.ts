const task = (id: string, dependencies: string[] = []) => ({ id, name: `Step ${id}`, dependencies });
const vulnerability = (id: string, severity: string) => ({ id, severity, package: 'lodash' });

test('schedules a diamond into three batches', async () => {
  const tasks = [task('checkout'), task('build', ['checkout']), task('unit', ['build']), task('lint', ['build']), task('publish', ['unit', 'lint'])];
  expect(mod.scheduleDagTasks(tasks)).toEqual([['checkout'], ['build'], ['unit', 'lint'], ['publish']]);
});

test('schedules independent chains side by side', async () => {
  const tasks = [task('a1'), task('a2', ['a1']), task('b1'), task('b2', ['b1'])];
  expect(mod.scheduleDagTasks(tasks)).toEqual([['a1', 'b1'], ['a2', 'b2']]);
});

test('rejects a missing dependency and a cycle with distinct errors', async () => {
  expect(() => mod.scheduleDagTasks([task('a', ['ghost'])])).toThrow('Missing dependency: ghost');
  expect(() => mod.scheduleDagTasks([task('a', ['b']), task('b', ['a'])])).toThrow('Cyclic dependency detected');
});

// beginner mistake: comparing severity names as text instead of by rank
test('passes when every vulnerability is below the threshold rank', async () => {
  expect(mod.evaluateScanResults([vulnerability('1', 'low'), vulnerability('2', 'medium')], 'high')).toBe(true);
});

test('fails when a vulnerability reaches the threshold exactly', async () => {
  expect(mod.evaluateScanResults([vulnerability('1', 'low'), vulnerability('2', 'high')], 'high')).toBe(false);
  expect(mod.evaluateScanResults([vulnerability('3', 'critical')], 'low')).toBe(false);
});

test('passes when the scan found nothing', async () => {
  expect(mod.evaluateScanResults([], 'low')).toBe(true);
});
