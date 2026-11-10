DIGEST = "sha256:b5bb9d8014a0f9b1d61e21e796d78dccdf1352f23cd32812f4850b878ae4944c"
OTHER = "sha256:7d865e959b2466918c9863afca942d0fb89d7c9ac0c99bafc3749504ded97730"
ORDER = ["development", "staging", "production"]
PASSED = {"status": "PASSED"}


def request(target_env, artifact_digest=DIGEST):
    return {"artifactDigest": artifact_digest, "targetEnv": target_env, "serviceName": "api-service"}


def entry(env, status="VERIFIED", artifact_digest=DIGEST):
    return {"artifactDigest": artifact_digest, "env": env, "status": status}


def patch_for(env, digest=DIGEST):
    return {"path": f"overlays/{env}/kustomization.yaml", "content": f"images:\n  - name: api-service\n    digest: {digest}\n"}


@test("promotes into the first environment and pins the image to the digest in its overlay")
def _():
    assert mod.plan_promotion(request("development"), PASSED, [], ORDER) == {"success": True, "reason": "Artifact promoted successfully", "patch": patch_for("development")}


@test("promotes to the next environment once the previous one verified this digest")
def _():
    plan = mod.plan_promotion(request("staging"), PASSED, [entry("development")], ORDER)
    assert plan == {"success": True, "reason": "Artifact promoted successfully", "patch": patch_for("staging")}


# beginner mistake: accepting a verified run of another artifact as proof for this one
@test("requires the previous environment to have verified this exact digest")
def _():
    plan = mod.plan_promotion(request("production"), PASSED, [entry("staging", "VERIFIED", OTHER), entry("development")], ORDER)
    assert plan == {"success": False, "reason": "Verification missing in staging", "patch": None}


@test("does not accept a failed run or a run two environments back as verification")
def _():
    failed = mod.plan_promotion(request("production"), PASSED, [entry("staging", "FAILED")], ORDER)
    assert failed["reason"] == "Verification missing in staging"
    skipped = mod.plan_promotion(request("production"), PASSED, [entry("development")], ORDER)
    assert skipped["reason"] == "Verification missing in staging"


@test("reports a blocked gate before the environment checks and an unknown environment after it")
def _():
    assert mod.plan_promotion(request("qa"), {"status": "BLOCKED"}, [], ORDER) == {"success": False, "reason": "Quality gate check failed", "patch": None}
    assert mod.plan_promotion(request("qa"), PASSED, [], ORDER) == {"success": False, "reason": "Unknown target environment", "patch": None}


@test("rejects a malformed digest and writes the digest in lower case")
async def _():
    error = await capture_error(lambda: mod.plan_promotion(request("development", "latest"), PASSED, [], ORDER))
    assert "Invalid artifact digest format" in str(error)
    upper = "sha256:" + "b5bb9d8014a0f9b1d61e21e796d78dccdf1352f23cd32812f4850b878ae4944c".upper()
    assert mod.plan_promotion(request("development", upper), PASSED, [], ORDER)["patch"] == patch_for("development")
