Validate sequential environment artifact promotion requests.

### Requirements

Implement `ValidateEnvironmentPromotion(request, history)`:
- `request`: `PromotionRequest(string ArtifactDigest, string TargetEnv, string PromotedBy)`.
- `history`: `DeploymentHistoryEntry[]`, each with the artifact digest, the environment and the status (`"VERIFIED"` or `"FAILED"`).
- Returns `PromotionDecision(bool Allowed, string Reason)`.

Rules:
- The digest must match `sha256:` followed by 64 lowercase hexadecimal characters. Otherwise throw `ArgumentException` with the message `"Invalid artifact digest format"`.
- Target `"staging"`: if `history` has a `"FAILED"` entry for this digest in `"staging"`, return not allowed with the reason `"Artifact failed prior staging deployment"`. Otherwise return allowed with `"Promotion to staging approved"`.
- Target `"production"`: if `history` has no `"VERIFIED"` entry for this digest in `"staging"` (entries of other digests or other environments do not count), return not allowed with `"Promotion to production requires verified staging deployment"`. Otherwise return allowed with `"Promotion to production approved"`.
- Any other target returns not allowed with the reason `"Unknown target environment"`.
