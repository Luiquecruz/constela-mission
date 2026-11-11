# Automated Build and Commit Suite

An automated build and commit suite forms the first line of defense in a Continuous Integration pipeline. Every time a developer pushes code to version control, the automated pipeline compiles the source code, resolves dependencies, and executes a targeted suite of fast automated tests. This process ensures that software compilation is deterministic and that code changes pass fundamental quality checks before progressing further in the delivery pipeline.

You need: Modeling Branch Policies and Pipeline Triggers

## Case study

A global outage at a large content delivery network was traced to a single rule with a regular expression that consumed all the CPU on its servers. The rule had passed the automated tests and then reached the whole network within minutes. The post-mortem pointed at a gap in the test suite: nothing measured CPU use, so a correct but catastrophic pattern looked healthy. A fast commit suite is only as useful as the failures it can recognize.

## Deterministic Builds and Artifact Compilation

A build process is deterministic when compiling identical source code against identical build parameters produces identical output artifacts. To achieve build determinism, pipelines must eliminate environmental variations across local developer workstations and build machines.

Key practices for deterministic builds include:

- **Isolated Build Environments**: Executing build steps inside clean, ephemeral environments (such as containerized runners or disposable virtual machines) rather than persistent, stateful build servers.
- **Explicit Build Declarations**: Defining compilation steps, compiler arguments, and build outputs in version-controlled pipeline configuration files.
- **Hash-Based Output Identification**: Generating unique cryptographic checksums (SHA256 digests) for compiled binaries to verify that artifacts have not been modified or corrupted during build execution.

::: github
Every provider lets a task name what it waits for, and the service builds the same layers of parallel work from those names.

GitHub Actions uses `needs` between jobs; jobs without it start together:

```yaml
jobs:
  install:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
      - run: npm ci
  lint:
    needs: install
    runs-on: ubuntu-latest
    steps:
      - run: npm run lint
  test:
    needs: install
    runs-on: ubuntu-latest
    steps:
      - run: npm test
  package:
    needs: [lint, test]
    runs-on: ubuntu-latest
    steps:
      - run: npm run build
```
:::

::: azure
Azure Pipelines uses `dependsOn`, and a job with `dependsOn: []` starts immediately:

```yaml
jobs:
  - job: install
    steps:
      - script: npm ci
  - job: lint
    dependsOn: install
    steps:
      - script: npm run lint
  - job: test
    dependsOn: install
    steps:
      - script: npm test
  - job: package
    dependsOn: [lint, test]
    steps:
      - script: npm run build
```

Azure Pipelines declares the order with `dependsOn`, and jobs in the same stage run in parallel:

```yaml
stages:
  - stage: verify
    jobs:
      - job: lint
        steps:
          - script: npm ci && npm run lint
      - job: test
        steps:
          - script: npm ci && npm test
  - stage: package
    dependsOn: verify
    jobs:
      - job: package
        steps:
          - script: npm ci && npm run build
```
:::

::: aws
CodePipeline orders the actions of a stage with `runOrder`: actions with the same number run in parallel, and a higher number waits for the lower ones. A stage in which lint and test run together and the package step waits for both:

```json
{
  "name": "Verify",
  "actions": [
    {
      "name": "Lint",
      "actionTypeId": { "category": "Build", "owner": "AWS", "provider": "CodeBuild", "version": "1" },
      "configuration": { "ProjectName": "api-service-lint" },
      "inputArtifacts": [{ "name": "SourceOutput" }],
      "runOrder": 1
    },
    {
      "name": "Test",
      "actionTypeId": { "category": "Build", "owner": "AWS", "provider": "CodeBuild", "version": "1" },
      "configuration": { "ProjectName": "api-service-test" },
      "inputArtifacts": [{ "name": "SourceOutput" }],
      "runOrder": 1
    },
    {
      "name": "Package",
      "actionTypeId": { "category": "Build", "owner": "AWS", "provider": "CodeBuild", "version": "1" },
      "configuration": { "ProjectName": "api-service-package" },
      "inputArtifacts": [{ "name": "SourceOutput" }],
      "runOrder": 2
    }
  ]
}
```
:::

::: gcp
Google Cloud Build runs steps in order unless `waitFor` says otherwise: `waitFor: ['-']` starts a step at once, and a list of step ids waits for exactly those steps:

