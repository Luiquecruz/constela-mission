ISSUER = "https://token.actions.githubusercontent.com"
AUDIENCE = "sts.amazonaws.com"
MAIN = "repo:org/api-service:ref:refs/heads/main"
NOW = 1_700_000_000


def claims_for(sub, **overrides):
    claims = {"iss": ISSUER, "sub": sub, "aud": AUDIENCE, "exp": NOW + 300, "repository": "org/api-service"}
    claims.update(overrides)
    return claims


def policy(allowed_subjects):
    return {
        "expectedIssuer": ISSUER,
        "expectedAudience": AUDIENCE,
        "allowedRepositories": ["org/api-service"],
        "allowedSubjects": allowed_subjects,
    }


@test("authorizes a main branch token whose subject matches an exact pattern")
def _():
    result = mod.validate_oidc_claims(claims_for(MAIN), policy([MAIN]), NOW)
    assert result == {"authorized": True, "reason": "OIDC token claims validated and authorized"}


@test("matches wildcard subject patterns for environments and single characters")
def _():
    environments = policy(["repo:org/api-service:environment:*"])
    assert mod.validate_oidc_claims(claims_for("repo:org/api-service:environment:production"), environments, NOW)["authorized"] is True
    assert mod.matches_subject("repo:org/app-?:pull_request", "repo:org/app-1:pull_request") is True
    assert mod.matches_subject("repo:org/app-?:pull_request", "repo:org/app-12:pull_request") is False
    assert mod.matches_subject("repo:org/a.b:*", "repo:org/aXb:ref:refs/heads/main") is False


@test("rejects a token minted for another audience or issuer")
async def _():
    error = await capture_error(lambda: mod.validate_oidc_claims(claims_for(MAIN, aud="api://AzureADTokenExchange"), policy([MAIN]), NOW))
    assert "Invalid OIDC audience" in str(error)
    error = await capture_error(lambda: mod.validate_oidc_claims(claims_for(MAIN, iss="https://issuer.example"), policy([MAIN]), NOW))
    assert "Invalid OIDC issuer" in str(error)


@test("treats a token that expires at the current second as expired")
async def _():
    error = await capture_error(lambda: mod.validate_oidc_claims(claims_for(MAIN, exp=NOW), policy([MAIN]), NOW))
    assert "OIDC token expired" in str(error)
    assert mod.validate_oidc_claims(claims_for(MAIN, exp=NOW + 1), policy([MAIN]), NOW)["authorized"] is True


# beginner mistake: trusting every token from the right repository and never checking the subject
@test("denies a pull request token even when the repository is trusted")
def _():
    result = mod.validate_oidc_claims(claims_for("repo:org/api-service:pull_request"), policy([MAIN]), NOW)
    assert result == {"authorized": False, "reason": "Subject not allowed by OIDC policy"}


@test("denies a token from a repository outside the trust policy")
def _():
    claims = claims_for("repo:attacker/fork:ref:refs/heads/main", repository="attacker/fork")
    result = mod.validate_oidc_claims(claims, policy(["repo:*:ref:refs/heads/main"]), NOW)
    assert result == {"authorized": False, "reason": "Repository not allowed by OIDC policy"}
