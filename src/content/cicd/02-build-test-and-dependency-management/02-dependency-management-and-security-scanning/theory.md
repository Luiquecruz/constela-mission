# Dependency Management and Security Scanning

Modern software applications rely heavily on open-source libraries and third-party packages. While third-party dependencies accelerate development, they also introduce significant security and supply chain risks. Managing dependencies securely requires locking exact package versions, verifying cryptographic checksums, and integrating automated security scanning into the build pipeline.

You need: Automated Build and Commit Suite

## Dependency Pinning and Lockfiles

To ensure build reproducibility and prevent unauthorized dependency updates, projects must strictly lock package versions. Allowing package managers to resolve floating version ranges (such as `^1.2.0` or `latest`) creates non-deterministic builds and exposes applications to malicious package releases.

Key practices for secure dependency locking include:

- **Mandatory Lockfiles**: Committing exact lockfiles (such as `package-lock.json`, `go.sum`, or `Cargo.lock`) into version control.
- **Checksum Verification**: Validating downloaded package hashes against expected SHA256 checksums recorded in lockfiles to detect tampered packages.
- **Scoped Registries**: Routing dependency downloads through internal private proxy registries and enforcing scoped package prefixes (`@org/package`) to mitigate dependency confusion attacks.
## Automated Security Scanning: SAST and SCA

Integrating security scanning directly into early pipeline stages (*Shift-Left Security*) prevents vulnerabilities from reaching staging and production environments.

Two core security scanning mechanisms are:

### 1. Static Application Security Testing (SAST)
SAST tools scan the application's first-party source code for security flaws, such as SQL injection risks, insecure cryptographic usages, hardcoded credentials, and unsafe data deserialization.

### 2. Software Composition Analysis (SCA)
SCA tools inspect third-party dependencies against vulnerability databases (such as CVE lists) to identify known security flaws in imported libraries and verify open-source license compliance.
## Dependency Chain Abuse (CICD-SEC-3)

The OWASP Top 10 CI/CD Security Risks framework highlights **Dependency Chain Abuse (CICD-SEC-3)** as a major attack vector. Attackers exploit weak dependency management through several techniques:

- **Dependency Confusion**: Publishing malicious public packages with names identical to internal private packages, tricking package managers into downloading the public version.
- **Typosquatting**: Registering package names with common spelling mistakes of popular libraries (e.g., `reqeusts` instead of `requests`).
- **Account Takeover**: Compromising open-source maintainer accounts to push infected library updates.

Enforcing strict lockfile verification, private registry proxies, and automated SCA scanning neutralizes these supply chain attack vectors.
## Dependency Scanning in Each Provider

Scanning belongs in the pull request, where a finding can still be fixed cheaply. Each provider has a native place for it.

On GitHub, Dependabot opens update pull requests from a file in the repository, and the dependency review action fails a pull request that introduces a vulnerable dependency:

```yaml
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: npm
    directory: /
    schedule:
      interval: weekly
```

```yaml
# .github/workflows/dependency-review.yml
name: dependency review
on: pull_request
permissions:
  contents: read
jobs:
  review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
      - uses: actions/dependency-review-action@v5
        with:
          fail-on-severity: high
```

The other clouds scan the artifact they store rather than the pull request: Amazon Inspector scans container images pushed to Amazon ECR, Artifact Analysis scans images in Google Artifact Registry, and Microsoft Defender for Cloud scans images in Azure Container Registry. In all of them a pipeline step reads the finding counts and applies a gate, which is the evaluation the challenge models: a minimum coverage, a threshold severity and a list of violations.

```yaml
# Azure Pipelines: publish test and coverage results so the gate can read them
- task: PublishTestResults@2
  inputs:
    testResultsFormat: JUnit
    testResultsFiles: junit.xml
- task: PublishCodeCoverageResults@2
  inputs:
    summaryFileLocation: coverage/cobertura-coverage.xml
```

## Image Scanning in AWS and Google Cloud

On AWS, Amazon ECR can scan every image when it is pushed, which turns on with one setting of the repository:

```bash
aws ecr put-image-scanning-configuration \
  --repository-name api-service \
  --image-scanning-configuration scanOnPush=true
```

On Google Cloud, Artifact Analysis scans the images pushed to Artifact Registry once its scanning API is enabled for the project:

```bash
gcloud services enable containerscanning.googleapis.com
```

In both clouds the pipeline then reads the findings and applies the gate that the challenge models.

## Common mistakes

- **Omitting lockfiles from Git**: Omitting lockfiles from version control causes build machines to download unpredictable dependency versions.
- **Ignoring SCA vulnerability warnings**: Treating security scanner outputs as non-blocking alerts allows known CVE vulnerabilities into production binaries.
- **Downloading dependencies from public registries without verification**: Allowing unverified direct downloads from public package mirrors exposes pipelines to malicious package substitutions. Unreviewed updates widen the attack surface with every release.

## In practice

A web platform team integrated an automated SCA security scanner into their CI pipeline. During a routine build, the scanner flagged a critical remote code execution vulnerability (CVE) in a transitive utility library imported by a logging framework.

Because the SCA check was configured as a mandatory quality gate, the pipeline automatically failed the build, preventing the vulnerable dependency from being packaged into the production container image.

## Check yourself

1. What role do lockfiles play in securing software dependency management?
2. What is the fundamental functional difference between SAST and SCA security scanning?
3. How does dependency confusion exploit package resolution rules?
