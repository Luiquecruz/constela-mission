# Secretless Authentication via OIDC and PBAC

Managing credentials in continuous integration pipelines presents one of the most critical security challenges in modern software delivery. Traditional delivery pipelines stored long-lived administrative API keys or static passwords directly in CI secrets vaults. If a pipeline runner is compromised or a build log is misconfigured, long-lived credentials can be exfiltrated, exposing cloud infrastructure to unauthorized access. Modern secure pipelines eliminate static secrets by adopting secretless authentication via OpenID Connect (OIDC) and enforcing Pipeline-Based Access Control (PBAC).

You need: Deciding Canary Rollout Steps

## Eliminating Static Long-Lived Credentials (CICD-SEC-6)

The OWASP Top 10 CI/CD Security Risks framework highlights **Insufficient Credential Hygiene (CICD-SEC-6)** as a major vulnerability vector, next to **Inadequate Identity and Access Management (CICD-SEC-2)**. In secure delivery architectures, static credentials (such as AWS IAM access keys or persistent SSH keys) are completely removed from CI runner environments.

Static credentials introduce severe risks:

- **Credential Exfiltration**: Malicious pull request code or compromised third-party dependencies can scan runner environment variables and exfiltrate secrets to external servers.
- **Unbounded Lifetimes**: Long-lived keys remain valid indefinitely until manually rotated, granting attackers persistent access if leaked.
- **Lack of Granular Scoping**: Static credentials often possess broad, multi-repository permissions rather than minimal single-task authorization.

Eliminating static secrets requires transitioning to short-lived, dynamically minted tokens that expire automatically within minutes.

## Workload Identity Federation via OIDC and SPIFFE/SPIRE

OpenID Connect (OIDC) Workload Identity Federation allows CI/CD pipeline runners to authenticate directly with cloud providers (such as AWS, GCP, Azure, or Vault) without storing static secret keys.

The secretless authentication exchange flows through standardized identity protocols:

1. **Identity Request**: When a pipeline job requiring cloud access begins execution, the CI platform issues a short-lived, cryptographically signed JSON Web Token (JWT) OIDC token containing runner identity claims (repository name, target branch, event trigger type).
2. **Token Exchange**: The runner presents this OIDC JWT token to the cloud provider's Identity and Access Management (IAM) endpoint.
3. **Claim Verification**: The cloud IAM endpoint validates the OIDC token signature against the CI provider's public keys and inspects the token claims.
4. **Temporary Token Issuance**: If the claims match configured trust policies, the cloud provider issues a temporary, short-lived IAM session token (valid for e.g. 15 minutes).

In multi-cloud or hybrid enterprise environments, frameworks such as **SPIFFE (Secure Production Identity Framework for Everyone)** and **SPIRE (SPIFFE Runtime Environment)** extend workload identity by issuing cryptographically verifiable SPIFFE IDs (SVIDs) to ephemeral build containers, establishing fine-grained identity without secret distribution.

## Pipeline-Based Access Control (PBAC) and Least Privilege (CICD-SEC-5)

Deploying secretless identity requires pairing OIDC token generation with **Pipeline-Based Access Control (PBAC)** under **OWASP CICD-SEC-5 (Insufficient PBAC)**.

PBAC enforces granular, claim-based authorization rules:

- **Repository and Branch Binding**: A cloud IAM role authorized to deploy to production must verify that the incoming OIDC token originates strictly from `repository: org/app` AND `ref: refs/heads/main`.
- **Job-Level Scope**: Access tokens are granted exclusively to specific pipeline execution steps (e.g., the `deploy` job), while static linting or unit test jobs receive zero cloud identity permissions.
- **Environment Claims**: Requiring OIDC claims to match specific protected environments before releasing sensitive infrastructure access.
## Configuring the Trust in GitHub Actions, AWS and Azure

The token only proves who the job is. The trust lives on the cloud side, in a policy that compares the token's claims with fixed values. In GitHub Actions the issuer is `https://token.actions.githubusercontent.com`, and the `sub` claim encodes where the job ran: `repo:ORG/REPO:ref:refs/heads/BRANCH` for a branch, `repo:ORG/REPO:ref:refs/tags/TAG` for a tag, `repo:ORG/REPO:environment:NAME` for a job bound to an environment and `repo:ORG/REPO:pull_request` for a pull request. Newer repositories can use an immutable subject format that adds numeric owner and repository ids, so copy the exact subject from the provider documentation instead of guessing it.

A workflow asks for a token by granting `id-token: write`, and only the job that deploys should receive it:

