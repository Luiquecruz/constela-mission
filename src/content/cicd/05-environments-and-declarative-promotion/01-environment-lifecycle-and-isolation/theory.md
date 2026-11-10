# Environment Lifecycle and Isolation

An environment in continuous delivery is an execution runtime configured to host a specific operational stage of a software application. A mature deployment pipeline manages multiple distinct environments across the software lifecycle, maintaining strict network, configuration, and security isolation between development, testing, staging, and production tiers.

You need: Implementing Pipeline Validation and Quality Gates

## Case study

Heroku introduced review apps: every pull request gets its own short-lived copy of the application, created from the branch and removed when the pull request closes. Reviewers click a link and see the change running, and no shared staging environment is blocked while someone tests. The pattern spread to most platforms because it removes a queue. It also needs rules, such as isolation from production data and automatic cleanup, which is what the lifecycle in this lesson models.

## Environment Lifecycles: Persistent versus Ephemeral

Software delivery architectures utilize two primary lifecycle patterns for environments:

- **Persistent Environments**: Long-lived environments with permanent network addresses and dedicated server infrastructure. Standard persistent environments include:
  - **Staging / Homologation**: A production-like environment used for pre-release validation, integration testing, and performance benchmarking.
  - **Production**: The live runtime environment serving real customer workloads and business transactions.
- **Ephemeral (Preview) Environments**: Short-lived, dynamically provisioned environments created automatically when a Pull Request is opened. Ephemeral environments allow developers and reviewers to test application changes in an isolated runtime environment. Once the PR is merged or closed, the ephemeral environment and its underlying resources are automatically destroyed.

Ephemeral preview environments accelerate code review feedback without cluttering persistent staging servers.

::: github
A preview environment is created when a pull request opens, updated when it changes and removed when it closes. In GitHub Actions the three moments are the activity types of the `pull_request` event, and the environment gets its name from the pull request number:

```yaml
on:
  pull_request:
    types: [opened, synchronize, reopened, closed]

jobs:
  preview:
    if: github.event.action != 'closed'
    runs-on: ubuntu-latest
    steps:
      - run: ./deploy-preview.sh "preview-pr-${{ github.event.number }}"
  cleanup:
    if: github.event.action == 'closed'
    runs-on: ubuntu-latest
    steps:
      - run: ./teardown-preview.sh "preview-pr-${{ github.event.number }}"
```
:::

::: azure
On Azure, a deployment slot of the web app can hold the preview:

```bash
az webapp deployment slot create --name api-service --resource-group apps --slot pr-42
az webapp deployment slot delete --name api-service --resource-group apps --slot pr-42
```
:::

::: aws
The same idea maps to each cloud with a resource that is cheap to create and delete. On AWS, a CloudFormation stack per pull request is removed with one command when the pull request closes:

```bash
aws cloudformation deploy --stack-name preview-pr-42 --template-file template.yaml
aws cloudformation delete-stack --stack-name preview-pr-42
```
:::

::: gcp
On Google Cloud, Cloud Run can deploy a revision with a tag that gets its own URL and no production traffic:

```bash
gcloud run deploy api-service --image IMAGE --tag pr-42 --no-traffic
```
:::

## Strict Environment Isolation and Security Boundaries

Mixing credentials or network connectivity between environments creates severe operational and security vulnerabilities. A breach in a development environment must never allow lateral movement into production databases.

Key isolation controls include:

- **Identity and Credential Separation**: Production IAM roles and database credentials must never be accessible from non-production pipelines or developer workstations.
- **Network Segmentation**: Production runtime environments must reside in dedicated Virtual Private Clouds (VPCs) or isolated Kubernetes namespaces with strict ingress/egress network policies.
- **Data Isolation**: Production customer data must never be copied into staging or development environments without automated sanitization and data masking.

::: github
In GitHub Actions, an environment holds its own secrets and protection rules, so a job for staging cannot read the secrets of production:

