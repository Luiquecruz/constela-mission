Validate sequential environment artifact promotion requests.

### Requirements

Implement `validateEnvironmentPromotion(request, history)`:
- `request`: Object containing `{ artifactDigest: string, targetEnv: string, promotedBy: string }`.
- `history`: Array of `{ artifactDigest: string, env: string, status: "VERIFIED" | "FAILED" }`.

Rules:
- Validate `request.artifactDigest` format (`/^sha256:[a-f0-9]{64}$/i`, so either letter case is accepted). Throw Error(`"Invalid artifact digest format"`) if invalid.
- If `request.targetEnv === "staging"`, check if `history` contains a `"FAILED"` entry for this digest in `"staging"`. If so, return `{ allowed: false, reason: "Artifact failed prior staging deployment" }`. Otherwise return `{ allowed: true, reason: "Promotion to staging approved" }`.
- If `request.targetEnv === "production"`, check if `history` contains a `"VERIFIED"` entry for this digest in `"staging"`. If not, return `{ allowed: false, reason: "Promotion to production requires verified staging deployment" }`. Otherwise return `{ allowed: true, reason: "Promotion to production approved" }`.
- If `request.targetEnv` is unrecognized, return `{ allowed: false, reason: "Unknown target environment" }`.
