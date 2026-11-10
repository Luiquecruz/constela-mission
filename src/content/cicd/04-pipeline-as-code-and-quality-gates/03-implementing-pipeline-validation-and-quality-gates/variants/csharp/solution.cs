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

        if (telemetry.LineCoveragePercent < policy.MinLineCoveragePercent)
        {
            violations.Add($"Line coverage {telemetry.LineCoveragePercent}% is below minimum {policy.MinLineCoveragePercent}%");
        }
        if (telemetry.CriticalVulnerabilities > policy.MaxCriticalVulnerabilities)
        {
            violations.Add($"Critical vulnerabilities {telemetry.CriticalVulnerabilities} exceed maximum {policy.MaxCriticalVulnerabilities}");
        }
        if (telemetry.HighVulnerabilities > policy.MaxHighVulnerabilities)
        {
            violations.Add($"High vulnerabilities {telemetry.HighVulnerabilities} exceed maximum {policy.MaxHighVulnerabilities}");
        }
        if (telemetry.ApprovedReviews < policy.MinApprovedReviews)
        {
            violations.Add($"Approved reviews {telemetry.ApprovedReviews} is below minimum {policy.MinApprovedReviews}");
        }
        if (policy.RequireAllChecksPassed && !telemetry.RequiredChecksPassed)
        {
            violations.Add("Required status checks failed");
        }

        return new GateResult(violations.Count == 0 ? "PASSED" : "BLOCKED", violations.ToArray());
    }

    public static OverrideResult ApplyEmergencyOverride(GateResult gate, OverrideRequest request, QualityGatePolicy policy, long now)
    {
        if (gate.Status == "PASSED")
        {
            return new OverrideResult(true, "PASSED", null);
        }
        if (!policy.AllowOverride || string.IsNullOrWhiteSpace(request.Justification))
        {
            return new OverrideResult(false, "BLOCKED", null);
        }
        return new OverrideResult(true, "PASSED_WITH_OVERRIDE", new AuditLog(request.Author, request.Justification, now, gate.Violations.ToArray()));
    }
}
