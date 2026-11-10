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

export function calculateDoraMetrics(deployments: DeploymentRecord[], incidents: IncidentRecord[], windowDays: number): DoraMetrics {
  // TODO: throw when the window is not positive; return zeros when there are no deployments.
  // TODO: compute deployments per day, the failure rate, the mean lead time and the mean time to restore, rounded to two decimals.
  // TODO: only incidents that were resolved count towards the time to restore.
  return { deploymentFrequencyPerDay: 0, changeFailureRatePercent: 0, meanLeadTimeMinutes: 0, meanTimeToRestoreMinutes: 0 };
}

export function classifyPerformance(metrics: DoraMetrics): 'ELITE' | 'HIGH' | 'MEDIUM' | 'LOW' {
  // TODO: return the highest tier whose four limits all hold (see the challenge text).
  return 'LOW';
}

export function errorBudget(sloPercent: number, totalRequests: number, failedRequests: number): ErrorBudget {
  // TODO: the budget is the failures the objective allows; releases are allowed while some budget remains.
  return { allowedFailures: 0, remainingFailures: 0, releasesAllowed: false };
}
