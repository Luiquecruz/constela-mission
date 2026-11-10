using System;
using System.Linq;

public record CommitEntry(string Hash, long Timestamp);

public record CiEvaluationResult(bool Compliant, double MaxGapHours, string Reason);

public static class CiEvaluator
{
    public static CiEvaluationResult EvaluateCommitFrequency(CommitEntry[] commits, double maxIntervalHours, long now)
    {
        // TODO: Evaluate commit frequency gaps and compare against maxIntervalHours threshold
        return new CiEvaluationResult(false, 0, "Not implemented");
    }
}
