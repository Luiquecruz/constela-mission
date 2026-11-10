using System;
using System.Linq;

public record BranchInfo(string Name, long CreatedAt);

public record BranchPolicy(string[] AllowedPrefixes, double MaxAgeDays);

public record BranchEvaluationResult(bool Allowed, string Reason);

public static class BranchEvaluator
{
    public static BranchEvaluationResult EvaluateBranchPolicy(BranchInfo branch, BranchPolicy policy, long now)
    {
        // TODO: Evaluate branch age and prefix compliance against policy
        return new BranchEvaluationResult(false, "Not implemented");
    }
}
