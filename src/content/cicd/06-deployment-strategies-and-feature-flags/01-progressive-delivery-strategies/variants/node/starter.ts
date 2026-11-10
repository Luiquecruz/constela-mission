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
  // TODO: refuse the deployment when less than 20% of the cluster capacity is available.
  // TODO: a risk score of 70 or more, or a database migration, needs a canary, which needs canary traffic to be allowed on the cluster.
  // TODO: any other change can roll out gradually.
  return { allowed: true, strategy: 'ROLLING', reason: 'Low risk change suitable for rolling deployment' };
}
