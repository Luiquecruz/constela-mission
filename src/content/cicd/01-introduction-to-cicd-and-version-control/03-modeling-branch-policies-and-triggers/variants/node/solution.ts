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

  if (!policy.allowedTargets.includes(pr.targetBranch)) {
    violations.push(`Target branch '${pr.targetBranch}' is not allowed`);
  }
  if (!policy.allowedBranchPrefixes.some((prefix) => pr.branchName.startsWith(prefix))) {
    violations.push(`Branch name '${pr.branchName}' does not match allowed prefixes`);
  }
  if (pr.filesChangedCount > policy.maxFilesChanged) {
    violations.push(`Files changed (${pr.filesChangedCount}) exceeds maximum allowed (${policy.maxFilesChanged})`);
  }
  if (pr.approversCount < policy.minApprovers) {
    violations.push(`Approvers count (${pr.approversCount}) is below minimum required (${policy.minApprovers})`);
  }

  return { approved: violations.length === 0, violations };
}
