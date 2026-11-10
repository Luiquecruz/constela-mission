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
  const ageDays = (now - branch.createdAt) / 86400000;

  if (ageDays > policy.maxAgeDays) {
    return {
      allowed: false,
      reason: "Branch age exceeds maximum threshold",
    };
  }

  const validPrefix = policy.allowedPrefixes.some((prefix) =>
    branch.name.startsWith(prefix)
  );

  if (!validPrefix) {
    return {
      allowed: false,
      reason: "Branch name violates prefix policy",
    };
  }

  return {
    allowed: true,
    reason: "Branch complies with branching policy",
  };
}
