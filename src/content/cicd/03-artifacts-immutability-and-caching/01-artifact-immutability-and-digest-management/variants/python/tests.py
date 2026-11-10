DIGEST = "sha256:b5bb9d8014a0f9b1d61e21e796d78dccdf1352f23cd32812f4850b878ae4944c"
OTHER = "sha256:7d865e959b2466918c9863afca942d0fb89d7c9ac0c99bafc3749504ded97730"


def artifact(digest):
    return {"name": "api-service", "version": "1.4.0", "digest": digest}


@test("confirms an artifact whose digest equals the expected one")
def _():
    assert mod.verify_artifact_immutability(artifact(DIGEST), DIGEST) == {"verified": True, "match": True, "reason": "Artifact digest matches expected checksum"}


@test("reports a different digest as a mismatch without failing")
def _():
    assert mod.verify_artifact_immutability(artifact(OTHER), DIGEST) == {"verified": True, "match": False, "reason": "Artifact digest mismatch detected"}


@test("compares hexadecimal digits without regard to letter case")
def _():
    assert mod.verify_artifact_immutability(artifact("sha256:" + "b5bb9d8014a0f9b1d61e21e796d78dccdf1352f23cd32812f4850b878ae4944c".upper()), DIGEST)["match"] is True


# beginner mistake: trusting a mutable tag such as latest as if it were a digest
@test("never matches a mutable tag against a digest")
def _():
    assert mod.verify_artifact_immutability(artifact("latest"), DIGEST)["match"] is False
    assert mod.verify_artifact_immutability(artifact("1.4.0"), DIGEST)["match"] is False


@test("rejects an expected value that is not a sha256 digest")
async def _():
    for bad in ["b5bb9d8014a0f9b1d61e21e796d78dccdf1352f23cd32812f4850b878ae4944c", "sha256:abc123", "sha1:b5bb9d8014a0f9b1d61e21e796d78dccdf1352f2", "sha256:" + "g" * 64]:
        error = await capture_error(lambda: mod.verify_artifact_immutability(artifact(DIGEST), bad))
        assert "Invalid SHA256 digest format" in str(error)


@test("rejects a sha256 digest with the wrong length")
async def _():
    error = await capture_error(lambda: mod.verify_artifact_immutability(artifact(DIGEST), "sha256:b5bb9d8014a0f9b1d61e21e796d78dccdf1352f23cd32812f4850b878ae4944c00"))
    assert "Invalid SHA256 digest format" in str(error)
