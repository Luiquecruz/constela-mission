DIGEST = "sha256:b5bb9d8014a0f9b1d61e21e796d78dccdf1352f23cd32812f4850b878ae4944c"
OTHER = "sha256:7d865e959b2466918c9863afca942d0fb89d7c9ac0c99bafc3749504ded97730"


def request(target_env, artifact_digest=DIGEST):
    return {"artifactDigest": artifact_digest, "targetEnv": target_env, "promotedBy": "ci-bot"}


def entry(env, status, artifact_digest=DIGEST):
    return {"artifactDigest": artifact_digest, "env": env, "status": status}


@test("approves a first deployment to staging")
def _():
    assert mod.validate_environment_promotion(request("staging"), []) == {"allowed": True, "reason": "Promotion to staging approved"}


@test("blocks a staging promotion of an artifact that failed there before")
def _():
    result = mod.validate_environment_promotion(request("staging"), [entry("staging", "FAILED")])
    assert result == {"allowed": False, "reason": "Artifact failed prior staging deployment"}


@test("approves production after a verified staging deployment of the same artifact")
def _():
    result = mod.validate_environment_promotion(request("production"), [entry("staging", "VERIFIED")])
    assert result == {"allowed": True, "reason": "Promotion to production approved"}


# beginner mistake: accepting a verified staging deployment of a different artifact as proof for this one
@test("does not accept another artifact, a failed run or another environment as proof for production")
def _():
    blocked = {"allowed": False, "reason": "Promotion to production requires verified staging deployment"}
    assert mod.validate_environment_promotion(request("production"), [entry("staging", "VERIFIED", OTHER)]) == blocked
    assert mod.validate_environment_promotion(request("production"), [entry("staging", "FAILED")]) == blocked
    assert mod.validate_environment_promotion(request("production"), [entry("development", "VERIFIED")]) == blocked
    assert mod.validate_environment_promotion(request("production"), []) == blocked


@test("rejects a target environment that is not part of the pipeline")
def _():
    assert mod.validate_environment_promotion(request("qa"), []) == {"allowed": False, "reason": "Unknown target environment"}


@test("rejects a malformed artifact digest before reading the history")
async def _():
    error = await capture_error(lambda: mod.validate_environment_promotion(request("staging", "latest"), []))
    assert "Invalid artifact digest format" in str(error)
    error = await capture_error(lambda: mod.validate_environment_promotion(request("production", "sha256:abc"), [entry("staging", "VERIFIED")]))
    assert "Invalid artifact digest format" in str(error)
