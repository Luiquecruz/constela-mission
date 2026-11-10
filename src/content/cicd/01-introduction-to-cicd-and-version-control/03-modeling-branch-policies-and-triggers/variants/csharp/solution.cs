public record PullRequestMetadata(string BranchName, string TargetBranch, int FilesChangedCount, int ApproversCount);

public record BranchValidationPolicy(string[] AllowedBranchPrefixes, string[] AllowedTargets, int MaxFilesChanged, int MinApprovers);

public record ValidationResult(bool Approved, string[] Violations);

public static class PullRequestValidator
{
    public static ValidationResult ValidatePullRequest(PullRequestMetadata pr, BranchValidationPolicy policy)
    {
        var violations = new List<string>();

        if (!policy.AllowedTargets.Contains(pr.TargetBranch))
        {
            violations.Add($"Target branch '{pr.TargetBranch}' is not allowed");
        }
        if (!policy.AllowedBranchPrefixes.Any(prefix => pr.BranchName.StartsWith(prefix, StringComparison.Ordinal)))
        {
            violations.Add($"Branch name '{pr.BranchName}' does not match allowed prefixes");
        }
        if (pr.FilesChangedCount > policy.MaxFilesChanged)
        {
            violations.Add($"Files changed ({pr.FilesChangedCount}) exceeds maximum allowed ({policy.MaxFilesChanged})");
        }
        if (pr.ApproversCount < policy.MinApprovers)
        {
            violations.Add($"Approvers count ({pr.ApproversCount}) is below minimum required ({policy.MinApprovers})");
        }

        return new ValidationResult(violations.Count == 0, violations.ToArray());
    }
}
