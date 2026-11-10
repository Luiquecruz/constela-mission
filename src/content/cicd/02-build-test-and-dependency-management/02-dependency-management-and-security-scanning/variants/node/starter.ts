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

export function evaluateTestAndSecuritySummary(
  summary: TestSecuritySummary,
  policy: SecurityCoveragePolicy
): PolicyEvaluationResult {
  // TODO: Evaluate test coverage and security vulnerabilities against policy
  return { approved: false, violations: [] };
}
