Verify SLSA v1.0 build provenance attestations against artifact digest policies.

### Requirements

Implement `verify_slsa_provenance(artifact_digest, provenance, policy)`:
- `artifact_digest`: String checksum (`"sha256:<64-hex>"`).
- `provenance`: Dict `{ "predicateType": str, "builder": { "id": str }, "subject": list[dict] }`.
- `policy`: Dict `{ "expectedPredicateType": str, "allowedBuilderIds": list[str] }`.
- Return `{ "valid": bool, "reason": str }`.
