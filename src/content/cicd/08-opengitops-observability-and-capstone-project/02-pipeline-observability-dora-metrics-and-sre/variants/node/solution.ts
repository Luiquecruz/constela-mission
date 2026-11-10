export interface DeploymentRecord {
  id: string;
  timestamp: number;
  status: 'SUCCESS' | 'FAILURE';
  leadTimeMinutes: number;
}

export interface IncidentRecord {
  id: string;
  deploymentId: string;
  createdTimestamp: number;
  resolvedTimestamp: number | null;
}

export interface DoraMetrics {
  deploymentFrequencyPerDay: number;
  changeFailureRatePercent: number;
  meanLeadTimeMinutes: number;
  meanTimeToRestoreMinutes: number;
}

export interface ErrorBudget {
  allowedFailures: number;
  remainingFailures: number;
  releasesAllowed: boolean;
}

const round2 = (value: number): number => Math.round(value * 100) / 100;

export function calculateDoraMetrics(deployments: DeploymentRecord[], incidents: IncidentRecord[], windowDays: number): DoraMetrics {
  if (windowDays <= 0) {
    throw new Error('Window must be positive');
  }
  if (deployments.length === 0) {
    return { deploymentFrequencyPerDay: 0, changeFailureRatePercent: 0, meanLeadTimeMinutes: 0, meanTimeToRestoreMinutes: 0 };
  }

  const failed = deployments.filter((deployment) => deployment.status === 'FAILURE').length;
  const leadTotal = deployments.reduce((sum, deployment) => sum + deployment.leadTimeMinutes, 0);
  const resolved = incidents.filter((incident) => incident.resolvedTimestamp !== null);
  const restoreTotal = resolved.reduce((sum, incident) => sum + ((incident.resolvedTimestamp as number) - incident.createdTimestamp), 0);

  return {
    deploymentFrequencyPerDay: round2(deployments.length / windowDays),
    changeFailureRatePercent: round2((failed / deployments.length) * 100),
    meanLeadTimeMinutes: round2(leadTotal / deployments.length),
    meanTimeToRestoreMinutes: resolved.length === 0 ? 0 : round2(restoreTotal / resolved.length / 60000),
  };
}

export function classifyPerformance(metrics: DoraMetrics): 'ELITE' | 'HIGH' | 'MEDIUM' | 'LOW' {
  const tiers: Array<['ELITE' | 'HIGH' | 'MEDIUM', number, number, number, number]> = [
    ['ELITE', 1, 5, 60, 60],
    ['HIGH', 0.14, 15, 1440, 1440],
    ['MEDIUM', 0.03, 30, 10080, 10080],
  ];
  for (const [tier, frequency, failureRate, leadTime, restoreTime] of tiers) {
    if (
      metrics.deploymentFrequencyPerDay >= frequency &&
      metrics.changeFailureRatePercent <= failureRate &&
      metrics.meanLeadTimeMinutes <= leadTime &&
      metrics.meanTimeToRestoreMinutes <= restoreTime
    ) {
      return tier;
    }
  }
  return 'LOW';
}

export function errorBudget(sloPercent: number, totalRequests: number, failedRequests: number): ErrorBudget {
  const allowedFailures = round2((totalRequests * (100 - sloPercent)) / 100);
  const remainingFailures = round2(allowedFailures - failedRequests);
  return { allowedFailures, remainingFailures, releasesAllowed: remainingFailures > 0 };
}
