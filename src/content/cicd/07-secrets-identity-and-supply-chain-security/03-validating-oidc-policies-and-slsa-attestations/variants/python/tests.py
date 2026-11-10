ISSUER = "https://token.actions.githubusercontent.com"
BUILDER = "https://github.com/actions/runner/github-hosted"
DIGEST = "sha256:b5bb9d8014a0f9b1d61e21e796d78dccdf1352f23cd32812f4850b878ae4944c"
OTHER = "sha256:7d865e959b2466918c9863afca942d0fb89d7c9ac0c99bafc3749504ded97730"
PRODUCTION = "repo:org/api-service:environment:production"
NOW = 1_700_000_000

POLICY = {
    "issuer": ISSUER,
    "awsSubjectPatterns": ["repo:org/api-service:environment:*"],
    "azureSubjects": [PRODUCTION],
    "trustedBuilders": [BUILDER],
}


def request(target, claims=None, provenance=None, artifact_digest=DIGEST):
    audience = "api://AzureADTokenExchange" if target == "azure" else "sts.amazonaws.com"
    return {
        "target": target,
        "claims": {"iss": ISSUER, "aud": audience, "sub": PRODUCTION, "exp": NOW + 300, **(claims or {})},
        "artifactDigest": artifact_digest,
        "provenance": {"predicateType": "https://slsa.dev/provenance/v1", "builderId": BUILDER, "subjectDigests": [DIGEST], **(provenance or {})},
    }


@test("allows a production deployment to AWS through a wildcard environment subject")
def _():
    assert mod.authorize_deployment(request("aws"), POLICY, NOW) == {"allowed": True, "reasons": []}
    assert mod.authorize_deployment(request("aws", claims={"sub": "repo:org/api-service:environment:staging"}), POLICY, NOW)["allowed"] is True


@test("allows Azure only when the subject matches a federated credential exactly")
def _():
    assert mod.authorize_deployment(request("azure"), POLICY, NOW)["allowed"] is True
    wildcard_only = {**POLICY, "azureSubjects": ["repo:org/api-service:environment:*"]}
    assert mod.authorize_deployment(request("azure"), wildcard_only, NOW) == {"allowed": False, "reasons": ["Subject is not trusted for this cloud"]}


@test("requires the audience that each cloud expects")
def _():
    assert mod.expected_audience("aws") == "sts.amazonaws.com"
    assert mod.expected_audience("azure") == "api://AzureADTokenExchange"
    azure_token_sent_to_aws = request("aws", claims={"aud": "api://AzureADTokenExchange"})
    assert mod.authorize_deployment(azure_token_sent_to_aws, POLICY, NOW)["reasons"] == ["Audience does not match the cloud target"]


@test("reports every failed check in order instead of stopping at the first")
def _():
    bad = request(
        "aws",
        claims={"iss": "https://issuer.example", "exp": NOW},
        provenance={"predicateType": "https://spdx.dev/Document", "builderId": "https://ci.example/self-hosted"},
    )
    assert mod.authorize_deployment(bad, POLICY, NOW)["reasons"] == [
        "Issuer is not trusted",
        "Token expired",
        "Unsupported provenance predicate type",
        "Builder is not trusted",
    ]


# beginner mistake: trusting a valid identity and deploying an artifact that the provenance never mentions
@test("blocks a valid identity that deploys an artifact missing from the provenance")
def _():
    decision = mod.authorize_deployment(request("azure", artifact_digest=OTHER), POLICY, NOW)
    assert decision == {"allowed": False, "reasons": ["Artifact digest not found in provenance"]}


@test("rejects a cloud target that has no trust configuration")
async def _():
    error = await capture_error(lambda: mod.expected_audience("gcp"))
    assert "Unsupported cloud target" in str(error)
    error = await capture_error(lambda: mod.authorize_deployment(request("gcp"), POLICY, NOW))
    assert "Unsupported cloud target" in str(error)
