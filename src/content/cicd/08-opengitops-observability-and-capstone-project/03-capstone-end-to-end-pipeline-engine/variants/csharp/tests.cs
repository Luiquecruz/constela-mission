using Dojo;

public static class ReleaseRunnerTests
{
    private const string Digest = "sha256:b5bb9d8014a0f9b1d61e21e796d78dccdf1352f23cd32812f4850b878ae4944c";
    private const string Other = "sha256:7d865e959b2466918c9863afca942d0fb89d7c9ac0c99bafc3749504ded97730";
    private const string Builder = "https://github.com/actions/runner/github-hosted";
    private const long Now = 1_700_000_000;

    private static ReleaseRequest Release(
        Task[]? tasks = null,
        Dictionary<string, object>? facts = null,
        OidcInput? oidc = null,
        ArtifactInput? artifact = null,
        PromotionInput? promotion = null) =>
        new(
            tasks ?? [new("install", [], "npm ci"), new("lint", ["install"], "npm run lint"), new("test", ["install"], "npm test"), new("package", ["lint", "test"], "npm run build")],
            facts ?? new Dictionary<string, object> { ["coverage"] = 91, ["criticalVulnerabilities"] = 0 },
            [new PolicyRule("coverage", "coverage", "gte", 80, "Coverage below 80"), new PolicyRule("criticals", "criticalVulnerabilities", "lte", 0, "Critical vulnerabilities present")],
            oidc ?? Oidc(Now + 300, "repo:org/api:environment:production"),
            artifact ?? new ArtifactInput(Digest, Builder, [Digest], [Builder]),
            promotion ?? new PromotionInput("production", "api-service", ["staging", "production"], [new HistoryEntry(Digest, "staging", "VERIFIED")]));

    private static OidcInput Oidc(long exp, string sub) =>
        new(new OidcClaims("issuer", "audience", sub, exp), new OidcPolicy("issuer", "audience", ["repo:org/api:environment:production"]));

    private static string Join(string[] values) => string.Join(",", values);

    [Test("releases when every stage passes and returns the batches and the manifest patch")]
    public static void ReleasesWhenEverythingPasses()
    {
        var report = ReleaseRunner.RunRelease(Release(), Now);
        Assert.Equal("RELEASED", report.Outcome);
        Assert.Equal("build,gate,identity,provenance,promotion", Join(report.PassedStages));
        Assert.Equal("install|lint,test|package", string.Join("|", report.Batches.Select(Join)));
        Assert.Equal(new ManifestPatch("overlays/production/kustomization.yaml", $"images:\n  - name: api-service\n    digest: {Digest}\n"), report.Patch);
    }

    [Test("rejects at the build stage on a cycle and reports nothing else")]
    public static void RejectsCycle()
    {
        var report = ReleaseRunner.RunRelease(Release(tasks: [new("a", ["b"], "a"), new("b", ["a"], "b")]), Now);
        Assert.Equal("REJECTED", report.Outcome);
        Assert.Equal("build", report.Stage);
        Assert.Equal("Cyclic dependency detected", Join(report.Reasons));
        Assert.Equal(0, report.PassedStages.Length);
        Assert.Equal(0, report.Batches.Length);
        Assert.Null(report.Patch);
    }

    [Test("rejects at the gate and lists the message of every failed rule")]
    public static void RejectsAtGate()
    {
        var report = ReleaseRunner.RunRelease(Release(facts: new Dictionary<string, object> { ["coverage"] = 40, ["criticalVulnerabilities"] = 3 }), Now);
        Assert.Equal("gate", report.Stage);
        Assert.Equal("Coverage below 80,Critical vulnerabilities present", Join(report.Reasons));
        Assert.Equal("build", Join(report.PassedStages));
        Assert.Equal("install|lint,test|package", string.Join("|", report.Batches.Select(Join)));
    }

    [Test("rejects at the identity stage for an expired token and for a subject that is not allowed")]
    public static void RejectsIdentity()
    {
        var expired = ReleaseRunner.RunRelease(Release(oidc: Oidc(Now, "repo:org/api:environment:production")), Now);
        Assert.Equal("identity", expired.Stage);
        Assert.Equal("OIDC token expired", Join(expired.Reasons));
        Assert.Equal("build,gate", Join(expired.PassedStages));
        var wrongSubject = ReleaseRunner.RunRelease(Release(oidc: Oidc(Now + 300, "repo:org/api:pull_request")), Now);
        Assert.Equal("identity", wrongSubject.Stage);
        Assert.Equal("Subject not allowed by OIDC policy", Join(wrongSubject.Reasons));
    }

    // beginner mistake: trusting a valid identity without checking that the artifact is the one the trusted builder produced
    [Test("rejects a valid identity that deploys an artifact missing from its provenance")]
    public static void RejectsUnknownArtifact()
    {
        var report = ReleaseRunner.RunRelease(Release(artifact: new ArtifactInput(Other, Builder, [Digest], [Builder])), Now);
        Assert.Equal("REJECTED", report.Outcome);
        Assert.Equal("provenance", report.Stage);
        Assert.Equal("Artifact digest not found in provenance", Join(report.Reasons));
        Assert.Equal("build,gate,identity", Join(report.PassedStages));
        var untrusted = ReleaseRunner.RunRelease(Release(artifact: new ArtifactInput(Digest, "https://ci.example/self-hosted", [Digest], [Builder])), Now);
        Assert.Equal("Builder is not trusted", Join(untrusted.Reasons));
    }

    [Test("rejects a promotion without verification in the previous environment and stops at the first failing stage")]
    public static void RejectsPromotionAndStopsEarly()
    {
        var unverified = new PromotionInput("production", "api-service", ["staging", "production"], []);
        var report = ReleaseRunner.RunRelease(Release(promotion: unverified), Now);
        Assert.Equal("promotion", report.Stage);
        Assert.Equal("Verification missing in staging", Join(report.Reasons));
        Assert.Null(report.Patch);
        var failingEverywhere = ReleaseRunner.RunRelease(Release(facts: new Dictionary<string, object> { ["coverage"] = 1, ["criticalVulnerabilities"] = 0 }, promotion: unverified), Now);
        Assert.Equal("gate", failingEverywhere.Stage);
    }
}
