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
  if (target === 'aws') {
    return 'sts.amazonaws.com';
  }
  if (target === 'azure') {
    return 'api://AzureADTokenExchange';
  }
  throw new Error('Unsupported cloud target');
}

function matchesPattern(pattern: string, subject: string): boolean {
  const source = [...pattern]
    .map((character) => (character === '*' ? '.*' : character === '?' ? '.' : character.replace(/[.+^${}()|[\]\\]/g, '\\$&')))
    .join('');
  return new RegExp(`^${source}$`).test(subject);
}

function subjectTrusted(target: string, subject: string, policy: DeploymentPolicy): boolean {
  if (target === 'aws') {
    return policy.awsSubjectPatterns.some((pattern) => matchesPattern(pattern, subject));
  }
  return policy.azureSubjects.includes(subject);
}

export function authorizeDeployment(request: DeploymentRequest, policy: DeploymentPolicy, now: number): DeploymentDecision {
  const audience = expectedAudience(request.target);
  const { claims, provenance } = request;
  const reasons: string[] = [];

  if (claims.iss !== policy.issuer) {
    reasons.push('Issuer is not trusted');
  }
  if (claims.aud !== audience) {
    reasons.push('Audience does not match the cloud target');
  }
  if (claims.exp <= now) {
    reasons.push('Token expired');
  }
  if (!subjectTrusted(request.target, claims.sub, policy)) {
    reasons.push('Subject is not trusted for this cloud');
  }
  if (provenance.predicateType !== SLSA_PROVENANCE) {
    reasons.push('Unsupported provenance predicate type');
  }
  const digest = request.artifactDigest.toLowerCase();
  if (!provenance.subjectDigests.some((subjectDigest) => subjectDigest.toLowerCase() === digest)) {
    reasons.push('Artifact digest not found in provenance');
  }
  if (!policy.trustedBuilders.includes(provenance.builderId)) {
    reasons.push('Builder is not trusted');
  }

  return { allowed: reasons.length === 0, reasons };
}
