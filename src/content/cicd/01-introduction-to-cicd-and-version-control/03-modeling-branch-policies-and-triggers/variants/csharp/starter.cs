public record PullRequestMetadata(string BranchName, string TargetBranch, int FilesChangedCount, int ApproversCount);

public record BranchValidationPolicy(string[] AllowedBranchPrefixes, string[] AllowedTargets, int MaxFilesChanged, int MinApprovers);

public record ValidationResult(bool Approved, string[] Violations);

public static class PullRequestValidator
{
    public static ValidationResult ValidatePullRequest(PullRequestMetadata pr, BranchValidationPolicy policy)
    {
        var violations = new List<string>();
        // TODO: check the target branch, the branch prefix, the number of changed files and the approvals, in that order.
        return new ValidationResult(violations.Count == 0, violations.ToArray());
    }
}