```yaml
jobs:
  deploy-staging:
    runs-on: ubuntu-latest
    environment: staging
    steps:
      - run: ./deploy.sh staging
        env:
          API_TOKEN: ${{ secrets.API_TOKEN }}
```
:::

::: azure
In Azure Pipelines, an environment scopes the approvals and the service connection a deployment can use:

```yaml
jobs:
  - deployment: staging
    environment: staging
    strategy:
      runOnce:
        deploy:
          steps:
            - script: ./deploy.sh staging
```
:::

::: aws
On AWS, the strongest boundary is a separate account per environment, reached with its own profile:

```bash
aws sts get-caller-identity --profile staging
```
:::

::: gcp
On Google Cloud, the boundary is a separate project per environment:

```bash
gcloud run deploy api-service --image IMAGE --project PROJECT_STAGING --region REGION
```
:::

## Eliminating Environment Branching (The Git Overlays Pattern)

A common architectural antipattern is maintaining long-lived permanent Git branches for each environment (e.g., permanent `dev`, `staging`, and `prod` branches). Environment branches inevitably diverge, leading to complex merge conflicts and unverified hotfixes.

High-performing teams maintain a single primary Git branch (`main`) for application code. Environment variations are managed using declarative configuration overlays (such as Kustomize overlays or Helm values directories):

- `apps/my-app/base/`: Contains common manifest templates and container image specs.
- `apps/my-app/overlays/staging/`: Contains staging-specific replica counts, domain URLs, and environment variables.
- `apps/my-app/overlays/production/`: Contains production-specific resource limits and high-availability settings.

Promoting a change to an environment involves modifying its declarative configuration overlay in Git rather than merging long-lived branches.

When the same application runs in several environments, keep one base and a small overlay per environment instead of one long-lived branch per environment. With Kustomize, the base describes the application and an overlay changes only what differs:

```yaml
# base/kustomization.yaml
resources:
  - deployment.yaml
  - service.yaml
```

```yaml
# overlays/staging/kustomization.yaml
resources:
  - ../../base
patches:
  - target:
      kind: Deployment
      name: api-service
    patch: |-
      - op: replace
        path: /spec/replicas
        value: 2
```

::: github
Every environment is a directory of overlays, and every pipeline applies the one it targets. In GitHub Actions:

```yaml
- run: kubectl apply -k overlays/staging
```
:::

::: azure
In Azure Pipelines:

```yaml
- script: kubectl apply -k overlays/staging
  displayName: Apply the overlay
```
:::

::: aws
In AWS CodeBuild:

```yaml
version: 0.2
phases:
  build:
    commands:
      - kubectl apply -k overlays/staging
```
:::

::: gcp
In Google Cloud Build:

```yaml
steps:
  - name: ubuntu
    entrypoint: bash
    args: ['-c', 'kubectl apply -k overlays/staging']
```
:::

## Across the platforms

A pool limit and a teardown rule are what keep previews from becoming a bill nobody owns. Credentials matter as much: a preview of a pull request from a fork must not receive the secrets or the cloud identity that a production deploy has.

`kubectl apply -k overlays/staging` renders and applies that environment. Promoting a release then edits one overlay file, which is a reviewable commit on `main`.

## Common mistakes

- **Maintaining permanent Git branches per environment**: Using `staging` and `production` Git branches causes configuration drift and merge conflicts.
- **Sharing credentials between staging and production**: Reusing cloud credentials across environments exposes production resources to non-production pipeline risks.
- **Copying raw production databases to staging**: Exposing unmasked customer data to non-production environments violates security compliance rules. Use synthetic or masked data instead.

## In practice

Try it in a repository of your own.

1. Create an environment per pull request with the examples of your platform and a name that contains the number of the pull request.
2. Open and close a pull request and check that the environment is created and removed.
3. Confirm that it cannot reach production data.

The challenge manages the lifecycle of such environments.

## Check yourself

1. What is the primary operational difference between a persistent environment and an ephemeral preview environment?
2. Why is sharing IAM credentials between staging and production considered a critical security vulnerability?
3. How does the Git configuration overlays pattern eliminate the need for permanent environment branches?
