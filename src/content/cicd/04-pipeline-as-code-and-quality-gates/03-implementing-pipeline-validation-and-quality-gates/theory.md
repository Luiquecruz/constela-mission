# Implementing Pipeline Validation and Quality Gates

Enforcing pipeline quality gates requires building policy engines capable of evaluating pipeline stage results, test coverage metrics, security findings, and peer approval status against configured rules. Modeling a quality gate engine in TypeScript provides practical understanding of automated gate evaluation and flow control governance.

You need: Quality Gates and Policy as Code

## Case study

During routine maintenance at a large social network, a command meant to assess backbone capacity took down the connections between its data centers, and the services went offline for hours. The tool that should have stopped such a command had a bug that let it through. Safety checks fail like any other code, and they need the same care as the rest: a guard that can be bypassed must leave a record, and the bypass path must be as controlled as the gate.

## Quality Gate Metrics and Policy Rule Structures

A quality gate engine ingests execution telemetry from completed pipeline jobs and tests them against policy rules:

- **Coverage Rules**: Verifying that statement and branch coverage percentages meet minimum configured thresholds (e.g., `lineCoverage >= 80`).
- **Vulnerability Rules**: Checking scan result counts against severity limits (e.g., `criticalVulnerabilities === 0`).
- **Review and Approval Rules**: Verifying that mandatory status checks passed and review approval counts meet policy criteria.

If all policy rule checks pass, the quality gate returns a status of `PASSED` with authorization to proceed to deployment. If any rule fails, the gate returns `BLOCKED` with explicit failure reason messages.

::: github
The metric becomes a gate when the tool exits with an error below the threshold. With a coverage limit of eighty percent, in GitHub Actions:

```yaml
- run: npx vitest run --coverage --coverage.thresholds.lines=80
```
:::

::: azure
In Azure Pipelines:

```yaml
- script: npx vitest run --coverage --coverage.thresholds.lines=80
  displayName: Coverage gate
```
:::

::: aws
In AWS CodeBuild:

```yaml
version: 0.2
phases:
  build:
    commands:
      - npx vitest run --coverage --coverage.thresholds.lines=80
```
:::

::: gcp
In Google Cloud Build:

```yaml
steps:
  - name: ubuntu
    entrypoint: bash
    args: ['-c', 'npx vitest run --coverage --coverage.thresholds.lines=80']
```
:::

## Policy Override and Audit Trail

In emergency production remediation scenarios (hotfixes), organizations may permit a controlled policy override.

To maintain security compliance during an override:

- **Audited Justification**: The override request must provide a non-empty written justification string.
- **Override Logging**: The gate evaluator records an audit log containing the timestamp, author, and justification.
- **Restricted Authorization**: Overrides are permitted only when explicitly enabled by policy configuration (`allowOverride: true`).

::: github
Most of what the challenge models already exists in the providers, as settings rather than code.

The break-glass path is the part teams forget. If a blocked release can be forced through, the pipeline must still make the decision visible. A workflow can require a justification as an input, refuse to run without it and write it to the run summary, where it stays with the run:

```yaml
on:
  workflow_dispatch:
    inputs:
      justification:
        description: Why this release bypasses the gate
        required: true
        type: string

jobs:
  emergency-deploy:
    runs-on: ubuntu-latest
    environment: production
    steps:
      - name: Record the override
        env:
          ACTOR: ${{ github.actor }}
          JUSTIFICATION: ${{ inputs.justification }}
        run: |
          echo "Override by $ACTOR: $JUSTIFICATION" >> "$GITHUB_STEP_SUMMARY"
```
:::

::: azure
Azure Pipelines can require a justification as a runtime parameter, and the run keeps the value with its history:

```yaml
trigger: none

parameters:
  - name: justification
    type: string

pool:
  vmImage: ubuntu-latest

steps:
  - script: echo "Override reason: $JUSTIFICATION"
    env:
      JUSTIFICATION: ${{ parameters.justification }}
    displayName: Record the override
```
:::

::: aws
AWS CodePipeline keeps the approver and the comment of a manual approval action, and the action can carry a message for the reviewer:

```json
{
  "name": "EmergencyApproval",
  "actionTypeId": { "category": "Approval", "owner": "AWS", "provider": "Manual", "version": "1" },
  "configuration": { "CustomData": "Release bypasses the gate. State the incident in your comment." },
  "runOrder": 1
}
```
:::

::: gcp
Google Cloud Build takes the justification as a substitution, which is stored with the build:

```bash
gcloud builds submit --config=cloudbuild.yaml \
  --substitutions=_JUSTIFICATION="incident 42: hotfix for checkout"
```
:::

## Across the platforms

Azure Pipelines records approvals and who gave them in the environment's history, and AWS CodePipeline stores the approver and the comment of a manual approval action. Whatever the provider, an override record should answer four questions without asking anyone: who, why, when and what was bypassed. Keep the time as an input rather than reading a clock deep inside the logic, so the same decision can be replayed in a test.

## Common mistakes

- **Failing to collect all gate violation reasons**: Halting policy evaluation on the first failure prevents developers from seeing all issues requiring remediation.
- **Allowing unrecorded policy overrides**: Permitting quality gate overrides without requiring an audited justification string breaks compliance auditability.
- **Evaluating quality gates against stale scan data**: Running policy evaluation against outdated scan results allows newly introduced vulnerabilities into production.

## In practice

Try it in a repository of your own.

1. Add a manual run of the release that requires a written reason and stores it with the run.
2. Use it once on a test release and find that record afterwards, answering who, why, when and what was bypassed.
3. Decide who is allowed to start it.

The challenge applies an emergency override to a failed gate and keeps the audit trail.

## Check yourself

1. What fields are evaluated when checking a pipeline execution against quality gate policy rules?
2. What condition must be met to grant a valid emergency policy override?
3. Why should a quality gate evaluator return all failure reasons rather than stopping at the first error?
