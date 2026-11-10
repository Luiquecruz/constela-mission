export interface PullRequestMetadata {
  branchName: string;
  targetBranch: string;
  filesChangedCount: number;
  approversCount: number;
}

export interface BranchValidationPolicy {
  allowedBranchPrefixes: string[];
  allowedTargets: string[];
  maxFilesChanged: number;
  minApprovers: number;
}

export interface ValidationResult {
  approved: boolean;
  violations: string[];
}

export function validatePullRequest(pr: PullRequestMetadata, policy: BranchValidationPolicy): ValidationResult {
  const violations: string[] = [];
  // TODO: check the target branch, the branch prefix, the number of changed files and the approvals, in that order.
  return { approved: violations.length === 0, violations };
}
