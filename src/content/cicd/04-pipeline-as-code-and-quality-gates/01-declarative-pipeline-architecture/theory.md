# Declarative Pipeline Architecture

Pipeline as Code is an engineering practice where pipeline workflow definitions, job specifications, and execution parameters are written in version-controlled text files stored directly alongside application source code. Rather than configuring build steps manually in a graphical web console, teams manage their software delivery pipelines using declarative manifests subjected to code reviews, pull requests, and automated testing.

You need: Modeling an Immutable Artifact Registry

## Case study

Travis CI popularized a simple idea: the pipeline is a file in the repository, declared rather than clicked together in a server's interface. The build then lives with the code, is reviewed in pull requests and can be copied to a new project. Every provider in this lesson followed it. The next step, which large teams take, is to share the common parts through templates or reusable workflows so that hundreds of repositories follow one reviewed path.

## Declarative versus Imperative Pipeline Definitions

Pipeline specifications generally fall into two modeling paradigms:

- **Imperative Pipelines**: Defined as sequential shell scripts or procedural execution commands instructing the build server on *how* to perform each action. Imperative pipelines lack structure, accumulate hidden execution state, and are difficult to validate statically before execution.
- **Declarative Pipelines**: Defined as structured data manifests (such as YAML or JSON) specifying *what* state or outputs are required. Declarative engines interpret the manifest, validate schema correctness, resolve task dependencies into Directed Acyclic Graphs (DAGs), and execute jobs in clean, isolated runners.

Declarative architectures enforce consistency across teams by providing standardized building blocks and reusable workflow templates maintained by platform engineering groups.

::: github
Keep the logic in a script the repository owns, and let the pipeline file only say when and where to run it. In GitHub Actions:

```yaml
- run: ./scripts/build.sh
```
:::

::: azure
In Azure Pipelines:

```yaml
- script: ./scripts/build.sh
  displayName: Build
```
:::

::: aws
In AWS CodeBuild:

```yaml
version: 0.2
phases:
  build:
    commands:
      - ./scripts/build.sh
```
:::

::: gcp
In Google Cloud Build:

```yaml
steps:
  - name: ubuntu
    entrypoint: bash
    args: ['-c', './scripts/build.sh']
```
:::

## Pipeline-Based Access Control (PBAC) and Security (CICD-SEC-5)

Storing pipeline configurations as code inside version-controlled repositories introduces unique security implications mapped under **OWASP CICD-SEC-5 (Insufficient Pipeline-Based Access Control)**.

If access controls are misconfigured, unauthorized users can modify pipeline code definitions in a Pull Request to execute malicious commands, exfiltrate environment secrets, or alter deployment target destinations.

Key security practices for Pipeline as Code include:

- **Strict Branch Protection**: Requiring mandatory code review approvals on all changes made to pipeline definition files (e.g., `.github/workflows/` or `.gitlab-ci.yml`).
- **Workflow Execution Isolation**: Restricting dangerous events (such as `pull_request_target`) from executing unreviewed code submitted from external repository forks.
- **Least Privilege Runner Scopes**: Assigning minimal IAM permissions to pipeline execution jobs, ensuring that test jobs cannot access production deployment credentials.

::: github
Give the workflow only the permissions its jobs need:

```yaml
permissions:
  contents: read

jobs:
  test:
    runs-on: ubuntu-latest
```
:::

::: azure
In Azure Pipelines, permissions come from the service connection that a task names, so use one with a narrow role:

```yaml
- task: AzureCLI@2
  inputs:
    azureSubscription: ci-readonly
    scriptType: bash
    scriptLocation: inlineScript
    inlineScript: az group list
```
:::

::: aws
In AWS CodeBuild, the permissions are those of the service role of the project, so attach a role that allows only what the build does:

```bash
aws codebuild update-project --name api-service --service-role arn:aws:iam::ACCOUNT_ID:role/api-service-build
```
:::

::: gcp
In Google Cloud Build, run the build as a service account that has only the roles it needs:

```yaml
serviceAccount: projects/PROJECT_ID/serviceAccounts/ci-build@PROJECT_ID.iam.gserviceaccount.com
options:
  logging: CLOUD_LOGGING_ONLY
steps:
  - name: node
    entrypoint: npm
    args: [test]
```
:::

