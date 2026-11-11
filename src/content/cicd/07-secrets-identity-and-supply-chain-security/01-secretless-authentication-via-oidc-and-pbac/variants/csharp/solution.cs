using System.Text.RegularExpressions;

public record OidcTokenClaims(string Iss, string Sub, string Aud, long Exp, string Repository);

public record OidcTrustPolicy(string ExpectedIssuer, string ExpectedAudience, string[] AllowedRepositories, string[] AllowedSubjects);

public record OidcValidationResult(bool Authorized, string Reason);

public static class OidcTrust
{
    public static bool MatchesSubject(string pattern, string subject)
    {
        var source = string.Concat(pattern.Select(character => character switch
        {
            '*' => ".*",
            '?' => ".",
            _ => Regex.Escape(character.ToString()),
        }));
        return new Regex($"\\A{source}\\z", RegexOptions.Singleline).IsMatch(subject);
    }

    public static OidcValidationResult ValidateOidcClaims(OidcTokenClaims claims, OidcTrustPolicy policy, long now)
    {
        if (claims.Iss != policy.ExpectedIssuer)
        {
            throw new InvalidOperationException("Invalid OIDC issuer");
        }
        if (claims.Aud != policy.ExpectedAudience)
        {
            throw new InvalidOperationException("Invalid OIDC audience");
        }
        if (claims.Exp <= now)
        {
            throw new InvalidOperationException("OIDC token expired");
        }
        if (!policy.AllowedRepositories.Contains(claims.Repository))
        {
            return new OidcValidationResult(false, "Repository not allowed by OIDC policy");
        }
        if (!policy.AllowedSubjects.Any(pattern => MatchesSubject(pattern, claims.Sub)))
        {
            return new OidcValidationResult(false, "Subject not allowed by OIDC policy");
        }
        return new OidcValidationResult(true, "OIDC token claims validated and authorized");
    }
}
