Verify artifact digest integrity against expected cryptographic checksums.

### Requirements

Implement `verify_artifact_immutability(artifact, expected_digest)`:
- `artifact`: Dict containing `{ "name": str, "version": str, "digest": str }`.
- `expected_digest`: SHA256 string.

Rules:
- Validate `expected_digest` format (`^sha256:[a-f0-9]{64}$`). If invalid, raise ValueError(`"Invalid SHA256 digest format"`).
- Compare `artifact["digest"]` with `expected_digest` case-insensitively.
- Return `{ "verified": True, "match": bool, "reason": str }`.
