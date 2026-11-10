export type Severity = "low" | "medium" | "high" | "critical";

export interface VulnerabilityItem {
  id: string;
  package: string;
  severity: Severity;
}

export interface TestSecuritySummary {
  lineCoveragePercent: number;
  vulnerabilities: VulnerabilityItem[];
}

export interface SecurityCoveragePolicy {
  minLineCoveragePercent: number;
  securityThreshold: Severity;
}

export interface PolicyEvaluationResult {
  approved: boolean;
  violations: string[];
}

const SEVERITY_RANK: Record<Severity, number> = {
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};

export function evaluateTestAndSecuritySummary(
  summary: TestSecuritySummary,
  policy: SecurityCoveragePolicy
): PolicyEvaluationResult {
  const violations: string[] = [];

  if (summary.lineCoveragePercent < policy.minLineCoveragePercent) {
    violations.push(
      `Line coverage ${summary.lineCoveragePercent}% is below minimum required ${policy.minLineCoveragePercent}%`
    );
  }

  const thresholdRank = SEVERITY_RANK[policy.securityThreshold];

  for (const vuln of summary.vulnerabilities) {
    const vulnRank = SEVERITY_RANK[vuln.severity];
    if (vulnRank >= thresholdRank) {
      violations.push(
        `Vulnerability ${vuln.id} (${vuln.severity}) in package ${vuln.package} exceeds allowed threshold ${policy.securityThreshold}`
      );
    }
  }

  return {
    approved: violations.length === 0,
    violations,
  };
}
