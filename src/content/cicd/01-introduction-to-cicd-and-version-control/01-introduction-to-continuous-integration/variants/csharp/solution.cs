using System;
using System.Linq;

public record CommitEntry(string Hash, long Timestamp);

public record CiEvaluationResult(bool Compliant, double MaxGapHours, string Reason);

public static class CiEvaluator
{
    public static CiEvaluationResult EvaluateCommitFrequency(CommitEntry[] commits, double maxIntervalHours, long now)
    {
        if (commits == null || commits.Length == 0)
        {
            return new CiEvaluationResult(false, 0, "No commits recorded");
        }

        var sorted = commits.OrderBy(c => c.Timestamp).ToArray();
        long maxGapMs = 0;

        for (int i = 1; i < sorted.Length; i++)
        {
            long gap = sorted[i].Timestamp - sorted[i - 1].Timestamp;
            if (gap > maxGapMs) maxGapMs = gap;
        }

        long lastGap = now - sorted[^1].Timestamp;
        if (lastGap > maxGapMs) maxGapMs = lastGap;

        double maxGapHours = Math.Round((double)maxGapMs / 3600000.0, 2);

        if (maxGapHours > maxIntervalHours)
        {
            return new CiEvaluationResult(false, maxGapHours, "Commit gap exceeds threshold");
        }

        return new CiEvaluationResult(true, maxGapHours, "Commit frequency satisfies CI policy");
    }
}
