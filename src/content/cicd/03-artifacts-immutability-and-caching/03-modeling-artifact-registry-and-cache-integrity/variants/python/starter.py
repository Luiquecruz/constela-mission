class ArtifactRegistry:
    def register(self, name: str, version: str, digest: str) -> dict:
        # TODO: reject a digest that is not "sha256:" followed by 64 hexadecimal characters.
        # TODO: store the digest in lower case; accept the same digest again, refuse a different one for a published version.
        return {"registered": False, "digest": digest}

    def resolve(self, name: str, version: str) -> str:
        # TODO: return the digest of a published version or raise ValueError when it was never registered.
        return ""

    def list_versions(self, name: str) -> list:
        # TODO: return the versions of an artifact in the order they were first registered.
        return []
