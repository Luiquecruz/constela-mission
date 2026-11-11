Verify SLSA v1.0 build provenance attestations against artifact digest policies.

### Requirements

Implement `verifySlsaProvenance(artifactDigest, provenance, policy)`:
- `artifactDigest`: String expected digest (e.g., `"sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"`).
- `provenance`: Object containing `{ predicateType: string, builder: { id: string }, subject: Array<{ name: string, digest: Record<string, string> }> }`.
- `policy`: Object containing `{ expectedPredicateType: string, allowedBuilderIds: string[] }`.

Rules:
- Validate `artifactDigest` format (`/^sha256:[a-f0-9]{64}$/i`, so either letter case is accepted). Throw Error(`"Invalid artifact digest format"`) if invalid.
- If `provenance.predicateType !== policy.expectedPredicateType`, return `{ valid: false, reason: "Unsupported SLSA predicate type" }`.
- Find a subject in `provenance.subject` whose `digest.sha256` matches the raw 64-hex-character string from `artifactDigest` (after stripping `"sha256:"`), ignoring the letter case of the hexadecimal. If not found, return `{ valid: false, reason: "Artifact digest not found in provenance subject" }`.
- If `policy.allowedBuilderIds` does not contain `provenance.builder.id`, return `{ valid: false, reason: "Builder ID not trusted by SLSA policy" }`.
- Otherwise return `{ valid: true, reason: "SLSA provenance verified successfully" }`.
