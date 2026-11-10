export interface MigrationProject {
  nodeVersion: string;
  tsVersion: string;
  hasMiddlewareFile: boolean;
  cacheComponentsEnabled: boolean;
  singleArgRevalidateTags: number;
  syncRequestApiUsages: number;
  replicas: number;
  hasSharedCacheHandler: boolean;
}

export interface MigrationAuditResult {
  ready: boolean;
  blockers: string[];
  codemods: string[];
}

export function auditMigrationProject(
  project: MigrationProject
): MigrationAuditResult {
  const blockers: string[] = [];
  const codemods: string[] = [];

  // TODO: Audit runtime baselines, codemod targets, cache settings, and multi-replica cacheHandler

  return {
    ready: blockers.length === 0,
    blockers,
    codemods,
  };
}
