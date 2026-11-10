using Dojo;

public static class QualityGateTests
{
    private const long Now = 1_700_000_000_000;
    private static readonly QualityGatePolicy Policy = new(80, 0, 2, 2, true, true);

    private static PipelineTelemetry Telemetry(double coverage = 90, int criticals = 0, int highs = 1, int reviews = 2, bool checks = true) => new(coverage, criticals, highs, reviews, checks);

    [Test("passes a release that meets every threshold, including values exactly at the limits")]
    public static void PassesAtLimits()
    {
        var clean = QualityGate.EvaluateQualityGate(Telemetry(), Policy);
        Assert.Equal("PASSED", clean.Status);
        Assert.Equal(0, clean.Violations.Length);
        Assert.Equal("PASSED", QualityGate.EvaluateQualityGate(Telemetry(coverage: 80, highs: 2), Policy).Status);
    }

    [Test("blocks a release and lists every violation in check order")]
    public static void ListsViolations()
    {
        var result = QualityGate.EvaluateQualityGate(Telemetry(coverage: 70, criticals: 2, highs: 5, reviews: 1, checks: false), Policy);
        Assert.Equal("BLOCKED", result.Status);
        Assert.SequenceEqual(
            [
                "Line coverage 70% is below minimum 80%",
                "Critical vulnerabilities 2 exceed maximum 0",
                "High vulnerabilities 5 exceed maximum 2",
                "Approved reviews 1 is below minimum 2",
                "Required status checks failed",
            ],
            result.Violations);
    }

    [Test("ignores failed status checks when the policy does not require them")]
    public static void ChecksOptional()
    {
        var relaxed = Policy with { RequireAllChecksPassed = false };
        Assert.Equal("PASSED", QualityGate.EvaluateQualityGate(Telemetry(checks: false), relaxed).Status);
    }

    [Test("needs no override for a gate that already passed")]
    public static void NoOverrideNeeded()
    {
        var passed = QualityGate.EvaluateQualityGate(Telemetry(), Policy);
        var result = QualityGate.ApplyEmergencyOverride(passed, new OverrideRequest("ana", "urgent"), Policy, Now);
        Assert.True(result.Success);
        Assert.Equal("PASSED", result.Status);
        Assert.Null(result.AuditLog);
    }

    // beginner mistake: accepting an override whose justification is only whitespace
    [Test("refuses an override without a real justification or when the policy forbids it")]
    public static void RefusesOverride()
    {
        var blocked = QualityGate.EvaluateQualityGate(Telemetry(reviews: 0), Policy);
        var blank = QualityGate.ApplyEmergencyOverride(blocked, new OverrideRequest("ana", "   "), Policy, Now);
        Assert.False(blank.Success);
        Assert.Equal("BLOCKED", blank.Status);
        Assert.Null(blank.AuditLog);
        var forbidden = QualityGate.ApplyEmergencyOverride(blocked, new OverrideRequest("ana", "incident 42"), Policy with { AllowOverride = false }, Now);
        Assert.False(forbidden.Success);
        Assert.Null(forbidden.AuditLog);
    }

    [Test("records who, why, when and what was bypassed when an override is accepted")]
    public static void RecordsAudit()
    {
        var blocked = QualityGate.EvaluateQualityGate(Telemetry(reviews: 1, checks: false), Policy);
        var result = QualityGate.ApplyEmergencyOverride(blocked, new OverrideRequest("ana", "incident 42: hotfix for checkout"), Policy, Now);
        Assert.True(result.Success);
        Assert.Equal("PASSED_WITH_OVERRIDE", result.Status);
        Assert.NotNull(result.AuditLog);
        Assert.Equal("ana", result.AuditLog!.Author);
        Assert.Equal("incident 42: hotfix for checkout", result.AuditLog.Justification);
        Assert.Equal(Now, result.AuditLog.Timestamp);
        Assert.SequenceEqual(["Approved reviews 1 is below minimum 2", "Required status checks failed"], result.AuditLog.Violations);
    }
}
