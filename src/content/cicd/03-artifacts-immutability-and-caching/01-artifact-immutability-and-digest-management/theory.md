# Artifact Immutability and Digest Management

Artifact immutability is an essential architectural principle of modern software delivery pipelines. Once a software artifact—such as a container image, binary executable, or library package—is built, compiled, and validated in an early pipeline stage, it must never be rebuilt or modified as it moves toward production. Rebuilding source code for higher environments introduces non-determinism, invalidates prior testing, and exposes production deployments to unverified changes.

You need: Validating Build and Test Workflows

## Case study

A developer removed one tiny package, a function that pads a string on the left, from the public npm registry. Thousands of builds that depended on it broke within minutes, including those of very large projects. The registry then restricted unpublishing, because a version that can disappear or change is not a dependable input. The same rule applies to your own artifacts: a version identifies one digest forever, and deployments refer to the digest.

## The Build Once, Deploy Anywhere Principle

The core rule of artifact management in continuous delivery is "Build Once, Deploy Anywhere." In a traditional or anti-pattern delivery workflow, teams compile source code separately for development, staging, and production environments, often injecting environment-specific variables directly into the compiled output.

This anti-pattern creates severe operational risks:

- **Non-Identical Binaries**: Compiling source code at different times can pull updated transitive dependencies, compiler patches, or timestamp variations, producing binaries that are not byte-for-byte identical.
- **Invalidated Test Results**: All unit, integration, and security testing performed in staging becomes void because the binary deployed to production is a newly compiled artifact that was never tested.
- **Environment Coupling**: Hardcoding environment configurations into build artifacts prevents scaling and dynamic configuration management.

In an immutable pipeline architecture, the build stage produces a single, self-contained artifact package. That exact identical artifact is promoted across staging and production, with environment variations injected strictly at runtime via environment variables or external configuration manifests.

::: github
Build and push the image once, and keep the digest the build reports. In GitHub Actions:

```yaml
- id: build
  uses: docker/build-push-action@v6
  with:
    push: true
    tags: ghcr.io/org/api-service:1.0.0
- run: echo "digest=${{ steps.build.outputs.digest }}"
```
:::

::: azure
In Azure Pipelines, one task builds and pushes the image:

```yaml
- task: Docker@2
  inputs:
    command: buildAndPush
    containerRegistry: myregistry
    repository: api-service
    tags: 1.0.0
```
:::

::: aws
In an AWS CodeBuild buildspec, the build pushes to Amazon ECR once:

```yaml
version: 0.2
phases:
  build:
    commands:
      - docker build -t $REPOSITORY_URI:1.0.0 .
      - docker push $REPOSITORY_URI:1.0.0
```
:::

::: gcp
In Google Cloud Build, the images listed in `images` are pushed and their digests are recorded in the build:

```yaml
steps:
  - name: gcr.io/cloud-builders/docker
    args: [build, -t, REGION-docker.pkg.dev/PROJECT_ID/apps/api-service:1.0.0, .]
images:
  - REGION-docker.pkg.dev/PROJECT_ID/apps/api-service:1.0.0
```
:::

## Mutable Tags versus Immutable SHA256 Digests

In container registries and package repositories, artifacts are referenced by names, tags, or cryptographic digests. Understanding the security and operational differences between mutable tags and immutable digests is critical for secure deployment pipelines.

- **Mutable Tags (e.g., `:latest`, `:v1.0.0`)**: A tag is a pointers that can be overwritten or moved to point to a different artifact version at any time. Referencing tags in production deployment manifests (such as `image: my-app:v1.2.0`) allows underlying images to change without changing the manifest text, creating deployment unpredictability and vulnerability to image poisoning.
- **Cryptographic SHA256 Digests (e.g., `@sha256:7f83b165...`)**: A digest is an immutable, 256-bit cryptographic hash calculated directly from the binary contents of the artifact. Referencing artifacts by digest guarantees that the exact byte sequence compiled and tested in the build stage is the exact byte sequence executed in production.

High-performing delivery pipelines lock all deployment references to exact SHA256 digests during artifact packaging.

The deployment manifest then names the digest, so the cluster pulls exactly the bytes that were tested:

```yaml
spec:
  containers:
    - name: api-service
      image: registry.example.com/api-service@sha256:b5bb9d8014a0f9b1d61e21e796d78dccdf1352f23cd32812f4850b878ae4944c
```

