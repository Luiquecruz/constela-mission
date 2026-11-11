export interface CanaryMetrics {
  totalRequests: number;
  errorRequests: number;
  latencyP99Ms: number;
}

export interface CanaryLimits {
  maxErrorRatePercent: number;
  maxLatencyP99Ms: number;
  minRequests: number;
}

export interface CanaryDecision {
  action: 'ADVANCE' | 'HOLD' | 'ROLLBACK' | 'PROMOTE';
  nextWeight: number;
  reason: string;
  errorRatePercent: number;
}

export function decideCanaryStep(steps: number[], currentWeight: number, metrics: CanaryMetrics, limits: CanaryLimits): CanaryDecision {
  const hundredths = metrics.totalRequests === 0 ? 0n : (BigInt(metrics.errorRequests) * 20000n + BigInt(metrics.totalRequests)) / (2n * BigInt(metrics.totalRequests));
  const errorRatePercent = Number(hundredths) / 100;

  if (metrics.totalRequests < limits.minRequests) {
    return { action: 'HOLD', nextWeight: currentWeight, reason: 'Not enough traffic to decide', errorRatePercent };
  }
  if (metrics.errorRequests * 100 > limits.maxErrorRatePercent * metrics.totalRequests) {
    return { action: 'ROLLBACK', nextWeight: 0, reason: 'Error rate exceeds limit', errorRatePercent };
  }
  if (metrics.latencyP99Ms > limits.maxLatencyP99Ms) {
    return { action: 'ROLLBACK', nextWeight: 0, reason: 'Latency exceeds limit', errorRatePercent };
  }

  const next = steps.find((step) => step > currentWeight);
  if (next === undefined) {
    return { action: 'PROMOTE', nextWeight: 100, reason: 'Canary healthy at the final step', errorRatePercent };
  }
  return { action: 'ADVANCE', nextWeight: next, reason: 'Canary healthy, advancing', errorRatePercent };
}
