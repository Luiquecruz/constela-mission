using Dojo;

public static class DeploymentGateTests
{
    private const string Issuer = "https://token.actions.githubusercontent.com";
    private const string Builder = "https://github.com/actions/runner/github-hosted";
    private const string Digest = "sha256:b5bb9d8014a0f9b1d61e21e796d78dccdf1352f23cd32812f4850b878ae4944c";
    private const string Other = "sha256:7d865e959b2466918c9863afca942d0fb89d7c9ac0c99bafc3749504ded97730";
    private const string Production = "repo:org/api-service:environment:production";
    private const long Now = 1_700_000_000;

    private static readonly DeploymentPolicy Policy = new(Issuer, ["repo:org/api-service:environment:*"], [Production], [Builder]);

    private static DeploymentRequest Request(
        string target,
        string iss = Issuer,
        string? aud = null,
        string sub = Production,
        long exp = Now + 300,
        string artifactDigest = Digest,
        string predicateType = "https://slsa.dev/provenance/v1",
        string builderId = Builder) =>
        new(target, new WorkloadClaims(iss, aud ?? (target == "azure" ? "api://AzureADTokenExchange" : "sts.amazonaws.com"), sub, exp), artifactDigest, new ProvenanceSummary(predicateType, builderId, [Digest]));

    [Test("allows a production deployment to AWS through a wildcard environment subject")]
    public static void AllowsAwsWildcard()
    {
        var decision = DeploymentGate.AuthorizeDeployment(Request("aws"), Policy, Now);
        Assert.True(decision.Allowed);
        Assert.Equal(0, decision.Reasons.Length);
        Assert.True(DeploymentGate.AuthorizeDeployment(Request("aws", sub: "repo:org/api-service:environment:staging"), Policy, Now).Allowed);
    }

    [Test("allows Azure only when the subject matches a federated credential exactly")]
    public static void AzureNeedsExactSubject()
    {
        Assert.True(DeploymentGate.AuthorizeDeployment(Request("azure"), Policy, Now).Allowed);
        var wildcardOnly = Policy with { AzureSubjects = ["repo:org/api-service:environment:*"] };
        var decision = DeploymentGate.AuthorizeDeployment(Request("azure"), wildcardOnly, Now);
        Assert.False(decision.Allowed);
        Assert.SequenceEqual(["Subject is not trusted for this cloud"], decision.Reasons);
    }

    [Test("requires the audience that each cloud expects")]
    public static void RequiresCloudAudience()
    {
        Assert.Equal("sts.amazonaws.com", DeploymentGate.ExpectedAudience("aws"));
        Assert.Equal("api://AzureADTokenExchange", DeploymentGate.ExpectedAudience("azure"));
        var decision = DeploymentGate.AuthorizeDeployment(Request("aws", aud: "api://AzureADTokenExchange"), Policy, Now);
        Assert.SequenceEqual(["Audience does not match the cloud target"], decision.Reasons);
    }

    [Test("reports every failed check in order instead of stopping at the first")]
    public static void ReportsEveryFailure()
    {
        var bad = Request("aws", iss: "https://issuer.example", exp: Now, predicateType: "https://spdx.dev/Document", builderId: "https://ci.example/self-hosted");
        Assert.SequenceEqual(
            ["Issuer is not trusted", "Token expired", "Unsupported provenance predicate type", "Builder is not trusted"],
            DeploymentGate.AuthorizeDeployment(bad, Policy, Now).Reasons);
    }

    // beginner mistake: trusting a valid identity and deploying an artifact that the provenance never mentions
    [Test("blocks a valid identity that deploys an artifact missing from the provenance")]
    public static void BlocksUnknownArtifact()
    {
        var decision = DeploymentGate.AuthorizeDeployment(Request("azure", artifactDigest: Other), Policy, Now);
        Assert.False(decision.Allowed);
        Assert.SequenceEqual(["Artifact digest not found in provenance"], decision.Reasons);
    }

    [Test("rejects a cloud target that has no trust configuration")]
    public static void RejectsUnknownTarget()
    {
        var audience = Assert.Throws<ArgumentException>(() => DeploymentGate.ExpectedAudience("gcp"));
        Assert.Contains("Unsupported cloud target", audience.Message);
        var decision = Assert.Throws<ArgumentException>(() => DeploymentGate.AuthorizeDeployment(Request("gcp"), Policy, Now));
        Assert.Contains("Unsupported cloud target", decision.Message);
    }
}
