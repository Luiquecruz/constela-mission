# Modeling Branch Policies and Pipeline Triggers

Automated CI/CD pipelines rely on branch protection policies and event trigger evaluations to govern how code changes move from development to production environments. Enforcing strict automated checks before code merges into the main branch ensures repository integrity and prevents untested code from reaching deployment pipelines.

You need: Branching Strategies for CI/CD

## Branch Protection Policies

Branch protection policies define mandatory rules that must be satisfied before code can be merged into protected branches (such as `main`). Essential policy checks include:

- **Require Pull Request Reviews**: Mandatory peer approval (e.g., minimum of 1 or 2 reviewer approvals) before merging.
- **Require Status Checks to Pass**: Automated CI build, unit test, and linting jobs must succeed before merge authorization.
- **Enforce Commit Hygiene**: Blocking force-pushes and requiring linear commit histories to preserve auditability.
## Pipeline Trigger Evaluation

Pipelines execute in response to version control events. The event type dictates which pipeline stages should run:

- **`pull_request` Events**: Trigger fast validation stages (linting, unit tests, security scans). Code is tested in a temporary sandbox state.
- **`push` Events on `main`**: Trigger integration stages, artifact packaging, digest generation, and deployment triggers.
- **`tag` / Release Events**: Trigger release packaging and production deployment workflows.

Evaluating trigger conditions correctly prevents expensive deployment stages from running during unreviewed PR branches.
## Declaring Triggers in Each Provider

The same three triggers cover most pipelines: validate every pull request into `main`, build every push to `main`, and release from version tags.

GitHub Actions:

```yaml
on:
  pull_request:
    branches: [main]
  push:
    branches: [main]
    tags: ["v*"]
```

Azure Pipelines, for a GitHub or Bitbucket repository; for Azure Repos, pull request validation is configured as a build validation branch policy on `main` instead of the `pr` key:

```yaml
trigger:
  branches:
    include: [main]
  tags:
    include: ["v*"]

pr:
  branches:
    include: [main]
```

AWS CodeBuild filters GitHub webhook events with filter groups. A build starts when every filter in at least one group matches; patterns are regular expressions:

```json
[
  [
    { "type": "EVENT", "pattern": "PULL_REQUEST_CREATED, PULL_REQUEST_UPDATED, PULL_REQUEST_REOPENED" },
    { "type": "BASE_REF", "pattern": "^refs/heads/main$" }
  ],
  [
    { "type": "EVENT", "pattern": "PUSH" },
    { "type": "HEAD_REF", "pattern": "^refs/(heads/main|tags/v.*)$" }
  ]
]
```

Google Cloud Build defines triggers on the project, not in the repository. The command below starts a build for pushes to `main` and for version tags; a pull request trigger uses the same build file but is configured with the pull request event, in the console or through the API field `pullRequest`:

```bash
gcloud builds triggers create github \
  --name=ci-main \
  --repository=projects/PROJECT_ID/locations/REGION/connections/CONNECTION_NAME/repositories/REPO_NAME \
  --branch-pattern='^main$' \
  --build-config=cloudbuild.yaml \
  --region=REGION
```

Use `--tag-pattern` instead of `--branch-pattern` for a tag trigger.

The trigger only starts the checks. What blocks a merge is the protection on the target branch: required status checks and required reviewers in a GitHub ruleset, or required reviewers and build validation in an Azure Repos branch policy. A check that runs but is not required can fail without stopping anything.

## Applying Trigger Filters in AWS CodeBuild

The filter groups of the webhook live in a file, and one command attaches them to the CodeBuild project:

```bash
aws codebuild create-webhook --project-name api-service --filter-groups file://filters.json
```

## Common mistakes

- **Allowing unreviewed PR merges**: Disabling required review approvals allows unverified or malicious code into `main`.
- **Triggering production deploys on all branches**: Failing to restrict deployment triggers causes accidental deployments from unvalidated feature branches.
- **Bypassing status checks for admins**: Granting administrator exceptions to branch protection rules introduces single points of failure. A rule that some people can skip is not a rule the pipeline can rely on.

## In practice

An engineering organization needs an automated evaluator to validate branch protection policies and determine pipeline execution actions based on incoming Git events.

The evaluator inspects event payloads (such as target branch, review count, status check results) and determines whether a pull request can be merged or if a deployment pipeline should be triggered.

## Check yourself

1. Why must status checks pass before a Pull Request is merged into `main`?
2. What pipeline stages should run on a `pull_request` event versus a `push` event to `main`?
3. What is the security risk of allowing administrators to bypass branch protection rules?
