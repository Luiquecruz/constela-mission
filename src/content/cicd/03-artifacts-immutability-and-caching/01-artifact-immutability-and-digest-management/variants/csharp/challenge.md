Verify artifact digest integrity against expected cryptographic checksums.

### Requirements

Implement `VerifyArtifactImmutability(artifact, expectedDigest)`:
- `artifact`: `ArtifactMeta(string Name, string Version, string Digest)`.
- `expectedDigest`: SHA256 string.

Rules:
- Validate `expectedDigest` format. Throw ArgumentException(`"Invalid SHA256 digest format"`) if invalid.
- Return `VerificationResult(bool Verified, bool Match, string Reason)`.
