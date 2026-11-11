DIGEST = "b5bb9d8014a0f9b1d61e21e796d78dccdf1352f23cd32812f4850b878ae4944c"
OTHER = "7d865e959b2466918c9863afca942d0fb89d7c9ac0c99bafc3749504ded97730"
PREDICATE = "https://slsa.dev/provenance/v1"
BUILDER = "https://github.com/actions/runner/github-hosted"


def statement(**overrides):
    result = {
        "predicateType": PREDICATE,
        "builder": {"id": BUILDER},
        "subject": [{"name": "api-service.tar.gz", "digest": {"sha256": DIGEST}}],
    }
    result.update(overrides)
    return result


POLICY = {"expectedPredicateType": PREDICATE, "allowedBuilderIds": [BUILDER]}


@test("verifies a provenance statement from a trusted builder for the same artifact")
def _():
    assert mod.verify_slsa_provenance(f"sha256:{DIGEST}", statement(), POLICY) == {"valid": True, "reason": "SLSA provenance verified successfully"}


@test("finds the artifact among several subjects regardless of hexadecimal case")
def _():
    subjects = [
        {"name": "checksums.txt", "digest": {"sha256": OTHER}},
        {"name": "api-service.tar.gz", "digest": {"sha256": DIGEST.upper()}},
    ]
    assert mod.verify_slsa_provenance(f"sha256:{DIGEST}", statement(subject=subjects), POLICY)["valid"] is True
    assert mod.verify_slsa_provenance(f"sha256:{DIGEST.upper()}", statement(), POLICY)["valid"] is True


# beginner mistake: trusting the builder and never comparing the artifact digest with the subjects
@test("rejects provenance whose subjects do not include the artifact digest")
def _():
    result = mod.verify_slsa_provenance(f"sha256:{OTHER}", statement(), POLICY)
    assert result == {"valid": False, "reason": "Artifact digest not found in provenance subject"}


@test("rejects provenance produced by a builder outside the policy")
def _():
    result = mod.verify_slsa_provenance(f"sha256:{DIGEST}", statement(builder={"id": "https://ci.example/self-hosted"}), POLICY)
    assert result == {"valid": False, "reason": "Builder ID not trusted by SLSA policy"}


@test("rejects a statement with an unexpected predicate type")
def _():
    result = mod.verify_slsa_provenance(f"sha256:{DIGEST}", statement(predicateType="https://spdx.dev/Document"), POLICY)
    assert result == {"valid": False, "reason": "Unsupported SLSA predicate type"}


@test("refuses a malformed artifact digest before reading the statement")
async def _():
    error = await capture_error(lambda: mod.verify_slsa_provenance("sha256:abc123", statement(), POLICY))
    assert "Invalid artifact digest format" in str(error)
    error = await capture_error(lambda: mod.verify_slsa_provenance(DIGEST, statement(), POLICY))
    assert "Invalid artifact digest format" in str(error)
