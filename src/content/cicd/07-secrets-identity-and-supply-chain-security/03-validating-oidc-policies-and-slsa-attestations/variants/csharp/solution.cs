using System.Text.RegularExpressions;

public record WorkloadClaims(string Iss, string Aud, string Sub, long Exp);

public record ProvenanceSummary(string PredicateType, string BuilderId, string[] SubjectDigests);

public record DeploymentRequest(string Target, WorkloadClaims Claims, string ArtifactDigest, ProvenanceSummary Provenance);

public record DeploymentPolicy(string Issuer, string[] AwsSubjectPatterns, string[] AzureSubjects, string[] TrustedBuilders);

public record DeploymentDecision(bool Allowed, string[] Reasons);

public static class DeploymentGate
{
    public const string SlsaProvenance = "https://slsa.dev/provenance/v1";

    public static string ExpectedAudience(string target) => target switch
    {
        "aws" => "sts.amazonaws.com",
        "azure" => "api://AzureADTokenExchange",
        _ => throw new ArgumentException("Unsupported cloud target"),
    };

    private static bool MatchesPattern(string pattern, string subject)
    {
        var source = string.Concat(pattern.Select(character => character switch
        {
            '*' => ".*",
            '?' => ".",
            _ => Regex.Escape(character.ToString()),
        }));
        return new Regex($"\\A{source}\\z", RegexOptions.Singleline).IsMatch(subject);
    }

    private static bool SubjectTrusted(string target, string subject, DeploymentPolicy policy) =>
        target == "aws"
            ? policy.AwsSubjectPatterns.Any(pattern => MatchesPattern(pattern, subject))
            : policy.AzureSubjects.Contains(subject);

    public static DeploymentDecision AuthorizeDeployment(DeploymentRequest request, DeploymentPolicy policy, long now)
    {
        var audience = ExpectedAudience(request.Target);
        var claims = request.Claims;
        var provenance = request.Provenance;
        var reasons = new List<string>();

        if (claims.Iss != policy.Issuer)
        {
            reasons.Add("Issuer is not trusted");
        }
        if (claims.Aud != audience)
        {
            reasons.Add("Audience does not match the cloud target");
        }
        if (claims.Exp <= now)
        {
            reasons.Add("Token expired");
        }
        if (!SubjectTrusted(request.Target, claims.Sub, policy))
        {
            reasons.Add("Subject is not trusted for this cloud");
        }
        if (provenance.PredicateType != SlsaProvenance)
        {
            reasons.Add("Unsupported provenance predicate type");
        }
        if (!provenance.SubjectDigests.Any(digest => string.Equals(digest, request.ArtifactDigest, StringComparison.OrdinalIgnoreCase)))
        {
            reasons.Add("Artifact digest not found in provenance");
        }
        if (!policy.TrustedBuilders.Contains(provenance.BuilderId))
        {
            reasons.Add("Builder is not trusted");
        }

        return new DeploymentDecision(reasons.Count == 0, reasons.ToArray());
    }
}
