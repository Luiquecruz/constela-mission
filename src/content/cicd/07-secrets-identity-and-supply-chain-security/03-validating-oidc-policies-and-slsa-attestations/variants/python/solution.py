import re

SLSA_PROVENANCE = "https://slsa.dev/provenance/v1"


def expected_audience(target: str) -> str:
    if target == "aws":
        return "sts.amazonaws.com"
    if target == "azure":
        return "api://AzureADTokenExchange"
    raise ValueError("Unsupported cloud target")


def _matches_pattern(pattern: str, subject: str) -> bool:
    parts = [".*" if c == "*" else "." if c == "?" else re.escape(c) for c in pattern]
    return re.fullmatch("".join(parts), subject) is not None


def _subject_trusted(target: str, subject: str, policy: dict) -> bool:
    if target == "aws":
        return any(_matches_pattern(pattern, subject) for pattern in policy["awsSubjectPatterns"])
    return subject in policy["azureSubjects"]


def authorize_deployment(request: dict, policy: dict, now: int) -> dict:
    audience = expected_audience(request["target"])
    claims = request["claims"]
    provenance = request["provenance"]
    reasons = []

    if claims["iss"] != policy["issuer"]:
        reasons.append("Issuer is not trusted")
    if claims["aud"] != audience:
        reasons.append("Audience does not match the cloud target")
    if claims["exp"] <= now:
        reasons.append("Token expired")
    if not _subject_trusted(request["target"], claims["sub"], policy):
        reasons.append("Subject is not trusted for this cloud")
    if provenance["predicateType"] != SLSA_PROVENANCE:
        reasons.append("Unsupported provenance predicate type")
    digest = request["artifactDigest"].lower()
    if not any(subject.lower() == digest for subject in provenance["subjectDigests"]):
        reasons.append("Artifact digest not found in provenance")
    if provenance["builderId"] not in policy["trustedBuilders"]:
        reasons.append("Builder is not trusted")

    return {"allowed": not reasons, "reasons": reasons}
