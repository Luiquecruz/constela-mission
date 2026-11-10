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

export function reviewPlan(plan: { resource_changes: PlanChange[] }, policy: ReviewPolicy): PlanReview {
  // TODO: classify each change from its actions: create, update, delete, a delete and a create in either order is a replace; no-op and read are ignored; anything else fails.
  // TODO: count the changes, then add the findings described in the challenge, in resource order.
  // TODO: reject on a missing tag or a public resource, require approval for a protected destroy, otherwise approve.
  return { decision: 'APPROVE', summary: { create: 0, update: 0, replace: 0, delete: 0 }, findings: [] };
}
