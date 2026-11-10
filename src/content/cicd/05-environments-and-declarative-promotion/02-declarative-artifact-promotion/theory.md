# Declarative Artifact Promotion

Declarative artifact promotion is the operational workflow by which a verified, immutable software artifact advances through target environments without undergoing binary re-compilation. In a declarative continuous delivery architecture, promoting an application to staging or production is executed by updating version references in environment configuration manifests stored in Git.

You need: Environment Lifecycle and Isolation

## The Declarative Promotion Workflow

Declarative promotion decouples artifact generation from artifact deployment. The promotion process proceeds through sequential, validated stages:

1. **Artifact Generation**: The build job compiles source code once, packages the immutable artifact, and assigns a cryptographic SHA256 digest (e.g., `app@sha256:8a3f...`).
2. **Pre-Promotion Quality Gates**: Automated pipelines validate unit tests, security scans, and static policy rules.
3. **Declarative Manifest Update**: The deployment automation opens a Pull Request in the configuration repository, updating the target environment overlay (e.g., `overlays/staging/kustomization.yaml`) to reference the new SHA256 digest.
4. **Peer Review & Approval**: Team members inspect the configuration diff and approve the PR (*4-eyes principle*).
5. **Reconciliation**: Merging the PR triggers the environment controller to pull the updated manifest and reconcile the live environment to match the declared state.
## Multi-Stage Verification and Gates

Promoting an artifact from Staging to Production requires passing multi-stage verification gates:

- **Automated Integration & Smoke Tests**: Post-deployment test suites running against the staging environment to verify database connectivity, API contracts, and health endpoints.
- **Performance & Load Benchmarks**: Automated load tests ensuring latency and error rates remain within acceptable Service Level Objectives (SLOs).
- **Manual Approval & Release Windows**: Authorized business sign-offs required before production manifest updates are merged.

If any verification stage fails in Staging, the promotion sequence is aborted, preventing the artifact reference from reaching the Production manifest.
## Preconditions and Promotion Immutability

Declarative promotion enforces strict preconditions to maintain release safety:

- **No Rebuilding**: The binary deployed to production must match the exact SHA256 digest validated in staging.
- **Sequential Promotion**: An artifact cannot bypass intermediate testing environments (e.g., promoting directly to production without passing staging validation is blocked).
- **Immutable Provenance Attestation**: The artifact must possess a valid cryptographic provenance attestation (such as SLSA provenance) proving it originated from an authorized CI build pipeline.
## Promotion Pipelines in Each Provider

A promotion workflow moves one artifact through ordered environments, and each provider has a native object for that order. In GitHub Actions, jobs that name an environment run in sequence with `needs`, and the environment's protection rules hold the production job for approval:

```yaml
jobs:
  staging:
    runs-on: ubuntu-latest
    environment: staging
    steps:
      - run: ./deploy.sh staging "${{ needs.build.outputs.digest }}"
  production:
    needs: staging
    runs-on: ubuntu-latest
    environment: production
    steps:
      - run: ./deploy.sh production "${{ needs.build.outputs.digest }}"
```

Azure Pipelines models the same order as stages, each with a deployment job that targets an environment. AWS CodePipeline has one stage per environment, and a manual approval action can sit between them. Google Cloud Deploy declares the order in a delivery pipeline:

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

In all of them the artifact is the same at every stage; only the environment changes. The rule the challenge checks, that production accepts only what staging already verified, is what the order of stages and the approvals enforce.

## Promotion in Azure and AWS

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

## Promotion in GitHub Actions and Google Cloud

GitHub Actions orders the environments with `needs`, and the environment of production holds the job until its reviewers approve:

```yaml
jobs:
  staging:
    runs-on: ubuntu-latest
    environment: staging
    steps:
      - run: ./deploy.sh staging
  production:
    needs: staging
    runs-on: ubuntu-latest
    environment: production
    steps:
      - run: ./deploy.sh production
```

Google Cloud Deploy promotes a release to the next target of its delivery pipeline with one command:

```bash
gcloud deploy releases promote \
  --release=release-2041 \
  --delivery-pipeline=api-service \
  --region=REGION
```

## Common mistakes

- **Promoting unvalidated SHA256 digests**: Updating production configuration manifests with digests that failed staging integration tests.
- **Bypassing Pull Request reviews for manifest updates**: Allowing automated bots or users to commit directly to production configuration manifests without review audit trails.
- **Promoting by mutable tag instead of digest**: Updating configuration files to point to `:latest` or mutable version tags instead of exact SHA256 hashes.

## In practice

An e-commerce engineering team deployed updates by manually running SSH scripts that pulled code directly from Git master on production servers. Deployments often failed due to untracked manual edits on staging servers.

The team adopted declarative promotion. The CI pipeline builds a single container image identified by its SHA256 digest. An automated bot opens a PR updating `overlays/staging/values.yaml` with the digest. Once automated smoke tests pass in staging, a second PR is generated for `overlays/production/values.yaml`. Engineers review the diff and merge, allowing the deployment controller to pull and apply the identical binary safely.

## Check yourself

1. How is a software release promoted to a higher environment in a declarative delivery model?
2. Why must promotion workflows enforce sequential advancement through staging before production?
3. What role do SHA256 digests play in ensuring promotion immutability?
