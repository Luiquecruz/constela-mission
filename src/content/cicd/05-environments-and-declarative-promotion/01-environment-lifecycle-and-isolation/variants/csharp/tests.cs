using Dojo;

public static class EphemeralEnvironmentTests
{
    private const long Now = 1_700_000_000_000;

    private static EphemeralEnvironment Active(string prId) => new(prId, $"preview-pr-{prId}", Now - 1000, "ACTIVE");

    private static EphemeralEnvironment Terminated(string prId) => Active(prId) with { Status = "TERMINATED" };

    private static EphemeralManagementResult Run(string type, string prId, EphemeralEnvironment[] environments, int pool) =>
        EphemeralEnvironmentManager.ManageEphemeralEnvironment(new EphemeralAction(type, prId, Now), environments, pool);

    [Test("provisions a preview environment named after the pull request")]
    public static void Provisions()
    {
        var result = Run("PROVISION", "42", [], 3);
        Assert.True(result.Success);
        Assert.Equal("Environment provisioned successfully", result.Reason);
        Assert.Equal(new EphemeralEnvironment("42", "preview-pr-42", Now, "ACTIVE"), result.Environment);
    }

    [Test("refuses to provision when the active pool is full")]
    public static void PoolFull()
    {
        var result = Run("PROVISION", "9", [Active("1"), Active("2")], 2);
        Assert.False(result.Success);
        Assert.Equal("Active ephemeral environment pool limit reached", result.Reason);
        Assert.Null(result.Environment);
    }

    // beginner mistake: counting terminated environments against the pool and never freeing the slot
    [Test("does not count terminated environments against the pool")]
    public static void IgnoresTerminated()
    {
        Assert.True(Run("PROVISION", "9", [Active("1"), Terminated("2"), Terminated("3")], 2).Success);
    }

    [Test("refuses a second environment for a pull request that already has one")]
    public static void RefusesDuplicate()
    {
        var result = Run("PROVISION", "1", [Active("1")], 5);
        Assert.False(result.Success);
        Assert.Equal("Environment already provisioned for this PR", result.Reason);
    }

    [Test("provisions again for a pull request whose previous environment was torn down")]
    public static void ReprovisionsAfterTeardown()
    {
        var result = Run("PROVISION", "1", [Terminated("1")], 5);
        Assert.True(result.Success);
        Assert.Equal("ACTIVE", result.Environment!.Status);
    }

    [Test("tears down the active environment of a pull request and reports an unknown one")]
    public static void TearsDown()
    {
        var done = Run("TEARDOWN", "1", [Active("1"), Active("2")], 5);
        Assert.True(done.Success);
        Assert.Equal("Environment torn down successfully", done.Reason);
        Assert.Equal(Terminated("1"), done.Environment);
        var missing = Run("TEARDOWN", "7", [Active("1"), Terminated("7")], 5);
        Assert.False(missing.Success);
        Assert.Equal("Environment not found for teardown", missing.Reason);
    }
}
