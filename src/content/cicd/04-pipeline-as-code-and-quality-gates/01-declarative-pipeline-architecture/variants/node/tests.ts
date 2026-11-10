const GITHUB = {
  jobs: {
    install: { steps: [{ uses: 'actions/checkout@v4' }, { run: 'npm ci' }] },
    lint: { needs: 'install', steps: [{ run: 'npm run lint' }] },
    test: { needs: ['install'], steps: [{ run: 'npm test' }] },
    package: { needs: ['lint', 'test'], steps: [{ run: 'npm run build' }] },
  },
};

test('reads GitHub Actions jobs, needs and run steps and ignores action steps', async () => {
  expect(mod.normalizePipeline('github', GITHUB)).toEqual([
    { id: 'install', dependencies: [], commands: ['npm ci'] },
    { id: 'lint', dependencies: ['install'], commands: ['npm run lint'] },
    { id: 'test', dependencies: ['install'], commands: ['npm test'] },
    { id: 'package', dependencies: ['lint', 'test'], commands: ['npm run build'] },
  ]);
});

test('reads Azure Pipelines jobs, dependencies and script steps and ignores task steps', async () => {
  const azure = {
    jobs: [
      { job: 'install', steps: [{ script: 'npm ci' }] },
      { job: 'test', dependsOn: 'install', steps: [{ task: 'PublishTestResults@2' }, { script: 'npm test' }] },
      { job: 'package', dependsOn: ['install', 'test'], steps: [{ script: 'npm run build' }] },
    ],
  };
  expect(mod.normalizePipeline('azure', azure)).toEqual([
    { id: 'install', dependencies: [], commands: ['npm ci'] },
    { id: 'test', dependencies: ['install'], commands: ['npm test'] },
    { id: 'package', dependencies: ['install', 'test'], commands: ['npm run build'] },
  ]);
});

// beginner mistake: assuming Cloud Build steps run in parallel when they do not name what they wait for
test('makes a Cloud Build step wait for every earlier step by default', async () => {
  const gcp = {
    steps: [
      { id: 'install', name: 'node', entrypoint: 'npm', args: ['ci'] },
      { id: 'lint', name: 'node', entrypoint: 'npm', args: ['run', 'lint'] },
      { name: 'node', entrypoint: 'npm', args: ['test'] },
    ],
  };
  expect(mod.normalizePipeline('gcp', gcp)).toEqual([
    { id: 'install', dependencies: [], commands: ['npm ci'] },
    { id: 'lint', dependencies: ['install'], commands: ['npm run lint'] },
    { id: 'step-3', dependencies: ['install', 'lint'], commands: ['npm test'] },
  ]);
});

test('honors the wait list in Cloud Build, including the dash that starts a step immediately', async () => {
  const gcp = {
    steps: [
      { id: 'install', name: 'node', entrypoint: 'npm', args: ['ci'] },
      { id: 'test', name: 'node', entrypoint: 'npm', args: ['test'], waitFor: ['install'] },
      { id: 'docs', name: 'node', args: ['run', 'docs'], waitFor: ['-'] },
    ],
  };
  expect(mod.normalizePipeline('gcp', gcp)).toEqual([
    { id: 'install', dependencies: [], commands: ['npm ci'] },
    { id: 'test', dependencies: ['install'], commands: ['npm test'] },
    { id: 'docs', dependencies: [], commands: ['node run docs'] },
  ]);
});

test('chains the CodeBuild phases that exist and skips the missing ones', async () => {
  const aws = { phases: { post_build: { commands: ['echo done'] }, install: { commands: ['npm ci'] }, build: { commands: ['npm run build', 'npm test'] } } };
  expect(mod.normalizePipeline('aws', aws)).toEqual([
    { id: 'install', dependencies: [], commands: ['npm ci'] },
    { id: 'build', dependencies: ['install'], commands: ['npm run build', 'npm test'] },
    { id: 'post_build', dependencies: ['build'], commands: ['echo done'] },
  ]);
});

test('rejects a dependency on an unknown job and a provider that is not supported', async () => {
  const broken = { jobs: { lint: { needs: 'ghost', steps: [{ run: 'npm run lint' }] } } };
  expect(() => mod.normalizePipeline('github', broken)).toThrow('Dependency ghost is missing from pipeline jobs');
  expect(() => mod.normalizePipeline('gcp', { steps: [{ id: 'a', name: 'node', waitFor: ['ghost'] }] })).toThrow('Dependency ghost is missing from pipeline jobs');
  expect(() => mod.normalizePipeline('jenkins', {})).toThrow('Unsupported provider: jenkins');
});
