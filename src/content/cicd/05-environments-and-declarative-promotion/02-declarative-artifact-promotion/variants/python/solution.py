import re

DIGEST_PATTERN = re.compile(r"^sha256:[a-f0-9]{64}$", re.IGNORECASE)

def validate_environment_promotion(request: dict, history: list) -> dict:
    digest = request.get("artifactDigest", "")
    if not DIGEST_PATTERN.match(digest):
        raise ValueError("Invalid artifact digest format")

    target_env = request.get("targetEnv", "")

    if target_env == "staging":
        failed_staging = any(
            h.get("artifactDigest") == digest and h.get("env") == "staging" and h.get("status") == "FAILED"
            for h in history
        )
        if failed_staging:
            return {
                "allowed": False,
                "reason": "Artifact failed prior staging deployment"
            }

        return {
            "allowed": True,
            "reason": "Promotion to staging approved"
        }

    if target_env == "production":
        verified_staging = any(
            h.get("artifactDigest") == digest and h.get("env") == "staging" and h.get("status") == "VERIFIED"
            for h in history
        )
        if not verified_staging:
            return {
                "allowed": False,
                "reason": "Promotion to production requires verified staging deployment"
            }

        return {
            "allowed": True,
            "reason": "Promotion to production approved"
        }

    return {
        "allowed": False,
        "reason": "Unknown target environment"
    }
