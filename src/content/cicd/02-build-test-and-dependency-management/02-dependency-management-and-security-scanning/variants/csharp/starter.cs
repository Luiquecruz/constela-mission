using System;
using System.Collections.Generic;

public record VulnerabilityItem(string Id, string Package, string Severity);

public record TestSecuritySummary(double LineCoveragePercent, VulnerabilityItem[] Vulnerabilities);

public record SecurityCoveragePolicy(double MinLineCoveragePercent, string SecurityThreshold);

public record PolicyEvaluationResult(bool Approved, string[] Violations);

public static class TestSecurityEvaluator
{
    public static PolicyEvaluationResult EvaluateTestAndSecuritySummary(
        TestSecuritySummary summary,
        SecurityCoveragePolicy policy
    )
    {
        // TODO: Evaluate test coverage and security vulnerabilities against policy
        return new PolicyEvaluationResult(false, Array.Empty<string>());
    }
}
