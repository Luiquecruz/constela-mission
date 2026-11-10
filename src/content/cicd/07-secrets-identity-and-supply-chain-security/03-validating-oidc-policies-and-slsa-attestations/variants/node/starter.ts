export type CloudTarget = 'aws' | 'azure';

export interface WorkloadClaims {
  iss: string;
  aud: string;
  sub: string;
  exp: number;
}

export interface ProvenanceSummary {
  predicateType: string;
  builderId: string;
  subjectDigests: string[];
}

export interface DeploymentRequest {
  target: string;
  claims: WorkloadClaims;
  artifactDigest: string;
  provenance: ProvenanceSummary;
}

export interface DeploymentPolicy {
  issuer: string;
  awsSubjectPatterns: string[];
  azureSubjects: string[];
  trustedBuilders: string[];
}

export interface DeploymentDecision {
  allowed: boolean;
  reasons: string[];
}

export const SLSA_PROVENANCE = 'https://slsa.dev/provenance/v1';

export function expectedAudience(target: string): string {
  // TODO: return the audience each cloud expects and throw for any other target.
  return 'sts.amazonaws.com';
}

export function authorizeDeployment(request: DeploymentRequest, policy: DeploymentPolicy, now: number): DeploymentDecision {
  // TODO: check issuer, audience, expiration and subject (wildcards on AWS, exact match on Azure).
  // TODO: check the predicate type, the artifact digest and the builder, collecting every failed reason in order.
  return { allowed: true, reasons: [] };
}
