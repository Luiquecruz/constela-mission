using Dojo;

public static class TestSecurityTests
{
    private static readonly SecurityCoveragePolicy Policy = new(80, "high");

    private static VulnerabilityItem Vulnerability(string id, string severity, string package = "lodash") => new(id, package, severity);

    [Test("approves a build with enough coverage and no blocking vulnerability")]
    public static void ApprovesCleanBuild()
    {
        var summary = new TestSecuritySummary(91, [Vulnerability("CVE-1", "low"), Vulnerability("CVE-2", "medium")]);
        var result = TestSecurityEvaluator.EvaluateTestAndSecuritySummary(summary, Policy);
        Assert.True(result.Approved);
        Assert.Equal(0, result.Violations.Length);
    }

    [Test("reports coverage below the minimum with both numbers")]
    public static void ReportsCoverage()
    {
        var result = TestSecurityEvaluator.EvaluateTestAndSecuritySummary(new TestSecuritySummary(72, []), Policy);
        Assert.False(result.Approved);
        Assert.SequenceEqual(["Line coverage 72% is below minimum required 80%"], result.Violations);
    }

    [Test("accepts coverage exactly at the minimum")]
    public static void CoverageAtMinimum()
    {
        Assert.True(TestSecurityEvaluator.EvaluateTestAndSecuritySummary(new TestSecuritySummary(80, []), Policy).Approved);
    }

    // beginner mistake: comparing severity names as text instead of by rank
    [Test("blocks only vulnerabilities at or above the threshold rank")]
    public static void BlocksByRank()
    {
        var summary = new TestSecuritySummary(90, [Vulnerability("CVE-1", "medium"), Vulnerability("CVE-2", "high", "express"), Vulnerability("CVE-3", "critical", "tar")]);
        Assert.SequenceEqual(
            ["Vulnerability CVE-2 (high) in package express exceeds allowed threshold high", "Vulnerability CVE-3 (critical) in package tar exceeds allowed threshold high"],
            TestSecurityEvaluator.EvaluateTestAndSecuritySummary(summary, Policy).Violations);
    }

    [Test("lets a critical-only threshold ignore high vulnerabilities")]
    public static void CriticalOnly()
    {
        var summary = new TestSecuritySummary(90, [Vulnerability("CVE-2", "high"), Vulnerability("CVE-3", "critical")]);
        var result = TestSecurityEvaluator.EvaluateTestAndSecuritySummary(summary, new SecurityCoveragePolicy(80, "critical"));
        Assert.SequenceEqual(["Vulnerability CVE-3 (critical) in package lodash exceeds allowed threshold critical"], result.Violations);
    }

    [Test("lists the coverage violation first and then each vulnerability in input order")]
    public static void OrdersViolations()
    {
        var summary = new TestSecuritySummary(50, [Vulnerability("B", "critical"), Vulnerability("A", "high")]);
        var result = TestSecurityEvaluator.EvaluateTestAndSecuritySummary(summary, Policy);
        Assert.False(result.Approved);
        Assert.Equal("Line coverage|Vulnerability B|Vulnerability A", string.Join("|", result.Violations.Select(line => string.Join(" ", line.Split(' ').Take(2)))));
    }
}
