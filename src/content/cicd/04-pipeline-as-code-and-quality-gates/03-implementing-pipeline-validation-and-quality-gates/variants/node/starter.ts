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
  // TODO: add one violation per failed check, in this order: coverage, critical vulnerabilities, high vulnerabilities, reviews, status checks.
  return { status: 'PASSED', violations };
}

export function applyEmergencyOverride(gate: GateResult, override: OverrideRequest, policy: QualityGatePolicy, now: number): OverrideResult {
  // TODO: a passed gate needs no override; refuse an override that the policy forbids or that has a blank justification.
  // TODO: an accepted override passes with an audit log that records who, why, when and which violations were bypassed.
  return { success: false, status: 'BLOCKED', auditLog: null };
}
