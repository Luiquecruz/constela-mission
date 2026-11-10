using System.Text.RegularExpressions;

public record WorkloadClaims(string Iss, string Aud, string Sub, long Exp);

public record ProvenanceSummary(string PredicateType, string BuilderId, string[] SubjectDigests);

public record DeploymentRequest(string Target, WorkloadClaims Claims, string ArtifactDigest, ProvenanceSummary Provenance);

public record DeploymentPolicy(string Issuer, string[] AwsSubjectPatterns, string[] AzureSubjects, string[] TrustedBuilders);

public record DeploymentDecision(bool Allowed, string[] Reasons);

public static class DeploymentGate
{
    public const string SlsaProvenance = "https://slsa.dev/provenance/v1";

    public static string ExpectedAudience(string target)
    {
        // TODO: return the audience each cloud expects and throw ArgumentException for any other target.
        return "sts.amazonaws.com";
    }

    public static DeploymentDecision AuthorizeDeployment(DeploymentRequest request, DeploymentPolicy policy, long now)
    {
        // TODO: check issuer, audience, expiration and subject (wildcards on AWS, exact match on Azure).
        // TODO: check the predicate type, the artifact digest and the builder, collecting every failed reason in order.
        return new DeploymentDecision(true, []);
    }
}