## Reusable Workflows and Golden Paths

To prevent every engineering team from reinventing build scripts, platform engineering teams provide **Reusable Workflows** (or Golden Paths). Reusable workflows encapsulate organization-wide security scans, build conventions, and compliance steps into standardized, versioned templates.

Application teams reference these shared templates in their declarative manifests, guaranteeing that security quality gates and provenance generation steps run automatically across all company projects.
::: github
Pipeline code grows like any code, and the same fix applies: put the shared part in one place and call it with parameters. GitHub Actions calls a reusable workflow from another file or repository, passing inputs and secrets:

```yaml
# .github/workflows/ci.yml in the shared repository
on:
  workflow_call:
    inputs:
      node-version:
        required: true
        type: string
```

```yaml
# a service repository
jobs:
  ci:
    uses: org/platform/.github/workflows/ci.yml@main
    with:
      node-version: lts/*
    secrets: inherit
```
:::

::: azure
Azure Pipelines inserts a template with parameters, and a template stored in another repository is pinned to a ref:

```yaml
# templates/npm-with-params.yml
parameters:
  - name: name
    default: ""
jobs:
  - job: ${{ parameters.name }}
    steps:
      - script: npm ci
      - script: npm test
```

```yaml
# azure-pipelines.yml
resources:
  repositories:
    - repository: templates
      type: github
      name: org/build-templates
      ref: refs/tags/v1.0

jobs:
  - template: npm-with-params.yml@templates
    parameters:
      name: Linux
```

Azure Pipelines keeps the shared logic in a template file and passes parameters to it:

```yaml
# templates/test.yml
parameters:
  - name: nodeVersion
    type: string
    default: "20"
steps:
  - script: echo "Node ${{ parameters.nodeVersion }}"
  - script: npm ci && npm test
```

```yaml
# azure-pipelines.yml
steps:
  - template: templates/test.yml
    parameters:
      nodeVersion: "22"
```
:::

::: aws
AWS CodeBuild can start a build with a buildspec other than the one in the repository, which lets a platform team keep a shared buildspec in one place:

```bash
aws codebuild start-build \
  --project-name api-service \
  --buildspec-override shared/buildspec.yml
```
:::

::: gcp
Google Cloud Build parameterizes one build file with substitutions. A user-defined substitution starts with an underscore, and the trigger or the command line supplies its value:

```yaml
substitutions:
  _NODE_VERSION: "20"
steps:
  - name: node:${_NODE_VERSION}
    entrypoint: npm
    args: [ci]
  - name: node:${_NODE_VERSION}
    entrypoint: npm
    args: [test]
```
:::

## Across the platforms

Google Cloud Build keeps one `cloudbuild.yaml` per pipeline and varies it with substitutions that a trigger fills in, and AWS CodeBuild takes the buildspec from the repository or from the project definition, so a platform team can own the project and each service the buildspec. What the four have in common is the part the challenge isolates: different files, the same neutral graph of tasks, dependencies and commands.

The reusable pieces are also where access control matters. A workflow or template that anyone can edit becomes a way to run code with the pipeline's credentials, so changes to shared pipeline code should require review and be pinned by tag or commit.

## Common mistakes

- **Allowing unreviewed edits to pipeline definition files**: Permitting developers to push unreviewed changes to workflow YAML files enables secret exfiltration and security bypasses.
- **Using imperative shell scripts inside declarative steps**: Inlining long, untracked bash scripts inside YAML pipeline files negates schema validation and increases maintenance debt.
- **Granting elevated credentials to all pipeline jobs**: Assigning administrative credentials to the entire pipeline runner instead of restricting credentials to specific deployment jobs violates least privilege.

## In practice

Try it in a repository of your own.

1. Move the common steps, such as install, lint and test, into a shared file or template.
2. Call it from two services with different parameters.
3. Change the shared file once and see both services pick it up on the next run.

The challenge normalizes a pipeline definition into the common shape that such a template produces.

## Check yourself

1. What is the fundamental difference between declarative and imperative pipeline configurations?
2. Which OWASP risk category covers security vulnerabilities arising from insufficient access controls on pipeline definition files?
3. How do reusable workflows (Golden Paths) help enforce compliance across multiple engineering teams?
