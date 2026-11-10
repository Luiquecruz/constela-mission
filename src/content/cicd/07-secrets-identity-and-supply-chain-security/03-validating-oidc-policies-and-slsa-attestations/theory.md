# Validating OIDC Policies and SLSA Attestations

A deployment job holds two pieces of evidence: a short-lived identity token that says which workflow is running, and a provenance attestation that says which builder produced the artifact. Each cloud decides on its own whether to trust the token, and each cloud does it slightly differently. A deployment gate checks both pieces of evidence the way the target cloud will, before the job signs in, so a misconfigured trust or a substituted artifact stops the pipeline with a clear reason instead of failing halfway through a release.

You need: Secretless Authentication via OIDC and PBAC, Software Supply Chain Security and SLSA Provenance

## One Token, Different Trust Rules per Cloud

GitHub Actions issues the same token whichever cloud the job talks to; what changes is the audience the job requests and the way the cloud compares the subject.

| Check | AWS (IAM role trust policy) | Azure (federated identity credential) |
| --- | --- | --- |
| Issuer | the OIDC provider registered in the account | the `issuer` field of the credential |
| Audience | `sts.amazonaws.com` | `api://AzureADTokenExchange` |
| Subject | `StringEquals` for one value or `StringLike` with `*` and `?` | one exact `subject` per credential |
| Several branches or environments | one pattern can cover them | one credential per subject |

Google Cloud sits between the two: the provider copies claims into attributes, and an attribute condition on the provider, such as `assertion.repository == 'org/api-service'`, decides which workflows are admitted, while the service account binding narrows each one further.

The audience protects against replay: a token minted for Azure carries `api://AzureADTokenExchange` and is refused by AWS, so a token stolen from one deployment cannot be spent against another cloud. The subject rule decides how wide the door is. On AWS, `repo:org/api-service:environment:*` admits every environment of the repository, which is convenient for staging and dangerous for production; on Azure, writing that same string into a federated credential admits nothing, because the asterisk is compared as a character.

## Checking Provenance at the Deployment Gate

Provenance answers a different question: is this exactly the file that the trusted builder produced? Three checks matter, and all three must pass:

- **Predicate type**: the statement is SLSA build provenance (`https://slsa.dev/provenance/v1`), not some other attestation such as an SBOM.
- **Subject digest**: the SHA-256 digest of the artifact about to be deployed appears among the statement's subjects.
- **Builder identity**: the builder id is one the organization trusts, such as `https://github.com/actions/runner/github-hosted`.

In a GitHub Actions deployment job the gate runs before the cloud sign-in, so an artifact that fails verification never reaches the credentials:

```yaml
jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: production
    permissions:
      id-token: write
      contents: read
    steps:
      - uses: actions/download-artifact@v8
        with:
          name: api-service
      - name: Verify provenance
        run: gh attestation verify api-service.tar.gz -R org/api-service
        env:
          GH_TOKEN: ${{ github.token }}
      - name: Sign in to Azure
        uses: azure/login@v3
        with:
          client-id: ${{ vars.AZURE_CLIENT_ID }}
          tenant-id: ${{ vars.AZURE_TENANT_ID }}
          subscription-id: ${{ vars.AZURE_SUBSCRIPTION_ID }}
```

## Reporting Every Failure

A gate that stops at the first failed check hides the rest: the team fixes the issuer, runs the pipeline again and only then learns that the builder is not trusted either. Collecting every failed reason, in a fixed order, turns one rejected deployment into a complete list of what to fix and gives auditors a stable record of why a release was refused.

## Trust Conditions in AWS and Google Cloud

The gate of this lesson models what the clouds check when a job signs in. On AWS the conditions sit in the trust policy of the role:

```json
{
  "Condition": {
    "StringEquals": { "token.actions.githubusercontent.com:aud": "sts.amazonaws.com" },
    "StringLike": { "token.actions.githubusercontent.com:sub": "repo:org/api-service:environment:production" }
  }
}
```

On Google Cloud they sit in the attribute condition of the workload identity provider and in the binding of the service account:

```bash
gcloud iam workload-identity-pools providers update-oidc github-provider \
  --location=global \
  --workload-identity-pool=github-pool \
  --attribute-condition="assertion.repository == 'org/api-service'"
```

## Trust Conditions in Azure

On Azure, the trust is a federated credential of the application. Its issuer, subject and audience are the claims that the gate of this lesson checks:

```json
{
  "name": "github-production",
  "issuer": "https://token.actions.githubusercontent.com",
  "subject": "repo:org/api-service:environment:production",
  "audiences": ["api://AzureADTokenExchange"]
}
```

```bash
az ad app federated-credential create --id APPLICATION_OBJECT_ID --parameters credential.json
```

## Common mistakes

- **Reusing one subject pattern across clouds**: a `StringLike` pattern that works on AWS silently matches nothing when copied into an Azure federated credential, and the deployment fails only at sign-in time.
- **Requesting the wrong audience**: a job that signs in to two clouds must request the audience each one expects; accepting any audience lets a token minted for one cloud be replayed against another.
- **Verifying the identity but not the artifact**: a valid token from the right workflow can still deploy a file that the trusted builder never produced, unless the gate compares the artifact digest with the provenance subjects.

## In practice

A platform team deploys the same service to AWS and Azure from one GitHub Actions workflow. The AWS role trusts `repo:org/api-service:environment:*`, which let a job bound to a forgotten `sandbox` environment assume the production role. The team narrowed the pattern to the production environment, added an exact federated credential on Azure, and put a gate step before both sign-ins that verifies the provenance and prints every failed check. The next rejected release listed an expired token and an untrusted builder in a single run.

## Check yourself

1. Why does AWS refuse a token whose audience is `api://AzureADTokenExchange`, even when the issuer and subject are correct?
2. What happens when a wildcard subject pattern is copied into an Azure federated credential?
3. Which three provenance checks must pass before an artifact is deployed?
