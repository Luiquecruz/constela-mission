# Branching Strategies for CI/CD

A branching strategy defines how developers use version control to collaborate, manage concurrent feature work, and integrate changes into production. In automated CI/CD pipelines, the choice of branching strategy directly dictates pipeline complexity, integration frequency, and risk of deployment failures.

You need: Introduction to Continuous Integration

## Case study

Google's engineering book says that the vast majority of its source lives in a single repository, that everyone is responsible for syncing to trunk and committing, and that development branches should be minimal or very short lived. Nobody carries a branch for weeks, so there is no large merge at the end. The pipeline of such a team is built around frequent, small, verified merges, which is exactly what the branch rules in this lesson protect.

## Comparison of Branching Models

Software engineering teams generally adopt one of three primary branching patterns:

### 1. Trunk-Based Development (TBD)
In Trunk-Based Development, all developers push small, frequent commits to a single central branch (typically named `main` or `trunk`). Short-lived feature branches are permitted only if they are merged back into `main` at least once per day. TBD is the recommended strategy for high-velocity CI/CD pipelines.
### 2. GitHub Flow
GitHub Flow uses short-lived feature branches created off `main`. Developers open a Pull Request (PR) for peer review and automated testing. Once tests pass and approvals are granted, the branch is merged into `main` and immediately deployed to production.
### 3. GitFlow
GitFlow relies on multiple long-lived parallel branches (`main`, `develop`, `release`, `hotfix`). Features are merged into `develop`, accumulated over sprint cycles, moved to a `release` branch for manual QA, and eventually merged into `main`.

Trunk-based development is a habit more than a configuration. A change lives on a branch for hours, is kept close to `main`, and merges as soon as the tests pass, with unfinished behavior hidden behind a flag:

```bash
git switch main
git pull --ff-only
git switch -c feature/checkout-retry

# small commit, pushed the same day
git commit -am "Retry the payment call once on a timeout"
git fetch origin
git rebase origin/main
git push -u origin feature/checkout-retry
```

::: github
A short-lived branch is validated on every push and merged within a day. Each provider expresses that as a trigger on the trunk and on pull requests into it. GitHub Actions:

```yaml
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
```
:::

::: azure
Azure Pipelines, for a GitHub or Bitbucket repository:

```yaml
trigger:
  branches:
    include: [main]
pr:
  branches:
    include: [main]
```
:::

::: aws
AWS CodeBuild filters the webhook events of the repository, here pushes and pull requests whose head reference is `main` or a `feature/` branch:

```json
[
  [
    { "type": "EVENT", "pattern": "PUSH, PULL_REQUEST_CREATED, PULL_REQUEST_UPDATED" },
    { "type": "HEAD_REF", "pattern": "^refs/heads/(main|feature/.*)$" }
  ]
]
```
:::

::: gcp
Google Cloud Build creates a trigger on the project. The command below covers the trunk; the pull request event is chosen when the trigger is configured in the console or through the API:

```bash
gcloud builds triggers create github \
  --name=ci-main \
  --repository=projects/PROJECT_ID/locations/REGION/connections/CONNECTION_NAME/repositories/REPO_NAME \
  --branch-pattern='^main$' \
  --build-config=cloudbuild.yaml \
  --region=REGION
```
:::

## The Hidden Cost of Long-Lived Branches

Long-lived feature branches create significant friction in continuous delivery pipelines. When branches diverge from `main` for weeks:

- **Integration Fear**: Developers delay merging because resolving merge conflicts becomes complex and error-prone.
- **Late Defect Discovery**: Code bugs and architectural incompatibilities remain hidden until the final merge attempt.
- **Pipeline Duplication**: Pipelines must run redundant tests across dozens of isolated branches instead of validating a single unified stream.

Research indicates that high-performing delivery teams avoid long-lived branches and mandate daily code integration.

The flag keeps the code path in `main` without exposing it:

```json
{
  "flags": {
    "checkout-retry": { "enabled": false, "rolloutPercent": 0 }
  }
}
```

::: github
A pipeline can make the cost visible by failing when the branch has fallen too far behind the trunk:

```yaml
- uses: actions/checkout@v7
  with:
    fetch-depth: 0
- run: test "$(git rev-list --count HEAD..origin/main)" -le 20
```
:::

::: azure
In Azure Pipelines, fetch the full history and run the same check:

```yaml
steps:
  - checkout: self
    fetchDepth: 0
  - script: test "$(git rev-list --count HEAD..origin/main)" -le 20
    displayName: Branch is close to main
```
:::

::: aws
In an AWS CodeBuild buildspec, the check is a command of the build phase, with the full history fetched by the source setting `Git clone depth` set to full:

```yaml
version: 0.2
phases:
  build:
    commands:
      - test "$(git rev-list --count HEAD..origin/main)" -le 20
```
:::

::: gcp
In Google Cloud Build, a step that uses the Git builder runs the check:

```yaml
steps:
  - name: gcr.io/cloud-builders/git
    entrypoint: bash
    args: ['-c', 'test "$(git rev-list --count HEAD..origin/main)" -le 20']
```
:::

## Across the platforms

The branch rules a team agrees on, such as allowed prefixes and a maximum branch age, are what an automated check can enforce. The provider only decides when that check runs: a GitHub Actions workflow on `pull_request`, a build validation branch policy on an Azure Repos branch, or an AWS CodeBuild webhook filter on pull request events.

## Common mistakes

- **Maintaining long-lived environment branches**: Creating permanent `dev`, `staging`, and `prod` branches leads to configuration drift and merge conflicts between environments.
- **Bypassing code reviews**: Allowing direct, unreviewed pushes to `main` without status checks bypasses security and quality controls.
- **Lump-sum releases**: Batching weeks of unmerged code into massive release branches invalidates Continuous Integration principles. Feedback arrives late, and the final merge becomes a risky event.

## In practice

Try it in a repository of your own.

1. Set the trigger for the trunk and for pull requests, as in the examples.
2. Create a short branch, push one small change and open a pull request. Measure the time from the first commit to the merge.
3. Write down the branch rule your team would follow, such as allowed prefixes and a maximum age, and check one branch against it by hand.

The challenge turns that rule into code, so run it in your language after the exercise.

## Check yourself

1. What is the core rule regarding branch lifespan in Trunk-Based Development?
2. Why do long-lived feature branches increase deployment risk?
3. Which branching model uses permanent parallel `develop` and `main` branches?
