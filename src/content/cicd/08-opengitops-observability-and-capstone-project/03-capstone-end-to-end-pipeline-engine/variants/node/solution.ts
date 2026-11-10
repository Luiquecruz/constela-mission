export interface Task {
  id: string;
  dependencies: string[];
  command: string;
}

export interface PolicyRule {
  id: string;
  field: string;
  operator: 'gte' | 'lte' | 'eq';
  value: number | string;
  message: string;
}

export interface OidcInput {
  claims: { iss: string; aud: string; sub: string; exp: number };
  policy: { expectedIssuer: string; expectedAudience: string; allowedSubjects: string[] };
}

export interface ArtifactInput {
  digest: string;
  builderId: string;
  subjectDigests: string[];
  trustedBuilders: string[];
}

export interface HistoryEntry {
  artifactDigest: string;
  env: string;
  status: 'VERIFIED' | 'FAILED';
}

export interface PromotionInput {
  targetEnv: string;
  serviceName: string;
  environments: string[];
  history: HistoryEntry[];
}

export interface ReleaseRequest {
  tasks: Task[];
  facts: Record<string, number | string>;
  rules: PolicyRule[];
  oidc: OidcInput;
  artifact: ArtifactInput;
  promotion: PromotionInput;
}

export interface ManifestPatch {
  path: string;
  content: string;
}

export interface ReleaseReport {
  outcome: 'RELEASED' | 'REJECTED';
  stage: string;
  passedStages: string[];
  reasons: string[];
  batches: string[][];
  patch: ManifestPatch | null;
}

export const STAGES = ['build', 'gate', 'identity', 'provenance', 'promotion'] as const;

export function resolveBuildOrder(tasks: Task[]): string[][] {
  const ids = new Set(tasks.map((task) => task.id));
  for (const task of tasks) {
    for (const dependency of task.dependencies) {
      if (!ids.has(dependency)) {
        throw new Error(`Missing dependency: ${dependency}`);
      }
    }
  }
  let remaining = [...tasks];
  const done = new Set<string>();
  const batches: string[][] = [];
  while (remaining.length > 0) {
    const batch = remaining.filter((task) => task.dependencies.every((dependency) => done.has(dependency))).map((task) => task.id);
    if (batch.length === 0) {
      throw new Error('Cyclic dependency detected');
    }
    batches.push(batch);
    batch.forEach((id) => done.add(id));
    remaining = remaining.filter((task) => !done.has(task.id));
  }
  return batches;
}

export function failedRules(rules: PolicyRule[], facts: Record<string, number | string>): string[] {
  const holds = (rule: PolicyRule): boolean => {
    if (!Object.hasOwn(facts, rule.field)) {
      return false;
    }
    const fact = facts[rule.field];
    return rule.operator === 'gte' ? Number(fact) >= Number(rule.value) : rule.operator === 'lte' ? Number(fact) <= Number(rule.value) : fact === rule.value;
  };
  return rules.filter((rule) => !holds(rule)).map((rule) => rule.message);
}

export function checkIdentity(input: OidcInput, now: number): string | null {
  const { claims, policy } = input;
  if (claims.iss !== policy.expectedIssuer) {
    throw new Error('Invalid OIDC issuer');
  }
  if (claims.aud !== policy.expectedAudience) {
    throw new Error('Invalid OIDC audience');
  }
  if (claims.exp <= now) {
    throw new Error('OIDC token expired');
  }
  return policy.allowedSubjects.includes(claims.sub) ? null : 'Subject not allowed by OIDC policy';
}

export function checkProvenance(artifact: ArtifactInput): string | null {
  const digest = artifact.digest.toLowerCase();
  if (!artifact.subjectDigests.some((subject) => subject.toLowerCase() === digest)) {
    return 'Artifact digest not found in provenance';
  }
  return artifact.trustedBuilders.includes(artifact.builderId) ? null : 'Builder is not trusted';
}

export function planPromotion(artifact: ArtifactInput, promotion: PromotionInput): { reason: string | null; patch: ManifestPatch | null } {
  const position = promotion.environments.indexOf(promotion.targetEnv);
  if (position < 0) {
    return { reason: 'Unknown target environment', patch: null };
  }
  const digest = artifact.digest.toLowerCase();
  if (position > 0) {
    const previous = promotion.environments[position - 1];
    const verified = promotion.history.some((entry) => entry.env === previous && entry.status === 'VERIFIED' && entry.artifactDigest.toLowerCase() === digest);
    if (!verified) {
      return { reason: `Verification missing in ${previous}`, patch: null };
    }
  }
  const content = ['images:', `  - name: ${promotion.serviceName}`, `    digest: ${digest}`, ''].join('\n');
  return { reason: null, patch: { path: `overlays/${promotion.targetEnv}/kustomization.yaml`, content } };
}

export function runRelease(request: ReleaseRequest, now: number): ReleaseReport {
  const passedStages: string[] = [];
  let batches: string[][] = [];

  const reject = (stage: string, reasons: string[]): ReleaseReport => ({ outcome: 'REJECTED', stage, passedStages, reasons, batches, patch: null });

  try {
    batches = resolveBuildOrder(request.tasks);
  } catch (error) {
    return reject('build', [(error as Error).message]);
  }
  passedStages.push('build');

  const gateFailures = failedRules(request.rules, request.facts);
  if (gateFailures.length > 0) {
    return reject('gate', gateFailures);
  }
  passedStages.push('gate');

  try {
    const problem = checkIdentity(request.oidc, now);
    if (problem !== null) {
      return reject('identity', [problem]);
    }
  } catch (error) {
    return reject('identity', [(error as Error).message]);
  }
  passedStages.push('identity');

  const provenanceProblem = checkProvenance(request.artifact);
  if (provenanceProblem !== null) {
    return reject('provenance', [provenanceProblem]);
  }
  passedStages.push('provenance');

  const plan = planPromotion(request.artifact, request.promotion);
  if (plan.reason !== null) {
    return reject('promotion', [plan.reason]);
  }
  passedStages.push('promotion');

  return { outcome: 'RELEASED', stage: 'promotion', passedStages, reasons: [], batches, patch: plan.patch };
}
