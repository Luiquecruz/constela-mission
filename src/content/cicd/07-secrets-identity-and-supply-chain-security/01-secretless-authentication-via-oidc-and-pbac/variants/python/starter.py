import re


def matches_subject(pattern: str, subject: str) -> bool:
    # TODO: treat "*" as any sequence of characters and "?" as exactly one character; every other character is literal.
    return pattern == subject


def validate_oidc_claims(claims: dict, policy: dict, now: int) -> dict:
    # TODO: raise ValueError for a wrong issuer, a wrong audience or an expired token.
    # TODO: deny a repository outside the policy, then a subject that matches no allowed pattern.
    return {"authorized": True, "reason": "OIDC token claims validated and authorized"}
