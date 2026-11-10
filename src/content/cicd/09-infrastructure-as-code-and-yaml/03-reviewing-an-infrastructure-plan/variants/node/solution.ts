export interface PlanChange {
  address: string;
  type: string;
  change: { actions: string[]; after: Record<string, unknown> | null };
}

export interface ReviewPolicy {
  protectedTypes: string[];
  requiredTags: string[];
}

export interface Finding {
  address: string;
  rule: string;
  message: string;
}

export interface PlanReview {
  decision: 'APPROVE' | 'REQUIRES_APPROVAL' | 'REJECT';
  summary: { create: number; update: number; replace: number; delete: number };
  findings: Finding[];
}

type Kind = 'none' | 'create' | 'update' | 'delete' | 'replace';

function classify(actions: string[]): Kind {
  switch (actions.join(',')) {
    case 'no-op':
    case 'read':
      return 'none';
    case 'create':
      return 'create';
    case 'update':
      return 'update';
    case 'delete':
      return 'delete';
    case 'delete,create':
    case 'create,delete':
      return 'replace';
    default:
      throw new Error(`Unsupported actions: ${actions.join(',')}`);
  }
}

export function reviewPlan(plan: { resource_changes: PlanChange[] }, policy: ReviewPolicy): PlanReview {
  const summary = { create: 0, update: 0, replace: 0, delete: 0 };
  const findings: Finding[] = [];

  for (const resource of plan.resource_changes) {
    const kind = classify(resource.change.actions);
    if (kind === 'none') {
      continue;
    }
    summary[kind] += 1;

    if ((kind === 'delete' || kind === 'replace') && policy.protectedTypes.includes(resource.type)) {
      findings.push({ address: resource.address, rule: 'protected-destroy', message: `Destroying ${resource.address} needs approval` });
    }

    const after = resource.change.after;
    if (kind !== 'delete' && after !== null) {
      if (Object.hasOwn(after, 'tags')) {
        const tags = (after.tags ?? {}) as Record<string, string>;
        for (const tag of policy.requiredTags) {
          if (!Object.hasOwn(tags, tag)) {
            findings.push({ address: resource.address, rule: 'missing-tag', message: `${resource.address} is missing tag '${tag}'` });
          }
        }
      }
      if (after.publicly_accessible === true) {
        findings.push({ address: resource.address, rule: 'public-access', message: `${resource.address} is publicly accessible` });
      }
    }
  }

  const blocking = findings.some((finding) => finding.rule === 'missing-tag' || finding.rule === 'public-access');
  const decision = blocking ? 'REJECT' : findings.length > 0 ? 'REQUIRES_APPROVAL' : 'APPROVE';
  return { decision, summary, findings };
}
