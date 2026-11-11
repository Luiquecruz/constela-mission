import re

DIGEST_PATTERN = re.compile(r"sha256:[a-f0-9]{64}", re.IGNORECASE)

def verify_slsa_provenance(artifact_digest: str, provenance: dict, policy: dict) -> dict:
    if not DIGEST_PATTERN.fullmatch(artifact_digest):
        raise ValueError("Invalid artifact digest format")

    if provenance.get("predicateType") != policy.get("expectedPredicateType"):
        return {
            "valid": False,
            "reason": "Unsupported SLSA predicate type"
        }

    raw_hash = artifact_digest[7:].lower()

    subjects = provenance.get("subject", [])
    found_subject = False
    for item in subjects:
        digests = item.get("digest", {})
        if digests.get("sha256", "").lower() == raw_hash:
            found_subject = True
            break

    if not found_subject:
        return {
            "valid": False,
            "reason": "Artifact digest not found in provenance subject"
        }

    builder = provenance.get("builder", {})
    builder_id = builder.get("id", "")
    allowed_builders = policy.get("allowedBuilderIds", [])

    if builder_id not in allowed_builders:
        return {
            "valid": False,
            "reason": "Builder ID not trusted by SLSA policy"
        }

    return {
        "valid": True,
        "reason": "SLSA provenance verified successfully"
    }