```yaml
permissions:
  contents: read

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: production
    permissions:
      id-token: write
      contents: read
    steps:
      - uses: actions/checkout@v7
      - name: Sign in to AWS
        uses: aws-actions/configure-aws-credentials@v6
        with:
          role-to-assume: arn:aws:iam::111122223333:role/deploy-api-service
          aws-region: eu-west-1
      - name: Sign in to Azure
        uses: azure/login@v3
        with:
          client-id: ${{ vars.AZURE_CLIENT_ID }}
          tenant-id: ${{ vars.AZURE_TENANT_ID }}
          subscription-id: ${{ vars.AZURE_SUBSCRIPTION_ID }}
```

Pin third-party actions to a full commit SHA in production workflows; a tag such as `@v4` can be moved to different code. The client, tenant and subscription ids are identifiers, not secrets: nothing in this workflow can be replayed by someone who copies it.

On AWS, the role's trust policy accepts the token through `sts:AssumeRoleWithWebIdentity`. The audience must be `sts.amazonaws.com`, and the subject is checked with `StringEquals` for one exact value or `StringLike` for a pattern:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": { "Federated": "arn:aws:iam::111122223333:oidc-provider/token.actions.githubusercontent.com" },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": { "token.actions.githubusercontent.com:aud": "sts.amazonaws.com" },
        "StringLike": { "token.actions.githubusercontent.com:sub": "repo:org/api-service:environment:production" }
      }
    }
  ]
}
```

On Azure, a federated identity credential on a Microsoft Entra application or user-assigned managed identity names the issuer, one exact subject and the audience `api://AzureADTokenExchange`, which `azure/login` requests by default:

```json
{
  "name": "api-service-production",
  "issuer": "https://token.actions.githubusercontent.com",
  "subject": "repo:org/api-service:environment:production",
  "audiences": ["api://AzureADTokenExchange"]
}
```

On Google Cloud, a workload identity pool holds a provider that trusts the issuer. The attribute mapping copies claims into attributes, and the service account is bound to a principal set that names the one repository allowed to impersonate it:

```bash
gcloud iam workload-identity-pools create github-pool --location=global

gcloud iam workload-identity-pools providers create-oidc github-provider \
  --location=global \
  --workload-identity-pool=github-pool \
  --issuer-uri="https://token.actions.githubusercontent.com/" \
  --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository" \
  --attribute-condition="assertion.repository == 'org/api-service'"

gcloud iam service-accounts add-iam-policy-binding deploy@PROJECT_ID.iam.gserviceaccount.com \
  --role=roles/iam.workloadIdentityUser \
  --member="principalSet://iam.googleapis.com/projects/PROJECT_NUMBER/locations/global/workloadIdentityPools/github-pool/attribute.repository/org/api-service"
```

The workflow then names the provider and the service account, and needs `id-token: write` like the other clouds:

```yaml
- uses: google-github-actions/auth@v3
  with:
    workload_identity_provider: projects/PROJECT_NUMBER/locations/global/workloadIdentityPools/github-pool/providers/github-provider
    service_account: deploy@PROJECT_ID.iam.gserviceaccount.com
```

Azure Pipelines uses the same mechanism through a workload identity federation service connection: Azure DevOps generates the issuer and the subject identifier for the connection, you register them as a federated credential, and tasks refer only to the connection name. AWS CodeBuild runs inside AWS, so a build takes its permissions from the project's service role and needs no token exchange; the OIDC trust is what lets builds running outside AWS reach it without access keys.

```yaml
steps:
  - task: AzureCLI@2
    inputs:
      azureSubscription: api-service-production
      scriptType: bash
      scriptLocation: inlineScript
      inlineScript: az account show
```

## Common mistakes

- **Storing long-lived cloud credentials in CI secret variables**: Hardcoding permanent IAM access keys inside pipeline repository settings exposes infrastructure to secret exfiltration.
- **Wildcard OIDC claim matching**: Configuring cloud IAM trust policies with wildcard repository claims (`sub: repo:org/*`) allows any repository in an organization to assume production roles.
- **Granting identity tokens to unreviewed PR jobs**: Permitting untrusted pull requests from external forks to request production-scoped OIDC tokens creates critical vulnerability gaps.

## In practice

A cloud services company previously stored static AWS IAM administrator credentials in their CI repository settings. An attacker submitted a malicious Pull Request that injected a print statement into a build script, dumping the environment variables and exfiltrating the static AWS keys.

The security team eliminated static secrets by implementing OIDC federation. They deleted all static keys and configured AWS IAM trust policies to accept OIDC tokens issued by their CI provider. The policy mandates that production deployment roles can only be assumed if the OIDC token proves the build ran on the protected `main` branch. Unreviewed PRs no longer have access to cloud credentials.

## Check yourself

1. Why are long-lived static API keys considered a major security risk in CI/CD pipelines?
2. What are the four steps in an OIDC workload identity token exchange flow?
3. How does Pipeline-Based Access Control (PBAC) prevent feature branch builds from accessing production cloud resources?
