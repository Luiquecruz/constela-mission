# Software Supply Chain Security and SLSA Provenance

Software supply chain security protects application source code, build pipelines, third-party dependencies, and artifact registries against malicious tampering and injection attacks. As modern software pipelines become automated, attackers increasingly target the build infrastructure itself to inject malware into signed software binaries. Securing the supply chain requires generating unforgeable cryptographic provenance attestations and adopting the Supply-chain Levels for Software Artifacts (SLSA) framework.

You need: Secretless Authentication via OIDC and PBAC

## Case study

In a well-known supply chain attack, the source code of a network management product was clean, but attackers had compromised the build system and inserted malicious code into the compiled update that customers installed. Reviewing the code would not have found it. Build provenance is the answer: a signed statement of which source, builder and steps produced an artifact, so that a deployment can refuse anything that does not match what was expected.

## The Software Supply Chain Threat Model (CICD-SEC-3)

A software supply chain encompasses everything that goes into creating and deploying a software artifact—from first-party source code and third-party dependencies to build scripts, CI runner environments, and registry storage.

Key supply chain attack vectors include:

- **Source Code Tampering**: Unauthorized commits or compromised developer accounts injecting malicious code.
- **Dependency Compromise (CICD-SEC-3)**: Malicious open-source library updates infecting build environments.
- **Build Service Compromise**: Attackers altering build scripts or build server binaries to inject malware during compilation while leaving source code untouched.
- **Artifact Registry Tampering**: Modifying compiled binaries stored in registries after build completion.

## The SLSA Security Framework (Build Levels L1 to L3)

The **Supply-chain Levels for Software Artifacts (SLSA)** specification establishes a progressive compliance framework designed to guarantee artifact integrity and provenance.

SLSA defines three core Build Levels:

- **SLSA Build Level 1 (Scripted & Provenance Generated)**: The build process is fully automated via build scripts, and the build service generates a basic provenance attestation documenting how the artifact was produced.
- **SLSA Build Level 2 (Hosted Build Service & Signed Provenance)**: Build steps run on a dedicated hosted build service (such as GitHub Actions or GitLab CI) rather than developer laptops. Provenance is cryptographically signed by the build service.
- **SLSA Build Level 3 (Isolated Hardened Runners & Unforgeable Provenance)**: Build jobs execute inside ephemeral, isolated build environments with strict network and process isolation. The provenance attestation is unforgeable—meaning build parameters and source SHA hashes cannot be tampered with by application code.

## Cryptographic Provenance, In-Toto Attestations, and Sigstore

A **Provenance Attestation** is an immutable, signed metadata payload (typically adhering to the in-toto specification) certifying the origin and compilation history of a software artifact.

A valid SLSA provenance attestation records:

- **Subject Digest**: The exact SHA256 digest of the output binary artifact.
- **Builder Identity**: The authenticated URI of the trusted build system (e.g., `https://github.com/actions/runner/github-hosted`).
- **Invocation & Source**: The source repository URL, exact commit SHA, and build entry point trigger.

Tools such as **Sigstore (Cosign)** and keyless signing allow build systems to sign provenance attestations and container images using short-lived certificates backed by OIDC identity, removing the need to manage static private signing keys. Pairing provenance with a **Software Bill of Materials (SBOM)** provides complete transparency into all third-party components compiled into a binary.

::: github
A provenance attestation is an in-toto statement: a list of subjects, each one an artifact name with its digest, a predicate type that says what kind of claim it carries, and the predicate itself. For SLSA build provenance the predicate type is `https://slsa.dev/provenance/v1`, and the builder identity sits inside the predicate:

```json
{
  "_type": "https://in-toto.io/Statement/v1",
  "subject": [
    { "name": "api-service.tar.gz", "digest": { "sha256": "b5bb9d8014a0f9b1d61e21e796d78dccdf1352f23cd32812f4850b878ae4944c" } }
  ],
  "predicateType": "https://slsa.dev/provenance/v1",
  "predicate": {
    "buildDefinition": { "buildType": "https://actions.github.io/buildtypes/workflow/v1" },
    "runDetails": { "builder": { "id": "https://github.com/actions/runner/github-hosted" } }
  }
}
```

The challenge flattens `predicate.runDetails.builder` to a top-level `builder` so the checks stay readable; a real verifier reads the nested field.

GitHub Actions produces and signs this statement with the job's OIDC identity. The job needs `id-token: write` to sign and `attestations: write` to store the attestation:

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      id-token: write
      attestations: write
    steps:
      - uses: actions/checkout@v7
      - run: make dist
      - name: Generate artifact attestation
        uses: actions/attest@v4
        with:
          subject-path: dist/api-service.tar.gz
```

The consumer verifies before deploying. The command checks the signature, the digest of the local file against the subjects and the repository that built it:

```bash
gh attestation verify dist/api-service.tar.gz -R org/api-service
```
:::

::: azure
Cosign, from the Sigstore project, signs a container image by digest and works in any pipeline that can request an OIDC identity.

```yaml
# Azure Pipelines
- script: cosign sign "$IMAGE"
  displayName: Sign the image
```
:::

::: aws
```yaml
# AWS CodeBuild buildspec
phases:
  post_build:
    commands:
      - cosign sign "$IMAGE"
```
:::

::: gcp
Google Cloud Build generates and signs build provenance by itself when the build asks for verification:

```yaml
options:
  requestedVerifyOption: VERIFIED
```
:::

## Across the platforms

Azure Pipelines and AWS CodeBuild do not write SLSA provenance on their own. Teams that build there add a signing step with Sigstore tooling, or sign container images with Notation, the signing tool that Azure Container Registry and AWS Signer support, and then run the same three checks at deploy time: the digest is one of the subjects, the predicate type is the expected one and the builder is trusted.

In all four providers the consumer then runs the checks of the challenge: the digest is among the subjects, the predicate type is the expected one and the builder is trusted.

## Common mistakes

- **Generating provenance on local developer laptops**: Creating provenance attestations outside an isolated, hosted build service invalidates SLSA Level 2+ trust.
- **Using static, long-lived GPG keys for artifact signing**: Storing private signing keys on persistent build servers exposes keys to exfiltration.
- **Failing to verify provenance digests before deployment**: Generating provenance attestations without validating them during deployment quality gates negates supply chain protection.

## In practice

Try it in a repository of your own.

1. Build the artifact with a pipeline that produces provenance or sign the image in the build step.
2. Verify the signature or the attestation from your machine with the command of the examples.
3. Change one byte of the artifact and verify again.

The challenge verifies provenance against the digest, the builder and the source.

## Check yourself

1. What are the core security requirements for achieving SLSA Build Level 3 compliance?
2. What key information fields are recorded inside an in-toto provenance attestation?
3. How does Sigstore keyless signing simplify cryptographic artifact signing?
