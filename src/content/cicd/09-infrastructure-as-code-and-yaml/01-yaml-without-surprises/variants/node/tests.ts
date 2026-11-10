const doc = (...lines: string[]) => lines.join('\n');
const summary = (issues: Array<{ line: number; rule: string }>) => issues.map((issue) => `${issue.line}:${issue.rule}`);

test('accepts a well-formed workflow, including an unquoted on key and list items that repeat a key', async () => {
  const text = doc('name: ci', 'on:', '  push:', '    branches: [main]', 'jobs:', '  test:', '    steps:', '      - uses: actions/checkout@v4', '      - run: npm test', '      - run: npm run lint');
  expect(mod.lintYaml(text)).toEqual([]);
});

test('rejects tabs for indentation and indentation that is not a multiple of two spaces', async () => {
  expect(mod.lintYaml(doc('jobs:', '\ttest: true'))).toEqual([{ line: 2, rule: 'tab-indent', message: 'Tabs are not allowed for indentation' }]);
  expect(mod.lintYaml(doc('jobs:', '   test: true'))).toEqual([{ line: 2, rule: 'indent-step', message: 'Indentation must be a multiple of 2 spaces' }]);
});

test('reports a key that appears twice in one mapping but not the same key in different mappings', async () => {
  const text = doc('jobs:', '  build:', '    runs-on: a', '    runs-on: b', '  test:', '    runs-on: a');
  expect(mod.lintYaml(text)).toEqual([{ line: 4, rule: 'duplicate-key', message: "Duplicate key 'runs-on'" }]);
  const items = doc('steps:', '  - name: one', '    run: a', '  - name: two', '    run: b', '    run: c');
  expect(summary(mod.lintYaml(items))).toEqual(['6:duplicate-key']);
});

test('flags unquoted words that YAML 1.1 reads as booleans and ignores quoted ones and comments', async () => {
  const text = doc('debug: yes', 'cache: "no"', 'enabled: true', 'verbose: Off # keep quiet', "mode: 'on'");
  expect(mod.lintYaml(text)).toEqual([
    { line: 1, rule: 'ambiguous-boolean', message: "Unquoted 'yes' is read as a boolean by YAML 1.1 parsers" },
    { line: 4, rule: 'ambiguous-boolean', message: "Unquoted 'Off' is read as a boolean by YAML 1.1 parsers" },
  ]);
});

// beginner mistake: writing a version such as 3.10 unquoted, which a parser reads as the number 3.1
test('asks for quotes around two-part versions under a version key', async () => {
  const text = doc('python-version: 3.10', 'node-version: "20"', 'go-version: 1.22', 'timeout: 3.5');
  expect(mod.lintYaml(text)).toEqual([
    { line: 1, rule: 'version-float', message: "Quote the version '3.10' so it stays a string" },
    { line: 3, rule: 'version-float', message: "Quote the version '1.22' so it stays a string" },
  ]);
});

test('ignores blank lines and comments and lists the issues of one document in line order', async () => {
  expect(mod.lintYaml(doc('# comment', '\t# tabbed comment', '', 'a: 1'))).toEqual([]);
  const text = doc('name: ci', 'debug: on', '# a comment', 'jobs:', '   test:', '    steps: 1', '    steps: 2', 'python-version: 3.9');
  expect(summary(mod.lintYaml(text))).toEqual(['2:ambiguous-boolean', '5:indent-step', '7:duplicate-key', '8:version-float']);
});
