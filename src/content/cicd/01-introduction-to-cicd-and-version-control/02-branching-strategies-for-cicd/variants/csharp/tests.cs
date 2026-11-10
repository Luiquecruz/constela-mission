using Dojo;

public static class BranchPolicyTests
{
    private const long Day = 86400000;
    private const long Now = 1700000000000;
    private static readonly BranchPolicy Policy = new(["feature/", "fix/"], 2);

    private static BranchInfo Branch(string name, double ageDays) => new(name, Now - (long)Math.Round(ageDays * Day));

    [Test("allows a young branch with an allowed prefix")]
    public static void AllowsYoungBranch()
    {
        Assert.Equal(new BranchEvaluationResult(true, "Branch complies with branching policy"), BranchEvaluator.EvaluateBranchPolicy(Branch("feature/checkout-retry", 0.5), Policy, Now));
    }

    [Test("rejects a branch older than the maximum age")]
    public static void RejectsOldBranch()
    {
        Assert.Equal(new BranchEvaluationResult(false, "Branch age exceeds maximum threshold"), BranchEvaluator.EvaluateBranchPolicy(Branch("fix/timeout", 2.5), Policy, Now));
    }

    [Test("allows a branch whose age equals the maximum exactly")]
    public static void AllowsAgeAtLimit()
    {
        Assert.True(BranchEvaluator.EvaluateBranchPolicy(Branch("fix/timeout", 2), Policy, Now).Allowed);
    }

    [Test("rejects a name without an allowed prefix, comparing letter case exactly")]
    public static void RejectsPrefix()
    {
        Assert.Equal(new BranchEvaluationResult(false, "Branch name violates prefix policy"), BranchEvaluator.EvaluateBranchPolicy(Branch("hotfix/login", 1), Policy, Now));
        Assert.False(BranchEvaluator.EvaluateBranchPolicy(Branch("Feature/login", 1), Policy, Now).Allowed);
    }

    // beginner mistake: searching for the prefix anywhere in the name instead of at the start
    [Test("requires the prefix at the start of the name")]
    public static void PrefixAtStart()
    {
        Assert.Equal(new BranchEvaluationResult(false, "Branch name violates prefix policy"), BranchEvaluator.EvaluateBranchPolicy(Branch("experiment/feature/login", 1), Policy, Now));
    }

    [Test("reports the age first when a branch breaks both rules")]
    public static void AgeFirst()
    {
        Assert.Equal("Branch age exceeds maximum threshold", BranchEvaluator.EvaluateBranchPolicy(Branch("wip-login", 10), Policy, Now).Reason);
    }
}
