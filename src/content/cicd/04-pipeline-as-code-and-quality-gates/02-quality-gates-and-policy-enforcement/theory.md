# Quality Gates and Policy as Code

Quality gates are automated validation checkpoints embedded within continuous integration pipelines to enforce organizational standards for code quality, test coverage, security compliance, and policy governance. If a code change fails to satisfy any specified quality gate criteria, the pipeline automatically halts, preventing unverified or non-compliant code from advancing to deployment stages.

You need: Declarative Pipeline Architecture

## Case study

A large bank that suffered a cloud breach caused by a misconfigured firewall had already built an open source tool, Cloud Custodian, to express cloud rules as code and enforce them automatically. Rules written as code can be reviewed, versioned and run on every change, instead of living in a document that people read once. A quality gate works the same way: the policy is code, it runs the same for everyone, and the evidence of each decision is kept.

## The Structure of Quality Gates

A quality gate acts as a policy evaluation engine operating between major pipeline stages (e.g., between commit validation and artifact promotion).

Quality gates evaluate multiple telemetry streams:

- **Static Code Quality and Test Coverage**: Verifying that new code achieves a minimum threshold of unit test coverage (e.g., >= 80%) and introduces zero critical code smells.
- **Security Vulnerability Thresholds**: Ensuring that SAST and SCA scans report zero `critical` or `high` unmitigated vulnerabilities.
- **License and Compliance Checks**: Verifying that open-source dependency licenses conform to legal compliance rules (e.g., blocking restrictive copyleft licenses where required).
- **Branch Protection and Status Check Verification**: Verifying that mandatory peer reviews and required automated status checks have passed.


::: github
A gate is a job that waits for the checks before it:

```yaml
jobs:
  gate:
    needs: [test, scan]
    runs-on: ubuntu-latest
    steps:
      - run: ./gate.sh
```
:::

::: azure
In Azure Pipelines:

```yaml
jobs:
  - job: gate
    dependsOn: [test, scan]
    steps:
      - script: ./gate.sh
```
:::

::: aws
In AWS CodePipeline, the gate is a stage after the checks:

```json
{
  "name": "Gate",
  "actions": [
    {
      "name": "Gate",
      "actionTypeId": { "category": "Build", "owner": "AWS", "provider": "CodeBuild", "version": "1" },
      "configuration": { "ProjectName": "api-service-gate" },
      "inputArtifacts": [{ "name": "SourceOutput" }],
      "runOrder": 1
    }
  ]
}
```
:::

::: gcp
In Google Cloud Build, a step that waits for the checks by their ids:

```yaml
steps:
  - id: gate
    name: ubuntu
    entrypoint: bash
    args: ['-c', './gate.sh']
    waitFor: [test, scan]
```
:::

## Policy as Code (PaC)

Rather than enforcing compliance through manual management sign-offs or wiki documentation, high-performing engineering organizations define compliance rules as executable code using **Policy as Code (PaC)** tools (such as Open Policy Agent / OPA or Kyverno).

Policy as Code enables:

- **Decentralized Evaluation**: Policy rules are evaluated automatically in CI pipelines before infrastructure or applications are provisioned.
- **Version-Controlled Rules**: Security and operational policies are stored in Git, allowing policies to be audited, versioned, and updated via Pull Requests.
- **Deterministic Enforcement**: Eliminates human bias and inconsistent manual approvals during release cycles.

A policy engine is a separate step that reads facts about the release as input and answers allow or deny. Open Policy Agent expresses the rules in Rego, and `conftest test` or `opa eval` runs them in any provider's pipeline:

```rego
package pipeline

import rego.v1

default allow := false

allow if count(deny) == 0

deny contains "Coverage below 80" if input.coverage < 80

deny contains "Critical vulnerabilities present" if input.criticalVulnerabilities > 0

deny contains "Deploys come from main or release" if not input.branch in {"main", "release"}
```

