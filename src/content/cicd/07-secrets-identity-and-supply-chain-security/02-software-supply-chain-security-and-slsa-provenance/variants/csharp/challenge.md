Verify SLSA v1.0 build provenance attestations against artifact digest policies.

### Requirements

Implement `VerifySlsaProvenance(artifactDigest, provenance, policy)`:
- `artifactDigest`: string.
- `provenance`: `SlsaProvenanceStatement(string PredicateType, SlsaBuilderInfo Builder, SlsaSubjectItem[] Subject)`.
- `policy`: `SlsaVerificationPolicy(string ExpectedPredicateType, string[] AllowedBuilderIds)`.
- Returns `SlsaVerificationResult(bool Valid, string Reason)`.
