# Modeling Artifact Registry and Cache Integrity

Building a secure artifact registry service and cache key evaluator requires strict enforcement of SHA256 digest immutability and cache isolation rules. Modeling these subsystems in code provides hands-on mastery of digest verification, store key generation, and branch-based cache permission controls.

You need: Caching Strategies in CI/CD

## Artifact Storage and Digest Integrity

An immutable artifact registry acts as the single source of truth for compiled binaries and container images.

The registry service must enforce strict integrity rules:

- **SHA256 Format Validation**: Verifying that artifact digests adhere strictly to standard 64-character hexadecimal formatting prefixed with `sha256:` (e.g., `sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`).
- **Immutability Protection**: Preventing existing artifact records from being overwritten or modified. If an incoming registration attempt supplies a digest that already exists with different metadata or binary payload, the registry must throw an immutability violation error.
## Cache Key Construction and Write Permission Rules

Cache evaluation logic manages key construction and isolation policies.

The evaluator generates keys and determines permissions based on context:

- **Key Construction**: Building primary keys using lockfile hashes (e.g., `cache-node-linux-<hash>`) and generating ordered fallback keys (e.g., `cache-node-linux-main-`, `cache-node-linux-`).
- **Branch Isolation**: Assigning `canWrite: true` strictly to protected branches (e.g., `main` or `master`). Pull Request runs receive `canWrite: false` to enforce cache isolation against poisoning attacks.
## Registries and Promotion in Each Provider

The registries of the four providers enforce the same two rules the challenge models: a version names one digest, and what moves between environments is the digest. GitHub Container Registry, Amazon ECR, Azure Container Registry and Google Artifact Registry all address an image as `repository@sha256:...`, and a promotion pipeline copies or re-tags that digest without rebuilding it.

A GitHub Actions workflow can promote by digest and sign in to each cloud without stored secrets; the deploy job names the digest it received from the build:

```yaml
promote:
  needs: build
  runs-on: ubuntu-latest
  environment: production
  permissions:
    id-token: write
    contents: read
  steps:
    - uses: aws-actions/configure-aws-credentials@v6
      with:
        role-to-assume: arn:aws:iam::111122223333:role/promote-api-service
        aws-region: eu-west-1
    - run: echo "promoting api-service@${{ needs.build.outputs.digest }}"
```

On Azure, an environment with approvals gates the same step: the stage that deploys to `production` waits for the reviewers configured on the environment before it runs.

```yaml
stages:
  - stage: production
    jobs:
      - deployment: promote
        environment: production
        strategy:
          runOnce:
            deploy:
              steps:
                - script: echo "promoting api-service@$(imageDigest)"
```

A registry that allows tags to move is not wrong, but it moves the guarantee from the registry to your process. Immutable tags (ECR), locked images (ACR) or a rule that deployments reference digests only make the guarantee mechanical.

## Finding the Digest of a Version in Azure and Google Cloud

A registry record only helps if the pipeline can read the digest it stores. On Azure Container Registry, the metadata of a tag includes the digest of its manifest:

```bash
digest=$(az acr manifest show-metadata -r myregistry -n "api-service:1.0.0" --query digest -o tsv)
echo "api-service@${digest}"
```

On Google Cloud, Artifact Registry describes an image from its tag, and the pipeline reads the digest from that description before it promotes anything:

```bash
gcloud artifacts docker images describe REGION-docker.pkg.dev/PROJECT_ID/apps/api-service:1.0.0
```

## Reading a Digest in AWS

Amazon ECR gives the same record that this lesson models. The registry returns the digest of a tag, and the pipeline compares it with the one it stored when the version was published:

```bash
aws ecr describe-images --repository-name api-service --image-ids imageTag=1.0.0 --query 'imageDetails[0].imageDigest' --output text
```

## Common mistakes

- **Accepting malformed SHA256 digests**: Allowing non-hexadecimal strings or incorrect hash lengths as artifact digests compromises registry integrity.
- **Overwriting existing registry digests**: Failing to throw errors on duplicate digest registration breaks artifact immutability.
- **Granting write access to PR branch caches**: Allowing pull requests to write to primary branch caches exposes builds to cache poisoning. A poisoned entry is then trusted by later builds on protected branches.

## In practice

An engineering organization requires an in-memory artifact registry service and cache policy evaluator implemented in TypeScript.

The system will register immutable artifacts with SHA256 verification and evaluate cache restore keys and write permissions based on pipeline execution context.

## Check yourself

1. What format validation must be performed on incoming artifact SHA256 digests?
2. How does an immutable registry handle attempts to overwrite an existing digest?
3. Which branches are permitted write access during cache policy evaluation?
