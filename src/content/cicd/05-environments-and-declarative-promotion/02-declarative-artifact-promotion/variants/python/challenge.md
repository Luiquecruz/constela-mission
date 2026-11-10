Validate sequential environment artifact promotion requests.

### Requirements

Implement `validate_environment_promotion(request, history)`:
- `request`: Dict `{ "artifactDigest": str, "targetEnv": str, "promotedBy": str }`.
- `history`: List of dicts `{ "artifactDigest": str, "env": str, "status": str }`.
- Validate SHA256 digest format. Raise ValueError(`"Invalid artifact digest format"`) if invalid.
- Return `{ "allowed": bool, "reason": str }`.
