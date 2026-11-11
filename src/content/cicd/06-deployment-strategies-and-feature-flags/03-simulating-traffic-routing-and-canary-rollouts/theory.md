# Deciding Canary Rollout Steps

Automating progressive traffic routing requires evaluating real-time error telemetry against health thresholds during incremental rollout steps. Modeling a Canary deployment router and automated rollback controller in TypeScript demonstrates how progressive delivery engines evaluate telemetry, adjust traffic weights, and trigger emergency rollbacks.

You need: Decoupling Deploy from Release with Feature Flags

## Case study

Google and Netflix announced Kayenta, an open source automated canary analysis service that pulls the metrics of the canary and of the baseline, scores the difference and, from that score and its limits, can promote or fail the canary. A person no longer stares at graphs: the system decides. The decision function you write in this lesson is the same idea in small: given the current state and the metrics, it returns the next step.

## Canary Rollout State Machine and Step Evaluations

A Canary rollout progresses through discrete traffic weight steps (e.g., 5% -> 25% -> 50% -> 100%):

- **Step Evaluation**: At each weight step, the router collects telemetry metrics (total requests, HTTP 5xx error count, p99 latency) for the canary version.
- **Health Verification**, in this order:
  - If `totalRequests` is below `minRequests`, hold: there is not enough traffic to decide.
  - Calculate `errorRatePercent = errorRequests / totalRequests * 100`, which is zero when there were no requests, and compare the unrounded value with `maxErrorRatePercent`.
  - If the error rate is within the limit and `latencyP99Ms <= maxLatencyP99Ms`, the step passes.
  - If metrics remain healthy throughout the step duration, the router advances to the next traffic weight step.
  - Upon completing the final step (100% weight), the rollout status transitions to `COMPLETED`.

The decision function is the logic that the delivery tools run for you, with your thresholds as configuration. Argo Rollouts expresses the steps as data and can run an analysis against a metrics provider between them, aborting the rollout when the analysis fails:

```yaml
spec:
  strategy:
    canary:
      steps:
        - setWeight: 10
        - pause:
            duration: 10m
        - setWeight: 25
        - pause:
            duration: 10m
        - setWeight: 50
```

A service mesh does the weighting for plain Kubernetes services. In Istio, a route sends a fixed share to each subset, and a controller edits the weights:

```yaml
http:
  - route:
      - destination:
          host: api-service
          subset: stable
        weight: 90
      - destination:
          host: api-service
          subset: canary
        weight: 10
```

::: github
In GitHub Actions, the job that evaluates the metrics decides the next command with the output of the previous step:

```yaml
- id: decide
  run: echo "action=ADVANCE" >> "$GITHUB_OUTPUT"
- if: steps.decide.outputs.action == 'ROLLBACK'
  run: gcloud run services update-traffic api-service --to-revisions OLD_REVISION=100
```
:::

::: azure
The decision function of this lesson is what a pipeline step or a controller evaluates between two weights. In Azure Pipelines, an Azure CLI step sets the share of an App Service slot:

```yaml
- task: AzureCLI@2
  inputs:
    azureSubscription: api-service-production
    scriptType: bash
    scriptLocation: inlineScript
    inlineScript: az webapp traffic-routing set --resource-group apps --name api-service --distribution staging=10
```
:::

::: aws
On AWS, the canary configuration of CodeDeploy takes the steps and the alarms, so the pipeline only starts the deployment:

```bash
aws deploy create-deployment \
  --application-name ecs-deployment \
  --deployment-group-name ecs-deployment-dg \
  --deployment-config-name CodeDeployDefault.ECSCanary10Percent5Minutes \
  --revision '{"revisionType":"S3","s3Location":{"bucket":"ecs-deployment-bucket","key":"appspec.yaml","bundleType":"YAML"}}'
```
:::

::: gcp
On Google Cloud Run, a pipeline moves the weight step by step and returns to the old revision when the decision says to roll back:

```bash
gcloud run services update-traffic api-service --to-revisions NEW_REVISION=25
gcloud run services update-traffic api-service --to-revisions OLD_REVISION=100
```
:::

## Automated Rollback Triggering

If at any point during canary evaluation the telemetry metrics violate configured threshold limits:

- The canary router immediately halts the rollout.
- The traffic weight for the canary version is instantly set to `0%`, restoring `100%` traffic to the stable version.
- The rollout status transitions to `ROLLED_BACK` with an explicit failure reason.

::: github
In GitHub Actions, a step that runs only when a previous one failed returns the traffic:

```yaml
- run: ./check-canary.sh
- if: failure()
  run: gcloud run services update-traffic api-service --to-revisions OLD_REVISION=100
```
:::

::: azure
In Azure Pipelines, a deployment job can run steps when the deployment fails:

```yaml
strategy:
  runOnce:
    deploy:
      steps:
        - script: ./deploy.sh production
    on:
      failure:
        steps:
          - script: ./rollback.sh production
```
:::

::: aws
In AWS CodeDeploy, enable the automatic rollback when the deployment fails or an alarm fires:

```bash
aws deploy create-deployment \
  --application-name ecs-deployment \
  --deployment-group-name ecs-deployment-dg \
  --auto-rollback-configuration enabled=true,events=DEPLOYMENT_FAILURE,DEPLOYMENT_STOP_ON_ALARM \
  --revision '{"revisionType":"S3","s3Location":{"bucket":"ecs-deployment-bucket","key":"appspec.yaml","bundleType":"YAML"}}'
```
:::

::: gcp
In Google Cloud Run, a rollback is returning all traffic to the previous revision:

```bash
gcloud run services update-traffic api-service --to-revisions OLD_REVISION=100
```
:::

## Across the platforms

Traffic can shift in steps and roll back when an alarm or a check fails. Some platforms evaluate the alarm for you; with others a pipeline or a controller has to evaluate the check and start the rollback, as the platform examples above show.

What every tool needs is the same list of numbers the function takes: the steps, a minimum sample, an error limit and a latency limit. A canary with no minimum sample rolls back on its first failed request or promotes on its first success; a canary with no rollback rule is only a slow release.

## Common mistakes

- **Failing to zero canary traffic on rollback**: Halting a failed rollout without restoring 100% traffic to stable leaves users exposed to errors.
- **Evaluating error rates with zero request samples**: Calculating error percentages when `totalRequests === 0` causes divide-by-zero errors.
- **Skipping intermediate weight steps**: Jumping directly from 5% to 100% traffic defeats progressive blast radius control. Without a rollback trigger, a bad release keeps receiving traffic.

## In practice

Try it in a repository of your own.

1. Define the steps of a canary, such as ten, twenty-five, fifty and one hundred percent, and the metrics that must stay healthy at each step.
2. Run it with a healthy build and with a build that raises errors on purpose.
3. Check that the unhealthy one returns to zero by itself.

The challenge decides the next step from the current step and the metrics.

## Check yourself

1. How does a Canary deployment router calculate error rate from telemetry data?
2. What action does the router take when a telemetry metric exceeds configured failure thresholds?
3. What is the final traffic weight allocation upon successful completion of a Canary rollout?
