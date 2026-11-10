Validate sequential environment artifact promotion requests.

### Requirements

Implement `validate_environment_promotion(request, history)`:
- `request`: Dict `{ "artifactDigest": str, "targetEnv": str, "promotedBy": str }`.
- `history`: List of dicts `{ "artifactDigest": str, "env": str, "status": str }`, where `status` is `"VERIFIED"` or `"FAILED"`.
- Return `{ "allowed": bool, "reason": str }`.

Rules:
- The digest must match `sha256:` followed by 64 lowercase hexadecimal characters. Otherwise raise `ValueError("Invalid artifact digest format")`.
- Target `"staging"`: if `history` has a `"FAILED"` entry for this digest in `"staging"`, return not allowed with the reason `"Artifact failed prior staging deployment"`. Otherwise return allowed with `"Promotion to staging approved"`.
- Target `"production"`: if `history` has no `"VERIFIED"` entry for this digest in `"staging"` (entries of other digests or other environments do not count), return not allowed with `"Promotion to production requires verified staging deployment"`. Otherwise return allowed with `"Promotion to production approved"`.
- Any other target returns not allowed with the reason `"Unknown target environment"`.
