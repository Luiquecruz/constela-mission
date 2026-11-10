const HOUR = 3600000;
const T = 1700000000000;
const commit = (hash: string, hoursAfterStart: number) => ({ hash, timestamp: T + hoursAfterStart * HOUR });

test('accepts commits that stay within the allowed interval and rounds the largest gap', async () => {
  const commits = [commit('a1', 0), commit('b2', 1 / 3)];
  expect(mod.evaluateCommitFrequency(commits, 1, T + (2 / 3) * HOUR)).toEqual({ compliant: true, maxGapHours: 0.33, reason: 'Commit frequency satisfies CI policy' });
});

test('sorts the commits by time before measuring the gaps', async () => {
  const unsorted = [commit('c3', 5), commit('a1', 0), commit('b2', 2)];
  expect(mod.evaluateCommitFrequency(unsorted, 4, T + 6 * HOUR)).toEqual({ compliant: true, maxGapHours: 3, reason: 'Commit frequency satisfies CI policy' });
});

// beginner mistake: measuring only the gaps between commits and forgetting the time since the last one
test('counts the time since the last commit as a gap', async () => {
  const commits = [commit('a1', 0), commit('b2', 1)];
  expect(mod.evaluateCommitFrequency(commits, 4, T + 11 * HOUR)).toEqual({ compliant: false, maxGapHours: 10, reason: 'Commit gap exceeds threshold' });
});

test('treats a gap equal to the threshold as compliant', async () => {
  const commits = [commit('a1', 0), commit('b2', 4)];
  expect(mod.evaluateCommitFrequency(commits, 4, T + 5 * HOUR).compliant).toBe(true);
});

test('flags a long gap in the middle of the history', async () => {
  const commits = [commit('a1', 0), commit('b2', 1), commit('c3', 9.5), commit('d4', 10)];
  expect(mod.evaluateCommitFrequency(commits, 8, T + 10.5 * HOUR)).toEqual({ compliant: false, maxGapHours: 8.5, reason: 'Commit gap exceeds threshold' });
});

test('reports a history without commits as not compliant', async () => {
  expect(mod.evaluateCommitFrequency([], 4, T)).toEqual({ compliant: false, maxGapHours: 0, reason: 'No commits recorded' });
});
