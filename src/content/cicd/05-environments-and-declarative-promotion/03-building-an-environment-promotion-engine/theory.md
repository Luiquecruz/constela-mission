# Building an Environment Promotion Planner

An environment promotion engine automates the progression of immutable software artifacts across environment stages while evaluating preconditions, quality gate results, and manifest configurations. Modeling a promotion planner, in the language you choose for the challenge, provides practical understanding of environment state transitions, validation checks, and promotion manifest generation.

You need: Declarative Artifact Promotion

## Case study

A command meant to remove a few servers from one subsystem of a cloud storage service had an input entered incorrectly and removed a larger set than intended, which caused a widespread outage. The provider's summary says it modified the tool to remove capacity more slowly and added safeguards against going below a minimum. The planner in this lesson applies the same thinking to promotion: the change is a reviewed patch, and the planner refuses it when its preconditions are missing.

## Promotion Engine State and Transition Rules

The promotion planner receives a request, the result of the quality gate, the history of deployments and the ordered list of environments, and decides whether the promotion is allowed:

- **Environment Hierarchy**: Environments follow a strict promotion order, for example `development` -> `staging` -> `production`, and a target outside that order is unknown.
- **Precondition Verification**, checked in this order:
  - The requested artifact digest must have a valid SHA256 format (`sha256:` followed by 64 hexadecimal characters); otherwise the planner throws an error.
  - The quality gate status must be `PASSED`.
  - Every environment except the first needs proof from the environment immediately before it: a history entry with status `VERIFIED` for the same digest. Promoting to `production` therefore requires that the exact digest was verified in `staging`.

If every precondition passes, the planner returns a plan with `success: true` and a patch. If one fails, it returns `success: false`, a reason and no patch, for example `Verification missing in staging`.

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

## Manifest Patch Generation

When the promotion is approved, the planner generates the declarative change that pins the digest, which is a Git commit diff:

- **Target Manifest Path**: `overlays/<environment>/kustomization.yaml`.
- **Updated Digest Reference**: an `images` entry with the name of the service and the promoted SHA256 digest, in lower case.

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

The planner returns only the `images` entry, as the challenge defines. The job that commits it merges that entry into the existing overlay, so `resources` and `newName` stay in place, for example with `kustomize edit set image api-service=registry.example.com/api-service@sha256:<digest>`, which keeps the registry name. Writing the planner output over the whole file would remove them and the overlay would stop rendering the base deployment.

::: github
The patch the planner builds has to reach the environment. In GitHub Actions, a job commits the overlay and opens the pull request that a reviewer approves:

```yaml
needs: plan
permissions:
  contents: write
  pull-requests: write
steps:
  - run: |
      git switch -c promote/api-service
      (cd overlays/production && kustomize edit set image "api-service=registry.example.com/api-service@$DIGEST")
      git add overlays/production/kustomization.yaml
      git commit -m "Promote api-service to production"
      git push -u origin promote/api-service
      gh pr create --title "Promote api-service to production" --body "Pins the image to the verified digest."
    env:
      GH_TOKEN: ${{ github.token }}
      DIGEST: ${{ needs.plan.outputs.digest }}
```

The `DIGEST` variable carries the digest that the planner approved, which the job that ran the planner exposes as an output; the job never types a digest by hand.

The repository must allow GitHub Actions to create pull requests. Checks of a pull request created with the default token do not start until a person approves them; a token of a GitHub App avoids that step.
:::

::: azure
Azure Repos has the same step in the Azure DevOps command line:

```bash
az repos pr create \
  --source-branch promote/api-service \
  --target-branch main \
  --title "Promote api-service to production"
```
:::

::: aws
The next two commands are an alternative to the Git flow: they call the service directly, so the job needs the permissions of that service, such as `codedeploy:CreateDeployment`, and not only the right to push a branch. On Amazon ECS, CodeDeploy reads an AppSpec file from a bucket, and the deployment that promotes the new task definition is created from it:

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
:::

::: gcp
Google Cloud Deploy turns a release into a rollout through the delivery pipeline of the service:

```bash
gcloud deploy releases create release-2041 \
  --delivery-pipeline=api-service \
  --region=REGION
```
:::

## Across the platforms

The CI job that promotes does not touch the cluster: it opens the pull request that changes the overlay. In the Git flow that keeps the cloud credentials in the controller, and the pipeline needs only permission to push a branch to the configuration repository. The service commands in the platform examples above are the alternative that calls the service directly, and they need that service's own permissions.

## Common mistakes

- **Allowing out-of-order environment promotion**: Allowing an artifact to bypass `staging` and deploy directly to `production`.
- **Failing to verify SHA256 digest matching**: Promoting a digest to production that does not match the exact binary tested in staging.
- **Promoting artifacts with failing quality gates**: Ignoring quality gate execution status during promotion evaluation. A promotion that skips the gate makes the gate decorative.

## In practice

Try it in a repository of your own.

1. Keep the version of each environment in a file of the repository.
2. Write by hand the change that moves staging to production and open it as a pull request.
3. Merge it and watch the environment follow.

The challenge generates that change for you, given the state of each environment.

## Check yourself

1. What rules govern sequential promotion between `development`, `staging`, and `production`?
2. What does the patch of a successful plan contain, and why is it merged into the existing overlay?
3. What does the planner return when a request targets `production` and `staging` has no verified entry for the digest?
