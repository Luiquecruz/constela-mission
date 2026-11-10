# Reviewing an Infrastructure Plan

A pull request that changes infrastructure is only as safe as its review, and the diff of a template tells little about what the cloud will do. The plan tells: it lists every resource the tool will create, change or destroy. This lesson puts the plan in the pipeline: a job produces it on every pull request, a second job reads it with rules, and the apply happens only after the merge and any approval the plan requires.

You need: Planning Infrastructure Changes

## Case study

An engineer at a code hosting company ran a command to delete a directory on a database server while trying to fix replication, and ran it on the wrong machine, the primary. Backups that should have helped were not usable. The incident is a classic example of a destructive operation that nobody reviewed before it ran. Reading a plan for deletes and replacements, and stopping the pipeline on them, is the review that this lesson automates.

## A Pipeline With Two Phases

Infrastructure pipelines separate looking from doing. On a pull request the pipeline runs `plan`, publishes the result for review and stops. After the merge, a protected job applies the plan that was reviewed. Terraform supports this with a saved plan, and its detailed exit code lets a script tell an empty plan from one with changes:

```bash
terraform init -input=false
terraform plan -input=false -detailed-exitcode -out=tfplan
terraform show -json tfplan > plan.json
```

The exit code is 0 when the plan is empty, 1 on error and 2 when changes are present. The `plan.json` file is what a policy reads. In the JSON, each entry of `resource_changes` has an `address`, a `type` and a `change` with the list of `actions` (`create`, `update`, `delete`, `no-op`, `read`, and the pairs `delete, create` and `create, delete` for a replacement) and the `after` values.

## The Workflow

The workflow below is a composition: each step follows the documentation of its action or command, but no vendor publishes this exact file, so treat it as a starting point and adapt the roles, regions and versions to your setup. In GitHub Actions the two phases are two jobs, and the job that applies needs the cloud identity, which it gets from the OIDC token and never from a stored key:

```yaml
name: infrastructure
on:
  pull_request:
    paths: ["infra/**"]
  push:
    branches: [main]
    paths: ["infra/**"]

permissions:
  contents: read

jobs:
  plan:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      id-token: write
    steps:
      - uses: actions/checkout@v7
      - uses: hashicorp/setup-terraform@v4
      - uses: aws-actions/configure-aws-credentials@v6
        with:
          role-to-assume: arn:aws:iam::111122223333:role/terraform-plan
          aws-region: eu-west-1
      - run: terraform -chdir=infra init -input=false
      - run: terraform -chdir=infra plan -input=false -out=tfplan
      - run: terraform -chdir=infra show -json tfplan > plan.json
      - uses: actions/upload-artifact@v7
        with:
          name: plan
          path: plan.json
  apply:
    if: github.ref == 'refs/heads/main'
    needs: plan
    runs-on: ubuntu-latest
    environment: production
    permissions:
      contents: read
      id-token: write
    steps:
      - uses: actions/checkout@v7
      - uses: hashicorp/setup-terraform@v4
      - uses: aws-actions/configure-aws-credentials@v6
        with:
          role-to-assume: arn:aws:iam::111122223333:role/terraform-apply
          aws-region: eu-west-1
      - run: terraform -chdir=infra init -input=false
      - run: terraform -chdir=infra apply -input=false -auto-approve
```

Two roles keep the privileges apart: the planning role can read, and only the applying role can write. The `production` environment holds the job for the approvers configured on it. Azure and Google Cloud follow the same pattern with their own identity step; Azure also offers `az deployment group what-if` for Bicep, and AWS CloudFormation offers change sets, which show the plan and wait for an explicit execution.

::: github
A GitHub Actions job produces the plan as JSON and keeps it as an artifact for the review:

```yaml
jobs:
  plan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
      - uses: hashicorp/setup-terraform@v4
      - run: terraform init -input=false
      - run: terraform plan -input=false -out=tfplan
      - run: terraform show -json tfplan > plan.json
      - uses: actions/upload-artifact@v7
        with:
          name: plan
          path: plan.json
```
:::

::: azure
In Azure Pipelines, an Azure CLI task provides the identity of the service connection, and the script runs the plan and writes it as JSON:

```yaml
- task: AzureCLI@2
  inputs:
    azureSubscription: infra-plan
    scriptType: bash
    scriptLocation: inlineScript
    inlineScript: |
      terraform init -input=false
      terraform plan -input=false -out=tfplan
      terraform show -json tfplan > plan.json
```
:::

::: aws
In AWS CodeBuild, the buildspec runs the same three commands and keeps the JSON as an artifact:

```yaml
version: 0.2
phases:
  build:
    commands:
      - terraform init -input=false
      - terraform plan -input=false -out=tfplan
      - terraform show -json tfplan > plan.json
artifacts:
  files:
    - plan.json
```
:::

::: gcp
In Google Cloud Build, the same three commands are three steps that share the workspace:

```yaml
steps:
  - id: init
    name: hashicorp/terraform
    args: [init, -input=false]
  - id: plan
    name: hashicorp/terraform
    args: [plan, -input=false, -out=tfplan]
  - id: show
    name: hashicorp/terraform
    entrypoint: sh
    args: ['-c', 'terraform show -json tfplan > plan.json']
```
:::

## What a Policy Looks For

A person reading a long plan will miss the one line that matters, so the rules that never change are code. A plan review looks for three kinds of problem:

- **Destruction of data**: deleting or replacing a database, a bucket or a disk. These changes are allowed, but only with a person's approval.
- **Missing metadata**: resources without the tags that say who owns them and what they cost.
- **Exposure**: resources that a plan would make reachable from the internet.

Each rule has a severity. Exposure and missing tags break the team's policy and block the plan; destruction needs approval. The result is a decision (approve, require approval or reject) plus the list of findings that explain it, which the pipeline posts on the pull request.

## State in the Pipeline

The plan and apply jobs must use the same remote state, with locking, or two runs could apply at once. The state can contain secrets, so access to it is as restricted as access to production. The applying job should apply the plan that was reviewed, or at least refuse to run when the plan it computes differs from the reviewed one; otherwise a change that lands between review and merge reaches production unseen.

## Common mistakes

- **Giving the plan job write permissions**: a plan runs on every pull request, including from branches that anyone can push, so its cloud role must be able to read and nothing else.
- **Applying automatically on every merge without approval for destruction**: a replaced database is applied as quickly as a changed tag.
- **Trusting the summary line**: the plan says "1 to add, 1 to destroy" and the reviewer approves a rename that deletes a bucket with data.

## In practice

Try it in a repository of your own.

1. Add a job that produces the plan as JSON on every pull request.
2. Change a resource so that it is replaced and read what the plan says about it.
3. Decide which changes block automatically and which need a person.

The challenge reviews a plan and returns the decision.

## Check yourself

1. Why does the pipeline split planning and applying into two jobs with different cloud roles?
2. Which actions in a plan mean that a resource will be replaced?
3. Why is a missing tag a rejection while a protected deletion only requires approval?
