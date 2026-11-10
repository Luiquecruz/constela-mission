DIGEST = "sha256:b5bb9d8014a0f9b1d61e21e796d78dccdf1352f23cd32812f4850b878ae4944c"
OTHER = "sha256:7d865e959b2466918c9863afca942d0fb89d7c9ac0c99bafc3749504ded97730"
NOW = 1_700_000_000
BUILDER = "https://github.com/actions/runner/github-hosted"


def release(**overrides):
    result = {
        "tasks": [
            {"id": "install", "dependencies": [], "command": "npm ci"},
            {"id": "lint", "dependencies": ["install"], "command": "npm run lint"},
            {"id": "test", "dependencies": ["install"], "command": "npm test"},
            {"id": "package", "dependencies": ["lint", "test"], "command": "npm run build"},
        ],
        "facts": {"coverage": 91, "criticalVulnerabilities": 0},
        "rules": [
            {"id": "coverage", "field": "coverage", "operator": "gte", "value": 80, "message": "Coverage below 80"},
            {"id": "criticals", "field": "criticalVulnerabilities", "operator": "lte", "value": 0, "message": "Critical vulnerabilities present"},
        ],
        "oidc": {
            "claims": {"iss": "issuer", "aud": "audience", "sub": "repo:org/api:environment:production", "exp": NOW + 300},
            "policy": {"expectedIssuer": "issuer", "expectedAudience": "audience", "allowedSubjects": ["repo:org/api:environment:production"]},
        },
        "artifact": {"digest": DIGEST, "builderId": BUILDER, "subjectDigests": [DIGEST], "trustedBuilders": [BUILDER]},
        "promotion": {
            "targetEnv": "production",
            "serviceName": "api-service",
            "environments": ["staging", "production"],
            "history": [{"artifactDigest": DIGEST, "env": "staging", "status": "VERIFIED"}],
        },
    }
    result.update(overrides)
    return result


@test("releases when every stage passes and returns the batches and the manifest patch")
def _():
    report = mod.run_release(release(), NOW)
    assert report["outcome"] == "RELEASED"
    assert report["passedStages"] == ["build", "gate", "identity", "provenance", "promotion"]
    assert report["batches"] == [["install"], ["lint", "test"], ["package"]]
    assert report["patch"] == {"path": "overlays/production/kustomization.yaml", "content": f"images:\n  - name: api-service\n    digest: {DIGEST}\n"}


@test("rejects at the build stage on a cycle and reports nothing else")
def _():
    cyclic = [{"id": "a", "dependencies": ["b"], "command": "a"}, {"id": "b", "dependencies": ["a"], "command": "b"}]
    assert mod.run_release(release(tasks=cyclic), NOW) == {"outcome": "REJECTED", "stage": "build", "passedStages": [], "reasons": ["Cyclic dependency detected"], "batches": [], "patch": None}


@test("rejects at the gate and lists the message of every failed rule")
def _():
    report = mod.run_release(release(facts={"coverage": 40, "criticalVulnerabilities": 3}), NOW)
    assert report["stage"] == "gate"
    assert report["reasons"] == ["Coverage below 80", "Critical vulnerabilities present"]
    assert report["passedStages"] == ["build"]
    assert report["batches"] == [["install"], ["lint", "test"], ["package"]]


@test("rejects at the identity stage for an expired token and for a subject that is not allowed")
def _():
    base = release()
    expired = {**base["oidc"], "claims": {**base["oidc"]["claims"], "exp": NOW}}
    report = mod.run_release(release(oidc=expired), NOW)
    assert (report["stage"], report["reasons"], report["passedStages"]) == ("identity", ["OIDC token expired"], ["build", "gate"])
    wrong_subject = {**base["oidc"], "claims": {**base["oidc"]["claims"], "sub": "repo:org/api:pull_request"}}
    report = mod.run_release(release(oidc=wrong_subject), NOW)
    assert (report["stage"], report["reasons"]) == ("identity", ["Subject not allowed by OIDC policy"])


# beginner mistake: trusting a valid identity without checking that the artifact is the one the trusted builder produced
@test("rejects a valid identity that deploys an artifact missing from its provenance")
def _():
    base = release()
    report = mod.run_release(release(artifact={**base["artifact"], "digest": OTHER}), NOW)
    assert (report["outcome"], report["stage"], report["reasons"], report["passedStages"]) == ("REJECTED", "provenance", ["Artifact digest not found in provenance"], ["build", "gate", "identity"])
    untrusted = mod.run_release(release(artifact={**base["artifact"], "builderId": "https://ci.example/self-hosted"}), NOW)
    assert untrusted["reasons"] == ["Builder is not trusted"]


@test("rejects a promotion without verification in the previous environment and stops at the first failing stage")
def _():
    base = release()
    unverified = {**base["promotion"], "history": []}
    report = mod.run_release(release(promotion=unverified), NOW)
    assert (report["stage"], report["reasons"], report["patch"]) == ("promotion", ["Verification missing in staging"], None)
    failing_everywhere = release(facts={"coverage": 1, "criticalVulnerabilities": 0}, promotion=unverified)
    assert mod.run_release(failing_everywhere, NOW)["stage"] == "gate"
