Verify artifact digest integrity against expected cryptographic checksums.

### Requirements

Implement `verifyArtifactImmutability(artifact, expectedDigest)`:
- `artifact`: Object containing `{ name: string, version: string, digest: string }`.
- `expectedDigest`: SHA256 string to compare against `artifact.digest`.

Rules:
- Validate `expectedDigest` format (`/^sha256:[a-f0-9]{64}$/`). If invalid, throw Error(`"Invalid SHA256 digest format"`).
- Compare `artifact.digest` with `expectedDigest` case-insensitively.
- If digests match, return `{ verified: true, match: true, reason: "Artifact digest matches expected checksum" }`.
- If digests differ, return `{ verified: true, match: false, reason: "Artifact digest mismatch detected" }`.
