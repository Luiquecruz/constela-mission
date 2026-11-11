import re

DIGEST_PATTERN = re.compile(r"sha256:[a-f0-9]{64}", re.IGNORECASE)

def verify_artifact_immutability(artifact: dict, expected_digest: str) -> dict:
    if not DIGEST_PATTERN.fullmatch(expected_digest):
        raise ValueError("Invalid SHA256 digest format")

    artifact_digest = artifact.get("digest", "")
    match = artifact_digest.lower() == expected_digest.lower()

    return {
        "verified": True,
        "match": match,
        "reason": "Artifact digest matches expected checksum" if match else "Artifact digest mismatch detected"
    }
