DIGEST = "sha256:b5bb9d8014a0f9b1d61e21e796d78dccdf1352f23cd32812f4850b878ae4944c"
OTHER = "sha256:7d865e959b2466918c9863afca942d0fb89d7c9ac0c99bafc3749504ded97730"


@test("registers versions and resolves each one to its digest")
def _():
    registry = mod.ArtifactRegistry()
    assert registry.register("api-service", "1.0.0", DIGEST) == {"registered": True, "digest": DIGEST}
    registry.register("api-service", "1.1.0", OTHER)
    assert registry.resolve("api-service", "1.0.0") == DIGEST
    assert registry.resolve("api-service", "1.1.0") == OTHER
    assert registry.list_versions("api-service") == ["1.0.0", "1.1.0"]


@test("stores digests in lower case")
def _():
    registry = mod.ArtifactRegistry()
    result = registry.register("api-service", "1.0.0", "sha256:" + "b5bb9d8014a0f9b1d61e21e796d78dccdf1352f23cd32812f4850b878ae4944c".upper())
    assert result["digest"] == DIGEST
    assert registry.resolve("api-service", "1.0.0") == DIGEST


@test("treats registering the same digest again as a no-op")
def _():
    registry = mod.ArtifactRegistry()
    registry.register("api-service", "1.0.0", DIGEST)
    assert registry.register("api-service", "1.0.0", "sha256:" + "b5bb9d8014a0f9b1d61e21e796d78dccdf1352f23cd32812f4850b878ae4944c".upper()) == {"registered": False, "digest": DIGEST}
    assert registry.list_versions("api-service") == ["1.0.0"]


# beginner mistake: overwriting a published version with a different build
@test("refuses to replace a published version with a different digest")
async def _():
    registry = mod.ArtifactRegistry()
    registry.register("api-service", "1.0.0", DIGEST)
    error = await capture_error(lambda: registry.register("api-service", "1.0.0", OTHER))
    assert "Artifact api-service:1.0.0 is immutable" in str(error)
    assert registry.resolve("api-service", "1.0.0") == DIGEST


@test("rejects a digest that is not a sha256 hash")
async def _():
    registry = mod.ArtifactRegistry()
    for bad in ["b5bb9d8014a0f9b1d61e21e796d78dccdf1352f23cd32812f4850b878ae4944c", "sha256:abc", "sha1:b5bb9d8014a0f9b1d61e21e796d78dccdf1352f2", "latest"]:
        error = await capture_error(lambda: registry.register("api-service", "1.0.0", bad))
        assert "Invalid SHA256 digest format" in str(error)
    assert registry.list_versions("api-service") == []


@test("fails to resolve a version or an artifact that was never registered")
async def _():
    registry = mod.ArtifactRegistry()
    registry.register("api-service", "1.0.0", DIGEST)
    error = await capture_error(lambda: registry.resolve("api-service", "9.9.9"))
    assert "Artifact api-service:9.9.9 not found" in str(error)
    error = await capture_error(lambda: registry.resolve("web-app", "1.0.0"))
    assert "Artifact web-app:1.0.0 not found" in str(error)
    assert registry.list_versions("web-app") == []
