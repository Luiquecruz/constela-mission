export interface BranchInfo {
  name: string;
  createdAt: number;
}

export interface BranchPolicy {
  allowedPrefixes: string[];
  maxAgeDays: number;
}

export interface BranchEvaluationResult {
  allowed: boolean;
  reason: string;
}

export function evaluateBranchPolicy(
  branch: BranchInfo,
  policy: BranchPolicy,
  now: number
): BranchEvaluationResult {
  // TODO: Evaluate branch age and prefix compliance against policy
  return {
    allowed: false,
    reason: "Not implemented",
  };
}
