using System;
using System.Collections.Generic;

public record VulnerabilityItem(string Id, string Package, string Severity);

public record TestSecuritySummary(double LineCoveragePercent, VulnerabilityItem[] Vulnerabilities);

public record SecurityCoveragePolicy(double MinLineCoveragePercent, string SecurityThreshold);

public record PolicyEvaluationResult(bool Approved, string[] Violations);

public static class TestSecurityEvaluator
{
    private static readonly Dictionary<string, int> SeverityRanks = new(StringComparer.OrdinalIgnoreCase)
    {
        { "low", 1 },
        { "medium", 2 },
        { "high", 3 },
        { "critical", 4 }
    };

    public static PolicyEvaluationResult EvaluateTestAndSecuritySummary(
        TestSecuritySummary summary,
        SecurityCoveragePolicy policy
    )
    {
        var violations = new List<string>();

        if (summary.LineCoveragePercent < policy.MinLineCoveragePercent)
        {
            violations.Add(
                $"Line coverage {summary.LineCoveragePercent}% is below minimum required {policy.MinLineCoveragePercent}%"
            );
        }

        int thresholdRank = SeverityRanks.TryGetValue(policy.SecurityThreshold, out int tr) ? tr : 4;

        if (summary.Vulnerabilities != null)
        {
            foreach (var vuln in summary.Vulnerabilities)
            {
                int vulnRank = SeverityRanks.TryGetValue(vuln.Severity, out int vr) ? vr : 1;
                if (vulnRank >= thresholdRank)
                {
                    violations.Add(
                        $"Vulnerability {vuln.Id} ({vuln.Severity}) in package {vuln.Package} exceeds allowed threshold {policy.SecurityThreshold}"
                    );
                }
            }
        }

        return new PolicyEvaluationResult(violations.Count == 0, violations.ToArray());
    }
}
