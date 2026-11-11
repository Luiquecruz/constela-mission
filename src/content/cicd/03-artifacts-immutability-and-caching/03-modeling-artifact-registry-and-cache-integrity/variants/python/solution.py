import re

DIGEST_PATTERN = re.compile(r"sha256:[a-f0-9]{64}", re.IGNORECASE)


class ArtifactRegistry:
    def __init__(self):
        self._versions = {}

    def register(self, name: str, version: str, digest: str) -> dict:
        if not DIGEST_PATTERN.fullmatch(digest):
            raise ValueError("Invalid SHA256 digest format")
        normalized = digest.lower()
        known = self._versions.setdefault(name, {})
        existing = known.get(version)

        if existing is None:
            known[version] = normalized
            return {"registered": True, "digest": normalized}
        if existing != normalized:
            raise ValueError(f"Artifact {name}:{version} is immutable")
        return {"registered": False, "digest": existing}

    def resolve(self, name: str, version: str) -> str:
        digest = self._versions.get(name, {}).get(version)
        if digest is None:
            raise ValueError(f"Artifact {name}:{version} not found")
        return digest

    def list_versions(self, name: str) -> list:
        return list(self._versions.get(name, {}))
