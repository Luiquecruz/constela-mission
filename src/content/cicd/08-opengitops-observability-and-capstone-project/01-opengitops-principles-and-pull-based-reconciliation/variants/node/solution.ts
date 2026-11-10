export interface Resource {
  id: string;
  spec: Record<string, string>;
}

export interface ReconcileOptions {
  autoSync: boolean;
  prune: boolean;
}

export interface ReconcileResult {
  inSync: boolean;
  toCreate: string[];
  toUpdate: string[];
  toDelete: string[];
  orphaned: string[];
  applied: boolean;
}

function sameSpec(first: Record<string, string>, second: Record<string, string>): boolean {
  const keys = Object.keys(first);
  return keys.length === Object.keys(second).length && keys.every((key) => Object.hasOwn(second, key) && first[key] === second[key]);
}

export function reconcile(desired: Resource[], live: Resource[], options: ReconcileOptions): ReconcileResult {
  const liveById = new Map(live.map((resource) => [resource.id, resource]));
  const desiredIds = new Set(desired.map((resource) => resource.id));

  const toCreate = desired.filter((resource) => !liveById.has(resource.id)).map((resource) => resource.id);
  const toUpdate = desired.filter((resource) => liveById.has(resource.id) && !sameSpec(resource.spec, liveById.get(resource.id)!.spec)).map((resource) => resource.id);
  const extra = live.filter((resource) => !desiredIds.has(resource.id)).map((resource) => resource.id);
  const toDelete = options.prune ? extra : [];
  const orphaned = options.prune ? [] : extra;

  const inSync = toCreate.length + toUpdate.length + extra.length === 0;
  const applied = options.autoSync && toCreate.length + toUpdate.length + toDelete.length > 0;
  return { inSync, toCreate, toUpdate, toDelete, orphaned, applied };
}
