using System;
using System.Linq;

public record BranchInfo(string Name, long CreatedAt);

public record BranchPolicy(string[] AllowedPrefixes, double MaxAgeDays);

public record BranchEvaluationResult(bool Allowed, string Reason);

public static class BranchEvaluator
{
    public static BranchEvaluationResult EvaluateBranchPolicy(BranchInfo branch, BranchPolicy policy, long now)
    {
        double ageDays = (now - branch.CreatedAt) / 86400000.0;

        if (ageDays > policy.MaxAgeDays)
        {
            return new BranchEvaluationResult(false, "Branch age exceeds maximum threshold");
        }

        bool validPrefix = policy.AllowedPrefixes.Any(prefix => branch.Name.StartsWith(prefix));

        if (!validPrefix)
        {
            return new BranchEvaluationResult(false, "Branch name violates prefix policy");
        }

        return new BranchEvaluationResult(true, "Branch complies with branching policy");
    }
}
