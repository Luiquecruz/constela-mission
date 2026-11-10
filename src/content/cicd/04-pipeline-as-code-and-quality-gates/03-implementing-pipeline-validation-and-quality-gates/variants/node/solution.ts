export interface PipelineTelemetry {
  lineCoveragePercent: number;
  criticalVulnerabilities: number;
  highVulnerabilities: number;
  approvedReviews: number;
  requiredChecksPassed: boolean;
}

export interface QualityGatePolicy {
  minLineCoveragePercent: number;
  maxCriticalVulnerabilities: number;
  maxHighVulnerabilities: number;
  minApprovedReviews: number;
  requireAllChecksPassed: boolean;
  allowOverride: boolean;
}

export interface GateResult {
  status: 'PASSED' | 'BLOCKED';
  violations: string[];
}

export interface OverrideRequest {
  author: string;
  justification: string;
}

export interface AuditLog {
  author: string;
  justification: string;
  timestamp: number;
  violations: string[];
}

export interface OverrideResult {
  success: boolean;
  status: 'PASSED' | 'BLOCKED' | 'PASSED_WITH_OVERRIDE';
  auditLog: AuditLog | null;
}

export function evaluateQualityGate(telemetry: PipelineTelemetry, policy: QualityGatePolicy): GateResult {
  const violations: string[] = [];

  if (telemetry.lineCoveragePercent < policy.minLineCoveragePercent) {
    violations.push(`Line coverage ${telemetry.lineCoveragePercent}% is below minimum ${policy.minLineCoveragePercent}%`);
  }
  if (telemetry.criticalVulnerabilities > policy.maxCriticalVulnerabilities) {
    violations.push(`Critical vulnerabilities ${telemetry.criticalVulnerabilities} exceed maximum ${policy.maxCriticalVulnerabilities}`);
  }
  if (telemetry.highVulnerabilities > policy.maxHighVulnerabilities) {
    violations.push(`High vulnerabilities ${telemetry.highVulnerabilities} exceed maximum ${policy.maxHighVulnerabilities}`);
  }
  if (telemetry.approvedReviews < policy.minApprovedReviews) {
    violations.push(`Approved reviews ${telemetry.approvedReviews} is below minimum ${policy.minApprovedReviews}`);
  }
  if (policy.requireAllChecksPassed && !telemetry.requiredChecksPassed) {
    violations.push('Required status checks failed');
  }

  return { status: violations.length === 0 ? 'PASSED' : 'BLOCKED', violations };
}

export function applyEmergencyOverride(gate: GateResult, override: OverrideRequest, policy: QualityGatePolicy, now: number): OverrideResult {
  if (gate.status === 'PASSED') {
    return { success: true, status: 'PASSED', auditLog: null };
  }
  if (!policy.allowOverride || override.justification.trim().length === 0) {
    return { success: false, status: 'BLOCKED', auditLog: null };
  }
  return {
    success: true,
    status: 'PASSED_WITH_OVERRIDE',
    auditLog: { author: override.author, justification: override.justification, timestamp: now, violations: [...gate.violations] },
  };
}
