# Validating OIDC Policies and SLSA Attestations

A deployment job holds two pieces of evidence: a short-lived identity token that says which workflow is running, and a provenance attestation that says which builder produced the artifact. Each cloud decides on its own whether to trust the token, and each cloud does it slightly differently. A deployment gate checks both pieces of evidence the way the target cloud will, before the job signs in, so a misconfigured trust or a substituted artifact stops the pipeline with a clear reason instead of failing halfway through a release.

You need: Secretless Authentication via OIDC and PBAC, Software Supply Chain Security and SLSA Provenance

## Case study

A widely used action for finding changed files in a repository was compromised: the attacker moved existing version tags to a malicious commit, and runs of the action that used one of those tags could print secrets found in the runner's memory into the workflow logs. The advice that followed was to pin actions to full commit hashes, which cannot be reassigned. A gate that checks identity, audience and provenance, and a habit of pinning to immutable references, is what separates a trusted input from a name someone can reassign.

## Reporting Every Failure

A gate that stops at the first failed check hides the rest: the team fixes the issuer, runs the pipeline again and only then learns that the builder is not trusted either. Collecting every failed reason, in a fixed order, turns one rejected deployment into a complete list of what to fix and gives auditors a stable record of why a release was refused.

::: github
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
:::

::: azure
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
:::

::: aws
The gate of this lesson models what the clouds check when a job signs in. On AWS the conditions sit in the trust policy of the role:

```json
{
  "Condition": {
    "StringEquals": { "token.actions.githubusercontent.com:aud": "sts.amazonaws.com" },
    "StringLike": { "token.actions.githubusercontent.com:sub": "repo:org/api-service:environment:production" }
  }
}
```
:::

::: gcp
On Google Cloud they sit in the attribute condition of the workload identity provider and in the binding of the service account:

```bash
gcloud iam workload-identity-pools providers update-oidc github-provider \
  --location=global \
  --workload-identity-pool=github-pool \
  --attribute-condition="assertion.repository == 'org/api-service'"
```
:::

## Across the platforms

GitHub Actions issues the same token whichever cloud the job talks to; what changes is the audience the job requests and the way the cloud compares the subject.

| Check | AWS (IAM role trust policy) | Azure (federated identity credential) |
| --- | --- | --- |
| Issuer | the OIDC provider registered in the account | the `issuer` field of the credential |
| Audience | `sts.amazonaws.com` | `api://AzureADTokenExchange` |
| Subject | `StringEquals` for one value or `StringLike` with `*` and `?` | one exact `subject` per credential |
| Several branches or environments | one pattern can cover them | one credential per subject |

Google Cloud sits between the two: the provider copies claims into attributes, and an attribute condition on the provider, such as `assertion.repository == 'org/api-service'`, decides which workflows are admitted, while the service account binding narrows each one further.

The audience protects against replay: a token minted for Azure carries `api://AzureADTokenExchange` and is refused by AWS, so a token stolen from one deployment cannot be spent against another cloud. The subject rule decides how wide the door is. On AWS, `repo:org/api-service:environment:*` admits every environment of the repository, which is convenient for staging and dangerous for production; on Azure, writing that same string into a federated credential admits nothing, because the asterisk is compared as a character.

## Common mistakes

- **Reusing one subject pattern across clouds**: a `StringLike` pattern that works on AWS silently matches nothing when copied into an Azure federated credential, and the deployment fails only at sign-in time.
- **Requesting the wrong audience**: a job that signs in to two clouds must request the audience each one expects; accepting any audience lets a token minted for one cloud be replayed against another.
- **Verifying the identity but not the artifact**: a valid token from the right workflow can still deploy a file that the trusted builder never produced, unless the gate compares the artifact digest with the provenance subjects.

## In practice

Try it in a repository of your own.

1. Write the trust rule for production so that it names the repository, the environment and the audience.
2. Make a deployment from a workflow that does not match and see it refused.
3. Pin the third-party actions you use to full commit hashes.

The challenge is the gate that authorizes a deployment from the token and the provenance.

## Check yourself

1. Why does AWS refuse a token whose audience is `api://AzureADTokenExchange`, even when the issuer and subject are correct?
2. What happens when a wildcard subject pattern is copied into an Azure federated credential?
3. Which three provenance checks must pass before an artifact is deployed?
