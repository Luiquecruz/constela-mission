export interface InfraResource {
  id: string;
  type: string;
  properties: Record<string, string>;
  dependsOn: string[];
  immutable: string[];
}

export interface PlannedChange {
  action: 'create' | 'update' | 'replace' | 'delete';
  id: string;
}

export interface InfraPlan {
  changes: PlannedChange[];
  summary: { create: number; update: number; replace: number; delete: number };
}

export function planChanges(desired: InfraResource[], current: InfraResource[]): InfraPlan {
  // TODO: order the resources so that each one comes after the resources it depends on (ties by id); fail on an unknown dependency or a cycle.
  // TODO: walk the desired resources in that order: create the missing ones, update the ones that differ, replace them when an immutable property differs.
  // TODO: then delete the current resources that are no longer desired, in reverse dependency order.
  return { changes: [], summary: { create: 0, update: 0, replace: 0, delete: 0 } };
}
