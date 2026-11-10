Verify SLSA v1.0 build provenance attestations against artifact digest policies.

### Requirements

Implement `verify_slsa_provenance(artifact_digest, provenance, policy)`:
- `artifact_digest`: String checksum (`"sha256:<64 lowercase hexadecimal characters>"`).
- `provenance`: Dict `{ "predicateType": str, "builder": { "id": str }, "subject": list[dict] }`, where a subject is `{ "name": str, "digest": { "sha256": str } }`.
- `policy`: Dict `{ "expectedPredicateType": str, "allowedBuilderIds": list[str] }`.
- Return `{ "valid": bool, "reason": str }`.

Rules, checked in this order:
- The digest must match `sha256:` followed by 64 lowercase hexadecimal characters. Otherwise raise `ValueError("Invalid artifact digest format")`, before reading the statement.
- If `predicateType` differs from `expectedPredicateType`, return invalid with the reason `"Unsupported SLSA predicate type"`.
- Look for a subject whose `sha256` digest equals the 64 characters of `artifact_digest` after `"sha256:"`, ignoring the letter case of the hexadecimal. If no subject matches, return invalid with `"Artifact digest not found in provenance subject"`.
- If `allowedBuilderIds` does not contain the builder id, return invalid with `"Builder ID not trusted by SLSA policy"`.
- Otherwise return valid with `"SLSA provenance verified successfully"`.
