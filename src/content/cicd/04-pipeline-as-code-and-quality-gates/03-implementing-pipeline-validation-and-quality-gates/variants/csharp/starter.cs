public record PipelineTelemetry(double LineCoveragePercent, int CriticalVulnerabilities, int HighVulnerabilities, int ApprovedReviews, bool RequiredChecksPassed);

public record QualityGatePolicy(
    double MinLineCoveragePercent,
    int MaxCriticalVulnerabilities,
    int MaxHighVulnerabilities,
    int MinApprovedReviews,
    bool RequireAllChecksPassed,
    bool AllowOverride);

public record GateResult(string Status, string[] Violations);

public record OverrideRequest(string Author, string Justification);

public record AuditLog(string Author, string Justification, long Timestamp, string[] Violations);

public record OverrideResult(bool Success, string Status, AuditLog? AuditLog);

public static class QualityGate
{
    public static GateResult EvaluateQualityGate(PipelineTelemetry telemetry, QualityGatePolicy policy)
    {
        var violations = new List<string>();
        // TODO: add one violation per failed check, in this order: coverage, critical vulnerabilities, high vulnerabilities, reviews, status checks.
        return new GateResult("PASSED", violations.ToArray());
    }

    public static OverrideResult ApplyEmergencyOverride(GateResult gate, OverrideRequest request, QualityGatePolicy policy, long now)
    {
        // TODO: a passed gate needs no override; refuse an override that the policy forbids or that has a blank justification.
        // TODO: an accepted override passes with an audit log that records who, why, when and which violations were bypassed.
        return new OverrideResult(false, "BLOCKED", null);
    }
}
