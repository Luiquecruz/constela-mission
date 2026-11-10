import re


def matches_subject(pattern: str, subject: str) -> bool:
    parts = []
    for character in pattern:
        if character == "*":
            parts.append(".*")
        elif character == "?":
            parts.append(".")
        else:
            parts.append(re.escape(character))
    return re.fullmatch("".join(parts), subject) is not None


def validate_oidc_claims(claims: dict, policy: dict, now: int) -> dict:
    if claims["iss"] != policy["expectedIssuer"]:
        raise ValueError("Invalid OIDC issuer")
    if claims["aud"] != policy["expectedAudience"]:
        raise ValueError("Invalid OIDC audience")
    if claims["exp"] <= now:
        raise ValueError("OIDC token expired")
    if claims["repository"] not in policy["allowedRepositories"]:
        return {"authorized": False, "reason": "Repository not allowed by OIDC policy"}
    if not any(matches_subject(pattern, claims["sub"]) for pattern in policy["allowedSubjects"]):
        return {"authorized": False, "reason": "Subject not allowed by OIDC policy"}
    return {"authorized": True, "reason": "OIDC token claims validated and authorized"}
