# Progressive Delivery Strategies

Progressive delivery is the operational practice of incrementally releasing software changes to target runtime environments while continuously monitoring system telemetry and user metrics. By controlling the blast radius of new deployments, progressive delivery minimizes downtime, reduces change failure rate (CFR), and enables rapid automated recovery when deployment degradations are detected.

You need: Building an Environment Promotion Planner

## The Mechanics of Progressive Deployment Strategies

Modern container orchestration platforms and delivery controllers support three primary deployment deployment patterns:

### 1. Rolling Updates
In a Rolling Update, instances of the previous application version are incrementally replaced with instances of the new version across a server cluster.
- **Mechanics**: The deployment controller updates a small batch of pods/nodes (e.g., 25% at a time), waits for health probes to report readiness, and proceeds to the next batch.
- **Trade-offs**: Requires zero additional infrastructure capacity. However, during the rollout window, both old and new application versions run simultaneously, requiring strict backwards compatibility for database schemas and API contracts.

### 2. Blue-Green Deployments
Blue-Green deployments maintain two identical, isolated production environments: "Blue" (currently active serving live user traffic) and "Green" (idle staging environment receiving the new release).
- **Mechanics**: The new artifact version is fully deployed and validated in the Green environment. Once smoke tests pass, traffic routing (load balancer or ingress) is instantly switched from Blue to Green.
- **Trade-offs**: Enables near-zero downtime and instant rollback by switching traffic back to Blue if issues occur. However, it doubles infrastructure resource requirements during deployment windows.

### 3. Canary Releases
Canary releases route a tiny percentage of live user traffic (e.g., 1%, 5%, 10%) to the new version while the remaining majority continues on the stable version.
- **Mechanics**: Traffic percentage is incrementally shifted based on real-time metric analysis (error rates, HTTP 5xx spikes, p99 latency). If telemetry remains healthy, the canary expands to 100%.
- **Trade-offs**: Minimizes blast radius to a small fraction of users. Requires sophisticated traffic routing infrastructure (service meshes, ingress controllers) and real-time observability integration.
## Blast Radius Control and Automatic Rollback

The primary goal of progressive delivery is controlling the *blast radius*—limiting the number of end users impacted if a newly deployed binary contains a bug or memory leak.

High-performing delivery pipelines integrate automated rollbacks into progressive deployment workflows:

- **SLO Telemetry Monitoring**: Continuously checking Error Budgets, HTTP error percentages, and latency metrics against baseline metrics during rollout windows.
- **Automated Cut-Off**: If canary metrics cross pre-configured failure thresholds (e.g., 5xx error rate > 1%), the delivery engine halts the rollout and instantly restores traffic to the stable version without human intervention.
## Release Strategies in Each Provider

The three strategies are settings of the platform that serves the traffic. In Kubernetes, a rolling update replaces pods gradually and the two numbers bound how much capacity is lost or added during the roll:

```yaml
spec:
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 25%
      maxUnavailable: 0
```

A canary changes the share of traffic instead. Argo Rollouts describes it as steps that raise the weight and pause to observe:

```yaml
spec:
  strategy:
    canary:
      steps:
        - setWeight: 10
        - pause:
            duration: 1h
        - setWeight: 20
        - pause: {}
```

The clouds expose the same control as a traffic split. On Google Cloud Run, deploy the new revision without traffic and move a percentage to it; rolling back is moving all traffic to the previous revision:

```bash
gcloud run deploy api-service --image IMAGE --no-traffic
gcloud run services update-traffic api-service --to-revisions NEW_REVISION=10
gcloud run services update-traffic api-service --to-revisions OLD_REVISION=100
```

Azure App Service routes a percentage to a deployment slot and swaps slots for a blue-green release:

```bash
az webapp traffic-routing set --resource-group apps --name api-service --distribution staging=10
az webapp deployment slot swap --resource-group apps --name api-service --slot staging --target-slot production
```

On AWS, CodeDeploy for Amazon ECS has canary and linear deployment configurations that shift traffic in steps, for example `CodeDeployDefault.ECSCanary10Percent5Minutes`, and returns it to the original task set if a check fails. A database migration is the exception to all of them: the old and the new version run against one schema at the same time, so the migration has to be compatible with both before any traffic moves.

## Running a Strategy from GitHub Actions and AWS

A strategy is carried out by the platform, and the pipeline only gives the order. A GitHub Actions workflow that moves a share of Cloud Run traffic to the new revision, with the share chosen by the person who starts it, signs in with the identity federation described earlier and runs the command from this lesson:

```yaml
on:
  workflow_dispatch:
    inputs:
      weight:
        description: Percentage of traffic for the new revision
        required: true
        type: string

jobs:
  shift:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      id-token: write
    steps:
      - uses: google-github-actions/auth@v3
        with:
          workload_identity_provider: projects/PROJECT_NUMBER/locations/global/workloadIdentityPools/github-pool/providers/github-provider
          service_account: deploy@PROJECT_ID.iam.gserviceaccount.com
      - run: gcloud run services update-traffic api-service --to-revisions NEW_REVISION=${{ inputs.weight }}
```

On AWS, CodeDeploy for Amazon ECS reads an AppSpec file that names the task definition and the load balanced container, and a deployment configuration decides how traffic shifts:

```yaml
version: 0.0
Resources:
  - TargetService:
      Type: AWS::ECS::Service
      Properties:
        TaskDefinition: "arn:aws:ecs:REGION:ACCOUNT_ID:task-definition/api-service:2"
        LoadBalancerInfo:
          ContainerName: "api-service"
          ContainerPort: 80
```

```bash
aws deploy create-deployment \
  --application-name ecs-deployment \
  --deployment-group-name ecs-deployment-dg \
  --deployment-config-name CodeDeployDefault.ECSCanary10Percent5Minutes \
  --revision '{"revisionType":"S3","s3Location":{"bucket":"ecs-deployment-bucket","key":"appspec.yaml","bundleType":"YAML"}}'
```

## Common mistakes

- **Performing all-at-once deployments without health probes**: Replacing 100% of production instances simultaneously without readiness validation causes complete service outages when binaries fail to start.
- **Deploying schema breaking changes during rolling updates**: Altering database column structures without backwards compatibility breaks active older application instances during rolling rollouts.
- **Ignoring metrics during canary rollouts**: Shifting traffic to a canary deployment without actively monitoring telemetry negates the risk-reduction benefits of progressive delivery.

## In practice

A streaming media company previously updated its payment service using all-at-once deployments. A hidden null pointer exception in a new release caused a 30-minute global checkout outage before engineers could manually revert the server instances.

The platform team implemented Canary Releases via a service mesh controller. New releases now start at 2% traffic for 10 minutes. During a recent deployment, the canary automatically detected a 3% increase in database timeout errors. The delivery controller aborted the rollout instantly, returning 100% of traffic to the stable version before customer complaints occurred.

## Check yourself

1. What are the operational trade-offs between Rolling Updates and Blue-Green deployments?
2. How does a Canary release limit the blast radius of a software defect?
3. What metrics should trigger an automated rollback during progressive delivery?
