# Pipeline Observability, DORA Metrics, and SRE

Measuring software delivery performance and pipeline operational health requires establishing continuous observability across the delivery lifecycle. The DevOps Research and Assessment (DORA) framework provides quantitative research proving that elite engineering teams achieve high velocity and stability by measuring four core delivery metrics. Integrating Site Reliability Engineering (SRE) principles—such as Service Level Objectives (SLOs) and Error Budgets—into pipeline telemetry ensures that deployment automation maintains system reliability.

You need: OpenGitOps Principles and Pull-Based Reconciliation

## Case study

The research program behind the book Accelerate, led by Nicole Forsgren with Jez Humble and Gene Kim, surveyed thousands of organizations and found that four measures predict how well a software organization performs: deployment frequency, lead time for changes, change failure rate and time to restore service. The finding that speed and stability go together, and do not trade off, is why these four numbers are the ones a pipeline should report.

## The Four Core DORA Metrics

DORA research categorizes software delivery performance across four fundamental metrics:

### Velocity Metrics
1. **Deployment Frequency (DF)**: How often an organization successfully releases code to production (e.g., multiple deployments per day vs once per month).
2. **Lead Time for Changes (LTC)**: The total time elapsed from code commit check-in to code successfully running in production.

### Stability Metrics
3. **Change Failure Rate (CFR)**: The percentage of production deployments that result in degraded service or severe outages requiring immediate hotfixes, rollbacks, or patches.
4. **Failed Deployment Recovery Time (often called mean time to restore)**: The time required to restore service after a deployment causes a failure in production.

High-performing organizations achieve high deployment frequency and low lead time while simultaneously maintaining low change failure rates and rapid service recovery times.

The inputs of these calculations are events your pipeline already produces; the work is to record them. Each production deployment writes one record with the time of the commit, the time it reached production, the outcome and the release id, and an incident system supplies the open and close times:

```json
{
  "id": "rel-2041",
  "environment": "production",
  "committedAt": "2026-03-02T09:14:00Z",
  "deployedAt": "2026-03-02T10:02:00Z",
  "status": "SUCCESS"
}
```

::: github
Each provider can report the facts that the calculation needs. In GitHub Actions, the history of a workflow's runs, with their conclusion and times, is available from the command line:

```bash
gh run list --workflow release.yml --json conclusion,createdAt,updatedAt
```
:::

::: azure
Azure DevOps lists the runs of a project the same way:

```bash
az pipelines runs list
```
:::

::: aws
On AWS, a final deploy step can publish a custom metric to CloudWatch, which can then chart the deployment frequency:

```bash
aws cloudwatch put-metric-data \
  --namespace Delivery \
  --metric-name DeploymentSucceeded \
  --value 1 \
  --unit Count
```
:::

::: gcp
On Google Cloud, a structured entry in Cloud Logging records the same event with its fields:

```bash
gcloud logging write deployments '{"release": "rel-2041", "status": "SUCCESS"}' --payload-type=json
```
:::

## DORA Performance Tiers and Organizational Health

DORA benchmarks categorize software engineering organizations into four distinct performance tiers:

| Performance Tier | Deployment Frequency | Lead Time for Changes | Change Failure Rate | Failed Service Recovery Time |
| :--- | :--- | :--- | :--- | :--- |
| **Elite** | On-demand (multiple per day) | Less than 1 hour | 0% - 5% | Less than 1 hour |
| **High** | Between 1 day and 1 week | Between 1 day and 1 week | 6% - 15% | Less than 1 day |
| **Medium** | Between 1 week and 1 month | Between 1 week and 1 month | 16% - 30% | Less than 1 day |
| **Low** | Less than once per month | Between 1 month and 6 months | 31% - 60% | Greater than 1 month |

DORA 2024 research highlights that organizational health, code review speed, and employee well-being directly correlate with technical delivery performance. Automated quality gates and fast commit suites are primary drivers of elite DORA performance.

## SRE Pipeline Telemetry, SLOs, and Error Budgets

Site Reliability Engineering (SRE) manages system reliability using quantitative operational metrics:

- **Service Level Indicator (SLI)**: A quantified measure of service performance, such as request latency or successful HTTP request percentage.
- **Service Level Objective (SLO)**: A target reliability threshold agreed upon for an SLI (e.g., `99.9% successful HTTP responses over 30 days`).
- **Error Budget**: The maximum acceptable downtime or error allowance calculated as `100% - SLO` (e.g., a 99.9% SLO allows a 0.1% error budget).

When a delivery pipeline automates deployments, the deployment controller evaluates the application's remaining Error Budget. If recent production incidents have exhausted the Error Budget, automated deployment gates automatically freeze non-emergency feature releases, directing engineering effort toward reliability remediation.

Lead time is the difference between the two instants, so both must come from one source of truth, such as the commit time in Git and the time of the successful deploy job. A GitHub Actions job can append the record to a table or a file at the end of the production deploy; Azure Pipelines, Cloud Build and CodePipeline do the same in their last step. Change failure rate needs the outcome of each release to be decided by something observable, a rollback or an incident linked to the release, rather than by the person who deployed it.

The error budget comes from the monitoring service. Cloud Monitoring and Amazon CloudWatch can define service level objectives on a request metric, and a Prometheus alert can page when the budget is burning too fast:

```yaml
groups:
  - name: slo
    rules:
      - alert: ErrorBudgetBurn
        expr: sum(rate(http_requests_total{code=~"5.."}[1h])) / sum(rate(http_requests_total[1h])) > 14.4 * 0.001
        for: 5m
        labels:
          severity: page
```

## Across the platforms

Metrics are for the team to improve, not for ranking people. A target imposed on deployment frequency alone produces small meaningless releases, and a target on failure rate alone produces fear of releasing; reading the four together, as the tier does, keeps the incentives honest.

## Common mistakes

- **Measuring lines of code instead of DORA metrics**: Tracking developer output via lines of code or commit counts incentivizes poor software architecture and low-quality code.
- **Ignoring Error Budgets during release automation**: Continuing to deploy aggressive feature changes when Error Budgets are exhausted leads to catastrophic outages.
- **Calculating Lead Time from ticket creation instead of code commit**: Measuring lead time before source code is written introduces noise and fails to measure pipeline efficiency.

## In practice

Try it in a repository of your own.

1. Record each production deployment with its start time, end time and result, using the commands of your platform.
2. Calculate the four metrics for the last weeks by hand.
3. Choose a target for each metric and a service level objective with an error budget.

The challenge calculates the metrics, classifies the team and tracks the budget.

## Check yourself

1. What are the four core metrics defined by the DORA framework?
2. What operational values differentiate Elite DORA performers from Low performers?
3. How do SRE Error Budgets influence automated release deployment gates?
