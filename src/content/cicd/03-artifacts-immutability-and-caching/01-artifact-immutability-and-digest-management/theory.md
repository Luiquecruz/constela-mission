# Artifact Immutability and Digest Management

Artifact immutability is an essential architectural principle of modern software delivery pipelines. Once a software artifact—such as a container image, binary executable, or library package—is built, compiled, and validated in an early pipeline stage, it must never be rebuilt or modified as it moves toward production. Rebuilding source code for higher environments introduces non-determinism, invalidates prior testing, and exposes production deployments to unverified changes.

You need: Validating Build and Test Workflows

## The Build Once, Deploy Anywhere Principle

The core rule of artifact management in continuous delivery is "Build Once, Deploy Anywhere." In a traditional or anti-pattern delivery workflow, teams compile source code separately for development, staging, and production environments, often injecting environment-specific variables directly into the compiled output.

This anti-pattern creates severe operational risks:

- **Non-Identical Binaries**: Compiling source code at different times can pull updated transitive dependencies, compiler patches, or timestamp variations, producing binaries that are not byte-for-byte identical.
- **Invalidated Test Results**: All unit, integration, and security testing performed in staging becomes void because the binary deployed to production is a newly compiled artifact that was never tested.
- **Environment Coupling**: Hardcoding environment configurations into build artifacts prevents scaling and dynamic configuration management.

In an immutable pipeline architecture, the build stage produces a single, self-contained artifact package. That exact identical artifact is promoted across staging and production, with environment variations injected strictly at runtime via environment variables or external configuration manifests.
## Mutable Tags versus Immutable SHA256 Digests

In container registries and package repositories, artifacts are referenced by names, tags, or cryptographic digests. Understanding the security and operational differences between mutable tags and immutable digests is critical for secure deployment pipelines.

- **Mutable Tags (e.g., `:latest`, `:v1.0.0`)**: A tag is a pointers that can be overwritten or moved to point to a different artifact version at any time. Referencing tags in production deployment manifests (such as `image: my-app:v1.2.0`) allows underlying images to change without changing the manifest text, creating deployment unpredictability and vulnerability to image poisoning.
- **Cryptographic SHA256 Digests (e.g., `@sha256:7f83b165...`)**: A digest is an immutable, 256-bit cryptographic hash calculated directly from the binary contents of the artifact. Referencing artifacts by digest guarantees that the exact byte sequence compiled and tested in the build stage is the exact byte sequence executed in production.

High-performing delivery pipelines lock all deployment references to exact SHA256 digests during artifact packaging.
## Container Registries and Artifact Promotion

Artifact promotion is the process of advancing a verified artifact through deployment gates (e.g., from Development to Staging to Production) without modifying its binary content.

Modern artifact registries support promotion workflows using two primary mechanisms:

1. **Metadata and Tag Promotion**: Attaching metadata attestations or promotion tags (e.g., `promoted-to-staging`) to the existing SHA256 digest inside the registry without re-uploading binary layers.
2. **Registry Environment Separation**: Copying the immutable SHA256 artifact from a non-production registry repository to a restricted production registry repository after quality gates pass.
## Deploying by Digest in Each Provider

A build produces a digest when it pushes an image; the deployment should carry that digest forward instead of the tag. In GitHub Actions the build action exposes it as an output that later jobs read:

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
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

The deployment manifest then names the digest, so the cluster pulls exactly the bytes that were tested:

```yaml
spec:
  containers:
    - name: api-service
      image: registry.example.com/api-service@sha256:b5bb9d8014a0f9b1d61e21e796d78dccdf1352f23cd32812f4850b878ae4944c
```

Registries can also refuse to overwrite a tag. Amazon ECR returns an `ImageTagAlreadyExistsException` when a push reuses a tag in a repository with immutable tags:

```bash
aws ecr create-repository --repository-name api-service --image-tag-mutability IMMUTABLE
```

Azure Container Registry locks one image, or a whole repository, by turning off writes:

```bash
az acr repository update --name myregistry --image api-service:1.4.0 --write-enabled false
```

Google Cloud Build records the digest of every image listed under `images`, and the build results carry it to the deploy step:

```yaml
steps:
  - name: gcr.io/cloud-builders/docker
    args: [build, -t, REGION-docker.pkg.dev/PROJECT_ID/apps/api-service:$SHORT_SHA, .]
images:
  - REGION-docker.pkg.dev/PROJECT_ID/apps/api-service:$SHORT_SHA
```

Locking tags is a safety net. The rule that makes releases reproducible is simpler: promote the digest, and treat tags as names for humans.

## Using the Digest in AWS and Google Cloud

Amazon ECR returns the digest of a tag, and the deploy step then uses the reference by digest:

```bash
aws ecr describe-images --repository-name api-service --image-ids imageTag=1.0.0 --query 'imageDetails[0].imageDigest' --output text
```

Google Cloud Run accepts an image reference with a digest, so the service runs exactly the bytes that were verified:

```bash
gcloud run deploy api-service --image REGION-docker.pkg.dev/PROJECT_ID/apps/api-service@sha256:DIGEST
```

## Common mistakes

- **Rebuilding binaries per environment**: Recompiling source code for staging and production invalidates automated testing done on earlier builds.
- **Using mutable tags in production manifests**: Deploying container images using `:latest` or mutable version tags leads to non-reproducible deployments.
- **Embedding secrets inside build artifacts**: Baking database credentials or API keys directly into compiled images violates configuration separation and leaks secrets.

## In practice

A financial transaction platform previously compiled separate container images for staging and production using different build flags. During a production release, a subtle difference in dependency resolution caused a critical payment processing bug that had not occurred during staging tests.

The platform team redesigned their pipeline to adopt immutable artifacts. The build job compiles a single container image, tags it with its SHA256 digest, and pushes it to an artifact registry. The deployment pipeline promotes this exact digest to staging, and later to production, injecting environment configurations at launch. Lead Time for Changes dropped significantly, and deployment failures caused by build discrepancies were eliminated.

## Check yourself

1. Why must software artifacts be built only once and promoted across environments without recompilation?
2. What is the fundamental security difference between a mutable image tag and an immutable SHA256 digest?
3. How are environment variations managed when deploying an immutable artifact to different environments?
