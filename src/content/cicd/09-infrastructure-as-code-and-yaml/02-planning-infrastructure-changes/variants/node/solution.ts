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

function dependencyOrder(resources: InfraResource[]): string[] {
  const ids = new Set(resources.map((resource) => resource.id));
  for (const resource of resources) {
    for (const dependency of resource.dependsOn) {
      if (!ids.has(dependency)) {
        throw new Error(`Unknown dependency: ${dependency}`);
      }
    }
  }

  const remaining = [...resources].sort((first, second) => (first.id < second.id ? -1 : first.id > second.id ? 1 : 0));
  const done = new Set<string>();
  const order: string[] = [];
  while (remaining.length > 0) {
    const index = remaining.findIndex((resource) => resource.dependsOn.every((dependency) => done.has(dependency)));
    if (index < 0) {
      throw new Error('Dependency cycle detected');
    }
    const [next] = remaining.splice(index, 1);
    order.push(next.id);
    done.add(next.id);
  }
  return order;
}

function changedKeys(desired: Record<string, string>, current: Record<string, string>): string[] {
  const keys = new Set([...Object.keys(desired), ...Object.keys(current)]);
  return [...keys].filter((key) => desired[key] !== current[key]);
}

export function planChanges(desired: InfraResource[], current: InfraResource[]): InfraPlan {
  const desiredById = new Map(desired.map((resource) => [resource.id, resource]));
  const currentById = new Map(current.map((resource) => [resource.id, resource]));
  const changes: PlannedChange[] = [];

  for (const id of dependencyOrder(desired)) {
    const wanted = desiredById.get(id)!;
    const existing = currentById.get(id);
    if (existing === undefined) {
      changes.push({ action: 'create', id });
      continue;
    }
    const differences = changedKeys(wanted.properties, existing.properties);
    if (differences.length === 0) {
      continue;
    }
    changes.push({ action: differences.some((key) => wanted.immutable.includes(key)) ? 'replace' : 'update', id });
  }

  for (const id of [...dependencyOrder(current)].reverse()) {
    if (!desiredById.has(id)) {
      changes.push({ action: 'delete', id });
    }
  }

  const count = (action: string) => changes.filter((change) => change.action === action).length;
  return { changes, summary: { create: count('create'), update: count('update'), replace: count('replace'), delete: count('delete') } };
}
