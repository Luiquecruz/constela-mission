# Capstone: the Release Check

A release is safe when several independent checks agree, and a pipeline is trustworthy when it runs them in an order where a failure is explained by the stage that raised it. This capstone assembles the course into one release check: build order, quality gate, workload identity, provenance and promotion.

You need: Pipeline Observability, DORA Metrics, and SRE

## Case study

Netflix built Spinnaker to give hundreds of teams one way to deliver software: a pipeline with stages for the build, the checks, the canary analysis and the promotion, with the same safety rules for all. What each team writes is small, and the platform enforces the order and the gates. The release check you build in this lesson is the same shape: facts go in, the stages run in order, and the result says whether the release may continue.

## The Stages and Their Order

The five stages run from the cheapest and most local to the most consequential:

1. **Build**: the tasks and their dependencies form a graph that must be resolvable. A cycle or an unknown dependency is a defect of the pipeline itself.
2. **Gate**: facts about the change, such as coverage and open critical vulnerabilities, are compared with declarative rules. Every failed rule is reported at once.
3. **Identity**: the job proves who it is with a short-lived workload identity token, and the check compares issuer, audience, expiration and subject with the trust policy.
4. **Provenance**: the artifact about to be released must be one the trusted builder produced: its digest appears among the subjects of the provenance, and the builder is on the trusted list.
5. **Promotion**: the artifact moves to an environment only after the previous environment verified the same digest, and the result is a pinned manifest patch committed to Git.

Failing fast is a design decision. The first failing stage is the one to fix; later stages would add noise, and some of them, such as asking for cloud credentials, should not run at all for a release that already failed a check.

::: github
The stages map to jobs, and the dependencies between jobs enforce the order. In GitHub Actions:

```yaml
name: release
on:
  push:
    branches: [main]

permissions:
  contents: read

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
      - run: npm ci
      - run: npm test
  gate:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
      - run: conftest test facts.json --policy policy/ --namespace pipeline
  provenance:
    needs: gate
    runs-on: ubuntu-latest
    permissions:
      contents: read
      id-token: write
      attestations: write
    steps:
      - uses: actions/checkout@v7
      - run: make dist
      - uses: actions/attest@v4
        with:
          subject-path: dist/api-service.tar.gz
  promote:
    needs: provenance
    runs-on: ubuntu-latest
    environment: production
    permissions:
      contents: read
      id-token: write
    steps:
      - run: gh attestation verify dist/api-service.tar.gz -R org/api-service
      - run: ./open-promotion-pull-request.sh production
```
:::

::: azure
Azure Pipelines expresses the stages as stages with `dependsOn`, and the production stage targets an environment with approvals:

```yaml
stages:
  - stage: build
    jobs:
      - job: build
        steps:
          - script: npm ci && npm test
  - stage: gate
    dependsOn: build
    jobs:
      - job: gate
        steps:
          - script: conftest test facts.json --policy policy/ --namespace pipeline
  - stage: promote
    dependsOn: gate
    jobs:
      - deployment: promote
        environment: production
        strategy:
          runOnce:
            deploy:
              steps:
                - script: ./open-promotion-pull-request.sh production
```
:::

::: aws
AWS CodePipeline lists the stages in order, with the approval action before promotion:

```json
{
  "stages": [
    { "name": "Source", "actions": [] },
    { "name": "Build", "actions": [] },
    { "name": "Gate", "actions": [] },
    { "name": "Approve", "actions": [] },
    { "name": "Promote", "actions": [] }
  ]
}
```

The gate and the promotion step each run as a CodeBuild action. The gate project uses this buildspec:

```yaml
version: 0.2
phases:
  build:
    commands:
      - conftest test facts.json --policy policy/ --namespace pipeline
```
:::

::: gcp
Google Cloud Build runs steps one after another by default, so the order of the stages is the order of the steps:

```yaml
steps:
  - id: build
    name: node
    entrypoint: npm
    args: [test]
  - id: gate
    name: openpolicyagent/conftest
    args: [test, facts.json, --policy, policy/, --namespace, pipeline]
  - id: promote
    name: gcr.io/cloud-builders/gcloud
    args: [deploy, releases, create, release-2041, --delivery-pipeline=api-service, --region=REGION]
```
:::

## Building the Orchestrator

The orchestrator itself is small, and that is the lesson: the value is in the blocks it joins and in the discipline of the order. It keeps a list of the stages that passed, turns the errors of the blocks into reasons, and returns one report that answers four questions: did the release go out, which stage decided it, which stages came before, and what did the stage say.

## Across the platforms

| Stage | GitHub Actions | Azure Pipelines | AWS | Google Cloud |
| --- | --- | --- | --- | --- |
| Build order | `needs` between jobs | `dependsOn` between jobs | CodePipeline stages, buildspec phases | Cloud Build `waitFor` |
| Gate | policy step, branch rules | policy step, branch policies | CodeBuild step, manual approval | Cloud Build step, trigger approval |
| Identity | OIDC token, `id-token: write` | workload identity service connection | IAM role for web identity | workload identity federation |
| Provenance | `actions/attest` | signing step | signing step | Cloud Build build provenance |
| Promotion | environment with reviewers | environment approvals | CodeDeploy, approval action | Cloud Deploy delivery pipeline |

## Common mistakes

- **Running the checks out of order**: asking for cloud credentials before the gate passes spends a short-lived token on a release that was already going to be rejected.
- **Reporting only the first symptom of a stage**: a gate that stops at its first failed rule makes the team fix and rerun several times; collect every failed rule of the stage.
- **Letting an exception escape the orchestrator**: a build graph with a cycle is a rejection with a reason, not a crash of the pipeline controller.

## In practice

Try it in a repository of your own.

1. Combine what you built in the previous lessons: build, test, gate, promotion by digest and a record of the deployment.
2. Run a release that passes and another that fails the gate, and read the result of each.
3. Write what a person would need to see to trust the result.

The capstone challenge puts the stages in order and decides whether the release continues.

## Check yourself

1. Why does the release check stop at the first failing stage instead of running every stage?
2. Which stage would catch an artifact that was built on a developer laptop, and what does it compare?
3. What does a rejection report need to contain so that a developer knows what to fix?