::: github
A build produces a digest when it pushes an image; the deployment should carry that digest forward instead of the tag. In GitHub Actions the build action exposes it as an output that later jobs read:

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    outputs:
      digest: ${{ steps.push.outputs.digest }}
    steps:
      - uses: actions/checkout@v7
      - uses: docker/login-action@v4
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      - id: push
        uses: docker/build-push-action@v7
        with:
          push: true
          tags: ghcr.io/org/api-service:${{ github.sha }}

  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - run: echo "deploying ghcr.io/org/api-service@${{ needs.build.outputs.digest }}"
```
:::

::: azure
Azure Container Registry locks one image, or a whole repository, by turning off writes:

```bash
az acr repository update --name myregistry --image api-service:1.4.0 --write-enabled false
```
:::

::: aws
Registries can also refuse to overwrite a tag. Amazon ECR returns an `ImageTagAlreadyExistsException` when a push reuses a tag in a repository with immutable tags:

```bash
aws ecr create-repository --repository-name api-service --image-tag-mutability IMMUTABLE
```

Amazon ECR returns the digest of a tag, and the deploy step then uses the reference by digest:

```bash
aws ecr describe-images --repository-name api-service --image-ids imageTag=1.0.0 --query 'imageDetails[0].imageDigest' --output text
```
:::

::: gcp
Google Cloud Build records the digest of every image listed under `images`, and the build results carry it to the deploy step:

```yaml
steps:
  - name: gcr.io/cloud-builders/docker
    args: [build, -t, REGION-docker.pkg.dev/PROJECT_ID/apps/api-service:$SHORT_SHA, .]
images:
  - REGION-docker.pkg.dev/PROJECT_ID/apps/api-service:$SHORT_SHA
```

Google Cloud Run accepts an image reference with a digest, so the service runs exactly the bytes that were verified:

```bash
gcloud run deploy api-service --image REGION-docker.pkg.dev/PROJECT_ID/apps/api-service@sha256:DIGEST
```
:::

## Container Registries and Artifact Promotion

Artifact promotion is the process of advancing a verified artifact through deployment gates (e.g., from Development to Staging to Production) without modifying its binary content.

Modern artifact registries support promotion workflows using two primary mechanisms:

1. **Metadata and Tag Promotion**: Attaching metadata attestations or promotion tags (e.g., `promoted-to-staging`) to the existing SHA256 digest inside the registry without re-uploading binary layers.
2. **Registry Environment Separation**: Copying the immutable SHA256 artifact from a non-production registry repository to a restricted production registry repository after quality gates pass.

::: github
Promotion copies the digest to the repository of the next environment, without rebuilding. In GitHub Container Registry, with Buildx:

```bash
docker buildx imagetools create --tag ghcr.io/org/api-service:prod ghcr.io/org/api-service@sha256:DIGEST
```
:::

::: azure
In Azure Container Registry, import the digest from the registry of staging:

```bash
az acr import --name prodregistry --source stagingregistry.azurecr.io/api-service@sha256:DIGEST --image api-service:prod
```
:::

::: aws
In Amazon ECR, read the manifest of the digest and put it under the new tag:

```bash
manifest=$(aws ecr batch-get-image --repository-name api-service --image-ids imageDigest=sha256:DIGEST --query 'images[0].imageManifest' --output text)
aws ecr put-image --repository-name api-service --image-tag prod --image-manifest "$manifest"
```
:::

::: gcp
In Artifact Registry, add a tag to the digest:

```bash
gcloud artifacts docker tags add REGION-docker.pkg.dev/PROJECT_ID/apps/api-service@sha256:DIGEST REGION-docker.pkg.dev/PROJECT_ID/apps/api-service:prod
```
:::

## Across the platforms

Locking tags is a safety net. The rule that makes releases reproducible is simpler: promote the digest, and treat tags as names for humans.

## Common mistakes

- **Rebuilding binaries per environment**: Recompiling source code for staging and production invalidates automated testing done on earlier builds.
- **Using mutable tags in production manifests**: Deploying container images using `:latest` or mutable version tags leads to non-reproducible deployments.
- **Embedding secrets inside build artifacts**: Baking database credentials or API keys directly into compiled images violates configuration separation and leaks secrets.

## In practice

Try it in a repository of your own.

1. Build the image once and push it with a version tag, and note its digest.
2. Deploy to a test environment by digest and, after that, try to overwrite the tag with a different build. See that the deployment by digest does not change.
3. Turn on tag immutability in your registry where it exists.

The challenge verifies that a version still names the same digest.

## Check yourself

1. Why must software artifacts be built only once and promoted across environments without recompilation?
2. What is the fundamental security difference between a mutable image tag and an immutable SHA256 digest?
3. How are environment variations managed when deploying an immutable artifact to different environments?
