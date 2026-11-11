# Dependency Management and Security Scanning

Modern software applications rely heavily on open-source libraries and third-party packages. While third-party dependencies accelerate development, they also introduce significant security and supply chain risks. Managing dependencies securely requires locking exact package versions, verifying cryptographic checksums, and integrating automated security scanning into the build pipeline.

You need: Automated Build and Commit Suite

## Case study

A major credit reporting company was breached through a web framework flaw for which a fix had been published weeks earlier. The vulnerable component was running in an internet-facing application, and nothing in the delivery process forced the update or reported that it was missing. The attackers had access for months. Dependency pinning, automated scanning and a gate that fails the build turn "someone should update that" into a check that cannot be skipped.

## Dependency Pinning and Lockfiles

To ensure build reproducibility and prevent unauthorized dependency updates, projects must strictly lock package versions. Allowing package managers to resolve floating version ranges (such as `^1.2.0` or `latest`) creates non-deterministic builds and exposes applications to malicious package releases.

Key practices for secure dependency locking include:

- **Mandatory Lockfiles**: Committing exact lockfiles (such as `package-lock.json`, `go.sum`, or `Cargo.lock`) into version control.
- **Checksum Verification**: Validating downloaded package hashes against expected SHA256 checksums recorded in lockfiles to detect tampered packages.
- **Scoped Registries**: Routing dependency downloads through internal private proxy registries and enforcing scoped package prefixes (`@org/package`) to mitigate dependency confusion attacks.

::: github
The lockfile is what every provider installs from. In GitHub Actions:

```yaml
- run: npm ci
```
:::

::: azure
In Azure Pipelines:

```yaml
- script: npm ci
  displayName: Install from the lockfile
```
:::

::: aws
In AWS CodeBuild:

```yaml
version: 0.2
phases:
  build:
    commands:
      - npm ci
```
:::

::: gcp
In Google Cloud Build the step uses the Node image:

```yaml
steps:
  - name: node
    entrypoint: bash
    args: ['-c', 'npm ci']
```
:::

## Automated Security Scanning: SAST and SCA

Integrating security scanning directly into early pipeline stages (*Shift-Left Security*) prevents vulnerabilities from reaching staging and production environments.

Two core security scanning mechanisms are:

### 1. Static Application Security Testing (SAST)
SAST tools scan the application's first-party source code for security flaws, such as SQL injection risks, insecure cryptographic usages, hardcoded credentials, and unsafe data deserialization.

### 2. Software Composition Analysis (SCA)
SCA tools inspect third-party dependencies against vulnerability databases (such as CVE lists) to identify known security flaws in imported libraries and verify open-source license compliance.

::: github
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
:::

::: azure
A pipeline step publishes the test and coverage results so that a gate can read them. The gate applies a minimum coverage, a severity threshold and a list of violations, which is the evaluation the challenge models. Microsoft Defender for Cloud scans the images that Azure Container Registry stores.

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
:::

::: aws
On AWS, Amazon ECR can scan every image when it is pushed, which turns on with one setting of the repository:

```bash
aws ecr put-image-scanning-configuration \
  --repository-name api-service \
  --image-scanning-configuration scanOnPush=true
```
:::

::: gcp
On Google Cloud, Artifact Analysis scans the images pushed to Artifact Registry once its scanning API is enabled for the project:

```bash
gcloud services enable containerscanning.googleapis.com
```
:::

## Dependency Chain Abuse (CICD-SEC-3)

The OWASP Top 10 CI/CD Security Risks framework highlights **Dependency Chain Abuse (CICD-SEC-3)** as a major attack vector. Attackers exploit weak dependency management through several techniques:

- **Dependency Confusion**: Publishing malicious public packages with names identical to internal private packages, tricking package managers into downloading the public version.
- **Typosquatting**: Registering package names with common spelling mistakes of popular libraries (e.g., `reqeusts` instead of `requests`).
- **Account Takeover**: Compromising open-source maintainer accounts to push infected library updates.

Enforcing strict lockfile verification, private registry proxies, and automated SCA scanning neutralizes these supply chain attack vectors.

::: github
A build that audits the lockfile and fails on high findings blocks a known-bad package before it ships. In GitHub Actions:

```yaml
- run: npm audit --audit-level=high
```
:::

::: azure
In Azure Pipelines:

```yaml
- script: npm audit --audit-level=high
  displayName: Audit dependencies
```
:::

::: aws
In AWS CodeBuild:

```yaml
version: 0.2
phases:
  build:
    commands:
      - npm audit --audit-level=high
```
:::

::: gcp
In Google Cloud Build:

```yaml
steps:
  - name: node
    entrypoint: bash
    args: ['-c', 'npm audit --audit-level=high']
```
:::

## Across the platforms

In every provider, a pipeline step reads the finding counts and applies the gate that the challenge models.

## Common mistakes

- **Omitting lockfiles from Git**: Omitting lockfiles from version control causes build machines to download unpredictable dependency versions.
- **Ignoring SCA vulnerability warnings**: Treating security scanner outputs as non-blocking alerts allows known CVE vulnerabilities into production binaries.
- **Downloading dependencies from public registries without verification**: Allowing unverified direct downloads from public package mirrors exposes pipelines to malicious package substitutions. Unreviewed updates widen the attack surface with every release.

## In practice

Try it in a repository of your own.

1. Turn on dependency updates and the dependency review check for pull requests, or the scanning of images in the registry of your platform.
2. Add a dependency with a known vulnerability on a branch and see the check fail.
3. Decide which severities block the merge and which only warn, and write the rule down.

The challenge evaluates test and security results against exactly such a rule.

## Check yourself

1. What role do lockfiles play in securing software dependency management?
2. What is the fundamental functional difference between SAST and SCA security scanning?
3. How does dependency confusion exploit package resolution rules?
