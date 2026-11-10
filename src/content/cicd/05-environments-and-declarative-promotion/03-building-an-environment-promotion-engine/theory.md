# Building an Environment Promotion Planner

An environment promotion engine automates the progression of immutable software artifacts across environment stages while evaluating preconditions, quality gate results, and manifest configurations. Modeling a promotion engine in TypeScript provides practical understanding of environment state transitions, validation checks, and promotion manifest generation.

You need: Declarative Artifact Promotion

## Promotion Engine State and Transition Rules

The promotion engine maintains the target environment state and evaluates proposed promotion requests:

- **Environment Hierarchy**: Environments follow a strict promotion order: `development` -> `staging` -> `production`.
- **Precondition Verification**:
  - The requested artifact digest must exist and possess a valid SHA256 format (`sha256:...`).
  - To promote to `production`, the exact digest must already be successfully deployed and verified in `staging`.
  - The promotion request must reference passing quality gate execution IDs.

If all preconditions pass, the engine updates the environment manifest reference and returns a `PROMOTED` status result.
## Manifest Patch Generation

Upon approving a promotion request, the engine generates an updated declarative manifest configuration patch (representing a Git commit diff):

- **Target Manifest Path**: E.g., `environments/production/deployment.json`.
- **Updated Digest Reference**: Updating `image.digest` to the newly promoted SHA256 string.
- **Audit Metadata**: Recording `promotedBy`, `promotionTimestamp`, and `previousDigest`.
## From the Patch to the Cluster

The patch the planner produces is a file in Git, so the promotion is a pull request like any other, with review, history and rollback by revert. Kustomize turns the pinned digest into the image reference when it renders the overlay:

```yaml
# overlays/production/kustomization.yaml
resources:
  - ../../base
images:
  - name: api-service
    newName: registry.example.com/api-service
    digest: sha256:b5bb9d8014a0f9b1d61e21e796d78dccdf1352f23cd32812f4850b878ae4944c
```

A GitOps controller then reconciles the cluster with the path. In Argo CD, one application per environment points at its overlay and syncs it automatically:

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: api-service-production
spec:
  project: default
  source:
    repoURL: https://git.example.com/org/deploy-config.git
    targetRevision: main
    path: overlays/production
  destination:
    server: https://kubernetes.default.svc
    namespace: api-service
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
```

The CI job that promotes does not touch the cluster: it opens the pull request that changes the overlay. That keeps the cloud credentials in the controller, and in every provider the pipeline needs only permission to push a branch to the configuration repository.

## Delivering the Patch in Each Provider

The patch the planner builds has to reach the environment. In GitHub Actions, a job commits the overlay and opens the pull request that a reviewer approves:

```yaml
- run: |
    git switch -c promote/api-service
    git add overlays/production/kustomization.yaml
    git commit -m "Promote api-service to production"
    git push -u origin promote/api-service
    gh pr create --title "Promote api-service to production" --body "Pins the image to the verified digest."
  env:
    GH_TOKEN: ${{ github.token }}
```

Azure Repos has the same step in the Azure DevOps command line:

```bash
az repos pr create \
  --source-branch promote/api-service \
  --target-branch main \
  --title "Promote api-service to production"
```

Google Cloud Deploy turns a release into a rollout through the delivery pipeline of the service:

```bash
gcloud deploy releases create release-2041 \
  --delivery-pipeline=api-service \
  --region=REGION
```

On Amazon ECS, CodeDeploy reads an AppSpec file from a bucket, and the deployment that promotes the new task definition is created from it:

```bash
aws deploy create-deployment --cli-input-json file://create-deployment.json
```

```json
{
  "applicationName": "ecs-deployment",
  "deploymentGroupName": "ecs-deployment-dg",
  "revision": {
    "revisionType": "S3",
    "s3Location": { "bucket": "ecs-deployment-bucket", "key": "appspec.yaml", "bundleType": "YAML" }
  }
}
```

## Common mistakes

- **Allowing out-of-order environment promotion**: Allowing an artifact to bypass `staging` and deploy directly to `production`.
- **Failing to verify SHA256 digest matching**: Promoting a digest to production that does not match the exact binary tested in staging.
- **Promoting artifacts with failing quality gates**: Ignoring quality gate execution status during promotion evaluation. A promotion that skips the gate makes the gate decorative.

## In practice

An engineering team requires an environment promotion engine implemented in TypeScript. The engine will evaluate promotion requests against environment state, enforce sequential promotion preconditions, and generate updated environment manifest records.

## Check yourself

1. What rules govern sequential promotion between `development`, `staging`, and `production`?
2. What fields are recorded in the generated environment manifest patch upon successful promotion?
3. What error must be raised if an unverified digest attempts direct promotion to `production`?
