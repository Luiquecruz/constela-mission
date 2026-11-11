# Declarative Artifact Promotion

Declarative artifact promotion is the operational workflow by which a verified, immutable software artifact advances through target environments without undergoing binary re-compilation. In a declarative continuous delivery architecture, promoting an application to staging or production is executed by updating version references in environment configuration manifests stored in Git.

You need: Environment Lifecycle and Isolation

## Case study

Amazon describes in its engineering library how its pipelines promote a change through stages: first a pre-production environment, then a small slice of one region, then more regions in waves, with automated checks and alarms between the steps and a rollback when one fails. The same build moves through all of them. A promotion is a controlled decision between environments, with preconditions, and it never rebuilds what it promotes.

## The Declarative Promotion Workflow

Declarative promotion decouples artifact generation from artifact deployment. The promotion process proceeds through sequential, validated stages:

1. **Artifact Generation**: The build job compiles source code once, packages the immutable artifact, and assigns a cryptographic SHA256 digest (e.g., `app@sha256:8a3f...`).
2. **Pre-Promotion Quality Gates**: Automated pipelines validate unit tests, security scans, and static policy rules.
3. **Declarative Manifest Update**: The deployment automation opens a Pull Request in the configuration repository, updating the target environment overlay (e.g., `overlays/staging/kustomization.yaml`) to reference the new SHA256 digest.
4. **Peer Review & Approval**: Team members inspect the configuration diff and approve the PR (*4-eyes principle*).
5. **Reconciliation**: Merging the PR triggers the environment controller to pull the updated manifest and reconcile the live environment to match the declared state.

::: github
In GitHub Actions, the order is declared with `needs`, and each job names the environment it promotes to:

```yaml
jobs:
  staging:
    environment: staging
    runs-on: ubuntu-latest
    steps:
      - run: ./promote.sh staging
  production:
    needs: staging
    environment: production
    runs-on: ubuntu-latest
    steps:
      - run: ./promote.sh production
```
:::

::: azure
In Azure Pipelines, the order is declared with `dependsOn` between stages:

```yaml
stages:
  - stage: staging
  - stage: production
    dependsOn: staging
```
:::

::: aws
In AWS CodePipeline, the order is the order of the stages in the pipeline declaration, one per environment.
:::

::: gcp
In Google Cloud Deploy, the order is the sequence of stages of the delivery pipeline:

```yaml
apiVersion: deploy.cloud.google.com/v1
kind: DeliveryPipeline
metadata:
  name: api-service
serialPipeline:
  stages:
    - targetId: staging
    - targetId: production
```
:::

## Multi-Stage Verification and Gates

Promoting an artifact from Staging to Production requires passing multi-stage verification gates:

- **Automated Integration & Smoke Tests**: Post-deployment test suites running against the staging environment to verify database connectivity, API contracts, and health endpoints.
- **Performance & Load Benchmarks**: Automated load tests ensuring latency and error rates remain within acceptable Service Level Objectives (SLOs).
- **Manual Approval & Release Windows**: Authorized business sign-offs required before production manifest updates are merged.

If any verification stage fails in Staging, the promotion sequence is aborted, preventing the artifact reference from reaching the Production manifest.


::: azure
Azure Pipelines models the order as stages, and a deployment job in each one targets an environment whose approvals hold the production stage:

```yaml
stages:
  - stage: staging
    jobs:
      - deployment: release
        environment: staging
        strategy:
          runOnce:
            deploy:
              steps:
                - script: ./deploy.sh staging
  - stage: production
    dependsOn: staging
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
AWS CodePipeline has one stage per environment, with a manual approval action before the stage of production:

```json
{
  "name": "ApproveProduction",
  "actions": [
    {
      "name": "Approve",
      "actionTypeId": { "category": "Approval", "owner": "AWS", "provider": "Manual", "version": "1" },
      "runOrder": 1
    }
  ]
}
```
:::

::: gcp
Google Cloud Deploy declares the order in a delivery pipeline:

```yaml
apiVersion: deploy.cloud.google.com/v1
kind: DeliveryPipeline
metadata:
  name: api-service
serialPipeline:
  stages:
    - targetId: staging
    - targetId: production
```

Google Cloud Deploy promotes a release to the next target of its delivery pipeline with one command:

```bash
gcloud deploy releases promote \
  --release=release-2041 \
  --delivery-pipeline=api-service \
  --region=REGION
```
:::

## Preconditions and Promotion Immutability

Declarative promotion enforces strict preconditions to maintain release safety:

- **No Rebuilding**: The binary deployed to production must match the exact SHA256 digest validated in staging.
- **Sequential Promotion**: An artifact cannot bypass intermediate testing environments (e.g., promoting directly to production without passing staging validation is blocked).
- **Immutable Provenance Attestation**: The artifact must possess a valid cryptographic provenance attestation (such as SLSA provenance) proving it originated from an authorized CI build pipeline.

## Across the platforms

In all of them the artifact is the same at every stage; only the environment changes. The rule the challenge checks, that production accepts only what staging already verified, is what the order of stages and the approvals enforce.

## Common mistakes

- **Promoting unvalidated SHA256 digests**: Updating production configuration manifests with digests that failed staging integration tests.
- **Bypassing Pull Request reviews for manifest updates**: Allowing automated bots or users to commit directly to production configuration manifests without review audit trails.
- **Promoting by mutable tag instead of digest**: Updating configuration files to point to `:latest` or mutable version tags instead of exact SHA256 hashes.

## In practice

Try it in a repository of your own.

1. Define two stages, staging and production, that use the same image digest.
2. Require an approval before production and a successful check in staging before the approval is even offered.
3. Try to promote an artifact that was never in staging and see the pipeline refuse.

The challenge validates a promotion against these preconditions.

## Check yourself

1. How is a software release promoted to a higher environment in a declarative delivery model?
2. Why must promotion workflows enforce sequential advancement through staging before production?
3. What role do SHA256 digests play in ensuring promotion immutability?
