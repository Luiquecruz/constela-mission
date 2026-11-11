Verify artifact digest integrity against expected cryptographic checksums.

### Requirements

Implement the public static method `VerifyArtifactImmutability(artifact, expectedDigest)` of the static class `ArtifactVerifier`:
- `artifact`: `ArtifactMeta(string Name, string Version, string Digest)`.
- `expectedDigest`: SHA256 string.

Rules:
- Validate `expectedDigest`: `sha256:` followed by 64 hexadecimal characters, in either letter case, matching the whole string. Throw ArgumentException(`"Invalid SHA256 digest format"`) if invalid.
- Compare `artifact.Digest` with `expectedDigest` ignoring letter case.
- Return `VerificationResult(bool Verified, bool Match, string Reason)`: `Verified` is always `true`; when the digests match, `Match` is `true` and `Reason` is `"Artifact digest matches expected checksum"`; otherwise `Match` is `false` and `Reason` is `"Artifact digest mismatch detected"`.
