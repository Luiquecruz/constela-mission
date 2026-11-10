using Dojo;

public static class OidcTrustTests
{
    private const string Issuer = "https://token.actions.githubusercontent.com";
    private const string Audience = "sts.amazonaws.com";
    private const string Main = "repo:org/api-service:ref:refs/heads/main";
    private const long Now = 1_700_000_000;

    private static OidcTokenClaims ClaimsFor(string sub, string iss = Issuer, string aud = Audience, long exp = Now + 300, string repository = "org/api-service") =>
        new(iss, sub, aud, exp, repository);

    private static OidcTrustPolicy Policy(params string[] allowedSubjects) =>
        new(Issuer, Audience, ["org/api-service"], allowedSubjects);

    [Test("authorizes a main branch token whose subject matches an exact pattern")]
    public static void AuthorizesExactSubject()
    {
        var result = OidcTrust.ValidateOidcClaims(ClaimsFor(Main), Policy(Main), Now);
        Assert.Equal(new OidcValidationResult(true, "OIDC token claims validated and authorized"), result);
    }

    [Test("matches wildcard subject patterns for environments and single characters")]
    public static void MatchesWildcards()
    {
        Assert.True(OidcTrust.ValidateOidcClaims(ClaimsFor("repo:org/api-service:environment:production"), Policy("repo:org/api-service:environment:*"), Now).Authorized);
        Assert.True(OidcTrust.MatchesSubject("repo:org/app-?:pull_request", "repo:org/app-1:pull_request"));
        Assert.False(OidcTrust.MatchesSubject("repo:org/app-?:pull_request", "repo:org/app-12:pull_request"));
        Assert.False(OidcTrust.MatchesSubject("repo:org/a.b:*", "repo:org/aXb:ref:refs/heads/main"));
    }

    [Test("rejects a token minted for another audience or issuer")]
    public static void RejectsAudienceAndIssuer()
    {
        var audience = Assert.Throws<InvalidOperationException>(() => OidcTrust.ValidateOidcClaims(ClaimsFor(Main, aud: "api://AzureADTokenExchange"), Policy(Main), Now));
        Assert.Equal("Invalid OIDC audience", audience.Message);
        var issuer = Assert.Throws<InvalidOperationException>(() => OidcTrust.ValidateOidcClaims(ClaimsFor(Main, iss: "https://issuer.example"), Policy(Main), Now));
        Assert.Equal("Invalid OIDC issuer", issuer.Message);
    }

    [Test("treats a token that expires at the current second as expired")]
    public static void ExpiresAtCurrentSecond()
    {
        var expired = Assert.Throws<InvalidOperationException>(() => OidcTrust.ValidateOidcClaims(ClaimsFor(Main, exp: Now), Policy(Main), Now));
        Assert.Equal("OIDC token expired", expired.Message);
        Assert.True(OidcTrust.ValidateOidcClaims(ClaimsFor(Main, exp: Now + 1), Policy(Main), Now).Authorized);
    }

    // beginner mistake: trusting every token from the right repository and never checking the subject
    [Test("denies a pull request token even when the repository is trusted")]
    public static void DeniesPullRequestSubject()
    {
        var result = OidcTrust.ValidateOidcClaims(ClaimsFor("repo:org/api-service:pull_request"), Policy(Main), Now);
        Assert.Equal(new OidcValidationResult(false, "Subject not allowed by OIDC policy"), result);
    }

    [Test("denies a token from a repository outside the trust policy")]
    public static void DeniesOtherRepository()
    {
        var result = OidcTrust.ValidateOidcClaims(ClaimsFor("repo:attacker/fork:ref:refs/heads/main", repository: "attacker/fork"), Policy("repo:*:ref:refs/heads/main"), Now);
        Assert.Equal(new OidcValidationResult(false, "Repository not allowed by OIDC policy"), result);
    }
}
