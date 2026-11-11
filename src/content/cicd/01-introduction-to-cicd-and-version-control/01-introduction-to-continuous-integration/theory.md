# Introduction to Continuous Integration

Continuous Integration (CI) is a foundational software engineering practice where developers regularly integrate their code changes into a shared central repository. Rather than accumulating unmerged code in isolated local branches for weeks, developers push changes frequently—at least once per day. Every commit triggers an automated build and test pipeline that validates code health, catches syntax errors, and prevents integration defects early in the delivery lifecycle.

You need: nothing. This is the first lesson of the track.

## Case study

When the United States federal health insurance website opened for enrollment, the agency behind it had launched it without verifying that it met its performance requirements, according to the Government Accountability Office, and many users had trouble using it. The lesson for a pipeline is that checks which run only at the end find their problems when they are most expensive: continuous integration moves them to every change, so that integration and performance problems are found while the change is still small.

## Core Pillars of Continuous Integration

Continuous Integration shifts software validation from a manual, periodic ceremony to an automated, continuous process. The practice relies on three fundamental pillars: a single source of truth repository, automated build and commit test suites, and rapid feedback loops.

When code is integrated continuously, integration errors are discovered within minutes of being introduced. This dramatically reduces the cost and effort of debugging, as the scope of changes between builds remains small and manageable.

::: github
Every CI service expresses the same loop: on a push or a pull request, fetch the code, install dependencies exactly as the lockfile says, run the tests and report the result. Only the file format changes.

GitHub Actions reads workflows from `.github/workflows/`:

```yaml
name: ci
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
      - uses: actions/setup-node@v7
        with:
          node-version-file: .nvmrc
          cache: npm
      - run: npm ci
      - run: npm run lint
      - run: npm test
```
:::

::: azure
Azure Pipelines reads `azure-pipelines.yml` at the repository root. The `pr` trigger works for GitHub and Bitbucket Cloud repositories; for Azure Repos Git, configure a build validation branch policy on `main` instead:

```yaml
trigger:
  branches:
    include: [main]
pr:
  branches:
    include: [main]

pool:
  vmImage: ubuntu-latest

steps:
  - task: NodeTool@0
    inputs:
      versionSource: fromFile
      versionFilePath: .nvmrc
  - script: npm ci
    displayName: Install dependencies
  - script: npm run lint
    displayName: Lint
  - script: npm test
    displayName: Run tests
```
:::

::: aws
AWS CodeBuild reads `buildspec.yml` and runs it in named phases; the `reports` section publishes test results to a report group:

```yaml
version: 0.2

phases:
  install:
    runtime-versions:
      nodejs: 22
  pre_build:
    commands:
      - npm ci
  build:
    commands:
      - npm run lint
      - npm test

reports:
  unit-tests:
    files:
      - "junit.xml"
    file-format: JUNITXML
```
:::

::: gcp
Google Cloud Build reads `cloudbuild.yaml`; each step is a container image that runs a command, and a trigger on the repository starts the build:

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
  - id: test
    name: node
    entrypoint: npm
    args: [test]
```
:::

## Software Delivery Performance and DORA Metrics

Research conducted by the DevOps Research and Assessment (DORA) organization establishes four key metrics to measure software delivery throughput and stability. These metrics differentiate high-performing teams from traditional organizations:

1. **Deployment Frequency (DF)**: How often an organization successfully releases code to production.
2. **Lead Time for Changes (LTC)**: The time it takes for a commit to go from code check-in to running in production.
3. **Change Failure Rate (CFR)**: The percentage of deployments to production that result in a degraded service or require immediate remediation (such as hotfixes or rollbacks).
4. **Failed Deployment Recovery Time (MTTR)**: The time required to restore service when a production failure or deployment degradation occurs.

High-performing delivery teams achieve short lead times and high deployment frequency while simultaneously maintaining low change failure rates and rapid recovery times.

::: github
Each provider keeps the history of its runs. In GitHub Actions, list the recent deployments with their result and timing, which is the raw data for frequency and lead time:

```bash
gh run list --workflow deploy.yml --limit 30 --json conclusion,createdAt,updatedAt
```
:::

::: azure
In Azure Pipelines, list the recent runs of the deployment pipeline:

```bash
az pipelines runs list --pipeline-ids PIPELINE_ID --top 30
```
:::

::: aws
In AWS CodePipeline, list the executions of the pipeline with their status and start time:

```bash
aws codepipeline list-pipeline-executions --pipeline-name api-service --max-items 30
```
:::

::: gcp
In Google Cloud Build, list the latest builds with their status and creation time:

```bash
gcloud builds list --limit=30 --format="table(id,createTime,status)"
```
:::

## Decoupling Deployment from Release

A critical architectural distinction in modern delivery pipelines is the separation between technical deployment and functional release.

- **Deployment**: The technical action of installing a specific, verified software artifact into a target runtime environment (such as staging or production).
- **Release**: The business action of making a deployed feature visible, accessible, or active for end users.

By decoupling deployment from release—using mechanisms such as feature flags or dark launching—teams can safely deploy technical changes to production servers at any time without exposing unapproved features to users prematurely.

::: github
A flag that ships turned off can be a repository variable the workflow passes to the application:

```yaml
env:
  FEATURE_CHECKOUT: ${{ vars.FEATURE_CHECKOUT }}
```
:::

::: azure
In Azure Pipelines, the same switch is a pipeline variable with a safe default:

```yaml
variables:
  - name: FEATURE_CHECKOUT
    value: "false"
```
:::

::: aws
In an AWS CodeBuild buildspec, it is an environment variable:

```yaml
version: 0.2
env:
  variables:
    FEATURE_CHECKOUT: "false"
```
:::

::: gcp
In Google Cloud Build, it is a substitution with a default that a trigger can override:

```yaml
substitutions:
  _FEATURE_CHECKOUT: "false"
```
:::

## Across the platforms

`npm ci` instead of `npm install` is what makes the result reproducible: it installs exactly what the lockfile records and fails if the lockfile and `package.json` disagree. Pinning the runtime version, here through an `.nvmrc` file or a version in `runtime-versions`, keeps a CI image update from silently changing the build.

## Common mistakes

- **Equating CI with automated scripts**: Running a pipeline on isolated branches once a month is automated building, not Continuous Integration. CI requires frequent integration into the main branch.
- **Conflating Deployment with Release**: Assuming every technical deployment instantly exposes new features to customers forces teams into stressful, high-risk production releases.
- **Ignoring broken builds**: Leaving a broken build in the main pipeline degrades trust and blocks the entire team from integrating safely.

## In practice

Try it in a repository of your own, using the platform you chose above.

1. Add the CI job from the examples so that it installs, lints and tests on every push to the main branch and on every pull request into it.
2. Break a test on purpose in a branch, open the pull request and read the failure in the pipeline. Note how long it took to tell you.
3. Fix it and merge only when the check is green.

Then solve the challenge in the language you prefer: it models the rules the pipeline applied.

## Check yourself

1. What is the minimum recommended frequency for developers to integrate code into the main repository in Continuous Integration?
2. Name two DORA metrics that measure the throughput of software delivery.
3. What is the fundamental difference between technical deployment and functional release?
