Verify SLSA v1.0 build provenance attestations against artifact digest policies.

### Requirements

Implement `VerifySlsaProvenance(artifactDigest, provenance, policy)`:
- `artifactDigest`: string, for example `"sha256:<64 hexadecimal characters (either letter case)>"`.
- `provenance`: `SlsaProvenanceStatement(string PredicateType, SlsaBuilderInfo Builder, SlsaSubjectItem[] Subject)`, where a subject has a name and a digest dictionary.
- `policy`: `SlsaVerificationPolicy(string ExpectedPredicateType, string[] AllowedBuilderIds)`.
- Returns `SlsaVerificationResult(bool Valid, string Reason)`.

Rules, checked in this order:
- The digest must match `sha256:` followed by 64 hexadecimal characters (either letter case). Otherwise throw `ArgumentException` with the message `"Invalid artifact digest format"`, before reading the statement.
- If `PredicateType` differs from `ExpectedPredicateType`, return invalid with the reason `"Unsupported SLSA predicate type"`.
- Look for a subject whose `sha256` digest equals the 64 characters of `artifactDigest` after `"sha256:"`, ignoring the letter case of the hexadecimal. If no subject matches, return invalid with `"Artifact digest not found in provenance subject"`.
- If `AllowedBuilderIds` does not contain the builder id, return invalid with `"Builder ID not trusted by SLSA policy"`.
- Otherwise return valid with `"SLSA provenance verified successfully"`.
