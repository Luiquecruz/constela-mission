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
  // TODO: compute the error rate in percent, rounded to two decimals (zero when there were no requests).
  // TODO: hold when there is too little traffic, roll back to weight 0 on too many errors or too much latency.
  // TODO: otherwise advance to the first step above the current weight, or promote to 100 when there is none.
  return { action: 'HOLD', nextWeight: currentWeight, reason: 'Not enough traffic to decide', errorRatePercent: 0 };
}
