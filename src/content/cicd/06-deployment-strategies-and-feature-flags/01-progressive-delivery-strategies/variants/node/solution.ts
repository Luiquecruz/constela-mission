export interface ChangeMetadata {
  id: string;
  riskScore: number;
  databaseMigration: boolean;
}

export interface ClusterStatus {
  availableCapacityPercent: number;
  maxCanaryTrafficPercent: number;
}

export interface DeploymentStrategyDecision {
  allowed: boolean;
  strategy: 'CANARY' | 'ROLLING' | 'NONE';
  reason: string;
}

export function selectDeploymentStrategy(change: ChangeMetadata, cluster: ClusterStatus): DeploymentStrategyDecision {
  if (cluster.availableCapacityPercent < 20) {
    return { allowed: false, strategy: 'NONE', reason: 'Insufficient cluster capacity' };
  }

  if (change.riskScore >= 70 || change.databaseMigration) {
    if (cluster.maxCanaryTrafficPercent <= 0) {
      return { allowed: false, strategy: 'NONE', reason: 'Canary traffic is not allowed on this cluster' };
    }
    return { allowed: true, strategy: 'CANARY', reason: 'High risk change requires canary deployment' };
  }

  return { allowed: true, strategy: 'ROLLING', reason: 'Low risk change suitable for rolling deployment' };
}
