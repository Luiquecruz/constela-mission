using System.Text.RegularExpressions;

public record OidcTokenClaims(string Iss, string Sub, string Aud, long Exp, string Repository);

public record OidcTrustPolicy(string ExpectedIssuer, string ExpectedAudience, string[] AllowedRepositories, string[] AllowedSubjects);

public record OidcValidationResult(bool Authorized, string Reason);

public static class OidcTrust
{
    public static bool MatchesSubject(string pattern, string subject)
    {
        // TODO: treat "*" as any sequence of characters and "?" as exactly one character; every other character is literal.
        return pattern == subject;
    }

    public static OidcValidationResult ValidateOidcClaims(OidcTokenClaims claims, OidcTrustPolicy policy, long now)
    {
        // TODO: throw InvalidOperationException for a wrong issuer, a wrong audience or an expired token.
        // TODO: deny a repository outside the policy, then a subject that matches no allowed pattern.
        return new OidcValidationResult(true, "OIDC token claims validated and authorized");
    }
}