::: github
The policy runs as one step that reads the facts of the release as JSON and fails when the policy denies. In GitHub Actions:

```yaml
- run: conftest test facts.json --policy policy/ --namespace pipeline
```
:::

::: azure
In Azure Pipelines:

```yaml
- script: conftest test facts.json --policy policy/ --namespace pipeline
  displayName: Policy gate
```
:::

::: aws
In AWS CodeBuild:

```yaml
version: 0.2
phases:
  build:
    commands:
      - conftest test facts.json --policy policy/ --namespace pipeline
```
:::

::: gcp
In Google Cloud Build:

```yaml
steps:
  - name: ubuntu
    entrypoint: bash
    args: ['-c', 'conftest test facts.json --policy policy/ --namespace pipeline']
```
:::

## Mitigating Flow Control Inadequacy (CICD-SEC-1)

The **OWASP CICD-SEC-1 (Insufficient Flow Control Mechanisms)** risk highlights scenarios where attackers or unauthorized users bypass quality gates to push code directly to production.

Effective policy enforcement requires multi-party approval controls (*4-eyes principle*):

- **Required Reviewers**: Enforcing mandatory reviews by independent team members.
- **Enforce Admins**: Preventing repository administrators from overriding required status checks or bypassing quality gates.
- **Automated Evidence Collection**: Generating tamper-proof execution logs proving that all required quality gates passed prior to deployment.

::: github
A policy answers automatically; an approval answers with a person. In GitHub Actions, the environment carries the required reviewers:

```yaml
jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: production
    steps:
      - run: ./deploy.sh production
```
:::

::: azure
In Azure Pipelines, a deployment job that targets an environment waits for its approvals and checks:

```yaml
stages:
  - stage: production
    jobs:
      - deployment: release
        environment: production
        strategy:
          runOnce:
            deploy:
              steps:
                - script: ./deploy.sh production
```
:::

::: aws
AWS CodePipeline has a manual approval action:

```json
{
  "name": "ApproveProduction",
  "actionTypeId": { "category": "Approval", "owner": "AWS", "provider": "Manual", "version": "1" },
  "runOrder": 1
}
```
:::

::: gcp
In Google Cloud Build, a trigger can require approval, and a user needs the Cloud Build Approver role to approve or reject the pending build:

```bash
gcloud builds triggers create github \
  --name=release \
  --repository=projects/PROJECT_ID/locations/REGION/connections/CONNECTION_NAME/repositories/REPO_NAME \
  --branch-pattern='^main$' \
  --build-config=cloudbuild.yaml \
  --require-approval \
  --region=REGION
```
:::

## Across the platforms

In Google Cloud Build a trigger can be configured to require approval, and a user needs the Cloud Build Approver role to approve or reject the pending build. In all four, the guarantee is the same: the rule that decides sits outside the code being deployed, so the author of a change cannot edit it away in the same pull request.

## Common mistakes

- **Allowing quality gate overrides without auditing**: Permitting developers to bypass failing quality gates without recording an audited exception reason.
- **Setting unrealistic coverage thresholds overnight**: Imposing an immediate 95% test coverage requirement on legacy codebases leads developers to write low-quality assertion-free tests.
- **Failing to enforce administrator restrictions**: Allowing administrators to bypass branch protection rules creates single-point-of-failure security gaps.

## In practice

Try it in a repository of your own.

1. Write the policy for coverage, vulnerabilities and branch, and run it as a step with the facts of the build.
2. Protect the production environment with a required reviewer.
3. Open a pull request that lowers the coverage and see the policy deny it.

The challenge implements the evaluation of this kind of policy.

## Check yourself

1. What is the primary purpose of an automated quality gate in a CI/CD pipeline?
2. What are the key operational advantages of defining governance rules as Policy as Code?
3. How does enforcing the 4-eyes principle protect against OWASP CICD-SEC-1 vulnerabilities?
