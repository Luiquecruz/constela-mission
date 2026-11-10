using Dojo;

public static class CommitFrequencyTests
{
    private const long Hour = 3600000;
    private const long Start = 1700000000000;

    private static CommitEntry Commit(string hash, double hoursAfterStart) => new(hash, Start + (long)Math.Round(hoursAfterStart * Hour));

    [Test("accepts commits that stay within the allowed interval and rounds the largest gap")]
    public static void AcceptsAndRounds()
    {
        var result = CiEvaluator.EvaluateCommitFrequency([Commit("a1", 0), Commit("b2", 1.0 / 3)], 1, Start + (long)Math.Round(2.0 / 3 * Hour));
        Assert.Equal(new CiEvaluationResult(true, 0.33, "Commit frequency satisfies CI policy"), result);
    }

    [Test("sorts the commits by time before measuring the gaps")]
    public static void SortsCommits()
    {
        var result = CiEvaluator.EvaluateCommitFrequency([Commit("c3", 5), Commit("a1", 0), Commit("b2", 2)], 4, Start + 6 * Hour);
        Assert.Equal(new CiEvaluationResult(true, 3, "Commit frequency satisfies CI policy"), result);
    }

    // beginner mistake: measuring only the gaps between commits and forgetting the time since the last one
    [Test("counts the time since the last commit as a gap")]
    public static void CountsGapToNow()
    {
        var result = CiEvaluator.EvaluateCommitFrequency([Commit("a1", 0), Commit("b2", 1)], 4, Start + 11 * Hour);
        Assert.Equal(new CiEvaluationResult(false, 10, "Commit gap exceeds threshold"), result);
    }

    [Test("treats a gap equal to the threshold as compliant")]
    public static void GapEqualToThreshold()
    {
        Assert.True(CiEvaluator.EvaluateCommitFrequency([Commit("a1", 0), Commit("b2", 4)], 4, Start + 5 * Hour).Compliant);
    }

    [Test("flags a long gap in the middle of the history")]
    public static void FlagsMiddleGap()
    {
        var result = CiEvaluator.EvaluateCommitFrequency([Commit("a1", 0), Commit("b2", 1), Commit("c3", 9.5), Commit("d4", 10)], 8, Start + (long)Math.Round(10.5 * Hour));
        Assert.Equal(new CiEvaluationResult(false, 8.5, "Commit gap exceeds threshold"), result);
    }

    [Test("reports a history without commits as not compliant")]
    public static void EmptyHistory()
    {
        Assert.Equal(new CiEvaluationResult(false, 0, "No commits recorded"), CiEvaluator.EvaluateCommitFrequency([], 4, Start));
    }
}
