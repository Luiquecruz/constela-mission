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

function compareSemver(actual: string, minimum: string): number {
  const a = actual.split('.').map(Number);
  const m = minimum.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    const diff = (a[i] ?? 0) - (m[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

export function auditMigrationProject(
  project: MigrationProject
): MigrationAuditResult {
  const blockers: string[] = [];
  const codemods: string[] = [];

  if (compareSemver(project.nodeVersion, '20.9.0') < 0) {
    blockers.push('Upgrade Node.js runtime to 20.9.0 or newer');
  }

  if (compareSemver(project.tsVersion, '5.1.0') < 0) {
    blockers.push('Upgrade TypeScript to 5.1.0 or newer');
  }

  if (project.hasMiddlewareFile) {
    blockers.push('Rename middleware.ts to proxy.ts');
    codemods.push('middleware-to-proxy');
  }

  if (project.syncRequestApiUsages > 0) {
    blockers.push(
      'Await async request APIs (params, searchParams, cookies, headers)'
    );
    codemods.push('next-async-request-api');
  }

  if (!project.cacheComponentsEnabled) {
    blockers.push('Enable cacheComponents: true in next.config.ts');
  }

  if (project.singleArgRevalidateTags > 0) {
    blockers.push(
      'Pass a cacheLife profile to revalidateTag(tag, profile) or use updateTag(tag) in Server Actions'
    );
  }

  if (project.replicas > 1 && !project.hasSharedCacheHandler) {
    blockers.push(
      'Configure a shared cacheHandler for multi-instance self-hosting'
    );
  }

  return {
    ready: blockers.length === 0,
    blockers,
    codemods,
  };
}