```yaml
steps:
  - id: install
    name: node
    entrypoint: npm
    args: [ci]
  - id: lint
    name: node
    entrypoint: npm
    args: [run, lint]
    waitFor: [install]
  - id: test
    name: node
    entrypoint: npm
    args: [test]
    waitFor: [install]
```
:::

## Structure of the Commit Test Suite

The commit test suite is an automated testing layer designed to provide immediate feedback to developers following a code push. Because speed is critical for fast feedback loops, commit test suites prioritize execution velocity over exhaustive end-to-end scenario coverage.

The commit suite primarily consists of:

- **Unit Tests**: Isolated tests that validate individual functions, classes, or modules without interacting with external network services, databases, or file systems.
- **Fast Integration Tests**: Targeted tests verifying interaction between closely coupled internal components using lightweight in-memory stubs or local mocks.
- **Static Code Analysis and Linting**: Fast AST-based checks verifying code formatting, syntax correctness, and adherence to programming style guidelines.

To maintain continuous integration momentum, the commit test suite should complete execution in under 5 to 10 minutes.

::: github
A commit suite should publish its results so the failure is readable without opening the log. In GitHub Actions, keep the report as an artifact:

```yaml
- run: npm test
- uses: actions/upload-artifact@v7
  if: always()
  with:
    name: test-report
    path: junit.xml
```
:::

::: azure
In Azure Pipelines, a task publishes the report to the run:

```yaml
- script: npm test
- task: PublishTestResults@2
  condition: always()
  inputs:
    testResultsFormat: JUnit
    testResultsFiles: junit.xml
```
:::

::: aws
In AWS CodeBuild, the buildspec declares the report and its format:

```yaml
version: 0.2
phases:
  build:
    commands:
      - npm test
reports:
  unit-tests:
    files:
      - junit.xml
    file-format: JUNITXML
```
:::

::: gcp
In Google Cloud Build, the report is saved to a bucket with the artifacts of the build:

```yaml
steps:
  - name: node
    entrypoint: npm
    args: [test]
artifacts:
  objects:
    location: gs://BUCKET/reports
    paths: [junit.xml]
```
:::

## The Fast Feedback Loop Principle

The value of an automated build pipeline is inversely proportional to its execution time. When build and test pipelines execute quickly, developers remain engaged and address failures immediately while context is fresh.

When build times exceed 15 to 30 minutes:

- Developers switch to unrelated tasks, causing context-switching overhead when builds fail later.
- Pull Request reviews accumulate delay, slowing overall Lead Time for Changes.
- Developers are tempted to bypass automated status checks to maintain personal momentum.

Optimizing commit suites for high execution speed ensures high pipeline adoption and maintains continuous integration velocity.

::: github
A time limit keeps the loop fast. In GitHub Actions, it is a property of the job:

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    timeout-minutes: 10
```
:::

::: azure
In Azure Pipelines, it is a property of the job:

```yaml
jobs:
  - job: test
    timeoutInMinutes: 10
```
:::

::: aws
In AWS CodeBuild, the timeout is a setting of the project:

```bash
aws codebuild update-project --name api-service --timeout-in-minutes 10
```
:::

::: gcp
In Google Cloud Build, it is a top-level field of the build file:

```yaml
timeout: 600s
steps:
  - name: node
    entrypoint: npm
    args: [test]
```
:::

## Across the platforms

All four reject a graph with a cycle or an unknown dependency before the run starts, which is the behavior the challenge reproduces.

## Common mistakes

- **Including slow end-to-end UI tests in the commit suite**: Running long end-to-end browser tests on every commit inflates build times and introduces test flakiness.
- **Relying on stateful build servers**: Accumulating temporary build files or local library caches on persistent servers leads to "works on my machine" inconsistencies.
- **Ignoring flaky test results**: Intermittent test failures that pass on retry degrade developer trust in the automated test suite.

## In practice

Try it in a repository of your own.

1. Split the pipeline into lint, test and package, with the package step waiting for the other two.
2. Make the lint step fail on purpose and check that the package step does not run.
3. Measure how long the first useful failure takes and move the cheapest checks to the front.

The challenge is the ordering you just configured, written as a function that resolves the build order.

## Check yourself

1. What is the definition of a deterministic build process?
2. Which types of tests should be included in a fast commit test suite?
3. Why is maintaining a execution time of under 10 minutes critical for commit pipelines?
