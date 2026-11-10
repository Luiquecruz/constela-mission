using Dojo;

public static class PullRequestValidatorTests
{
    private static readonly BranchValidationPolicy Policy = new(["feature/", "fix/"], ["main"], 20, 2);

    private static PullRequestMetadata Pr(string branchName = "feature/checkout-retry", string targetBranch = "main", int filesChangedCount = 6, int approversCount = 2) =>
        new(branchName, targetBranch, filesChangedCount, approversCount);

    [Test("approves a feature branch into main that meets every rule")]
    public static void ApprovesValidPullRequest()
    {
        var result = PullRequestValidator.ValidatePullRequest(Pr(), Policy);
        Assert.True(result.Approved);
        Assert.Equal(0, result.Violations.Length);
    }

    [Test("flags a pull request aimed at a branch outside the allowed targets")]
    public static void FlagsTarget()
    {
        var result = PullRequestValidator.ValidatePullRequest(Pr(targetBranch: "release/legacy"), Policy);
        Assert.False(result.Approved);
        Assert.SequenceEqual(["Target branch 'release/legacy' is not allowed"], result.Violations);
    }

    [Test("names the branch that has no allowed prefix")]
    public static void NamesBranch()
    {
        Assert.SequenceEqual(["Branch name 'wip-login' does not match allowed prefixes"], PullRequestValidator.ValidatePullRequest(Pr(branchName: "wip-login"), Policy).Violations);
    }

    [Test("allows exactly the maximum number of changed files and flags one more")]
    public static void FileLimit()
    {
        Assert.True(PullRequestValidator.ValidatePullRequest(Pr(filesChangedCount: 20), Policy).Approved);
        Assert.SequenceEqual(["Files changed (21) exceeds maximum allowed (20)"], PullRequestValidator.ValidatePullRequest(Pr(filesChangedCount: 21), Policy).Violations);
    }

    // beginner mistake: treating one approval as enough when the policy asks for two reviewers
    [Test("requires the minimum number of approvals")]
    public static void Approvals()
    {
        Assert.SequenceEqual(["Approvers count (1) is below minimum required (2)"], PullRequestValidator.ValidatePullRequest(Pr(approversCount: 1), Policy).Violations);
    }

    [Test("lists every violation in rule order")]
    public static void EveryViolation()
    {
        var result = PullRequestValidator.ValidatePullRequest(Pr(targetBranch: "develop", branchName: "tmp", filesChangedCount: 40, approversCount: 0), Policy);
        Assert.SequenceEqual(
            [
                "Target branch 'develop' is not allowed",
                "Branch name 'tmp' does not match allowed prefixes",
                "Files changed (40) exceeds maximum allowed (20)",
                "Approvers count (0) is below minimum required (2)",
            ],
            result.Violations);
    }
}
