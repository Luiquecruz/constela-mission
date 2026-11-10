using Dojo;

public static class FeatureFlagTests
{
    private static FeatureFlagConfig Flag(bool enabled = true, bool kill = false, string[]? segments = null, int rollout = 100) =>
        new("checkout-v2", enabled, kill, segments ?? [], rollout);

    private static UserContext User(string userId, string segment = "beta") => new(userId, segment);

    [Test("gives every user a stable bucket from 0 to 99 that depends on the flag key")]
    public static void StableBuckets()
    {
        Assert.Equal(34, FeatureFlags.BucketFor("checkout-v2", "alice"));
        Assert.Equal(89, FeatureFlags.BucketFor("checkout-v2", "bob"));
        Assert.Equal(0, FeatureFlags.BucketFor("checkout-v2", "dave"));
        Assert.Equal(44, FeatureFlags.BucketFor("search-ui", "alice"));
    }

    [Test("lets the kill switch win over every other setting")]
    public static void KillSwitchWins()
    {
        var result = FeatureFlags.EvaluateFeatureFlag(Flag(kill: true, segments: ["beta"]), User("alice"));
        Assert.Equal(new FlagEvaluationResult(false, "Emergency kill switch is active"), result);
    }

    [Test("keeps a disabled flag off for everyone")]
    public static void DisabledStaysOff()
    {
        Assert.Equal(new FlagEvaluationResult(false, "Feature flag is disabled"), FeatureFlags.EvaluateFeatureFlag(Flag(enabled: false), User("alice")));
    }

    [Test("targets only the listed segments and treats an empty list as everyone")]
    public static void TargetsSegments()
    {
        var targeted = Flag(segments: ["staff"]);
        Assert.Equal(new FlagEvaluationResult(false, "User segment not targeted"), FeatureFlags.EvaluateFeatureFlag(targeted, User("alice", "beta")));
        Assert.True(FeatureFlags.EvaluateFeatureFlag(targeted, User("alice", "staff")).Active);
        Assert.True(FeatureFlags.EvaluateFeatureFlag(Flag(), User("alice", "anything")).Active);
    }

    // beginner mistake: drawing a random number on every evaluation so the same user flickers in and out
    [Test("decides the rollout from the bucket, so the same user always gets the same answer")]
    public static void BucketDecidesRollout()
    {
        Assert.True(FeatureFlags.EvaluateFeatureFlag(Flag(rollout: 35), User("alice")).Active);
        Assert.Equal(new FlagEvaluationResult(false, "User outside rollout percentage"), FeatureFlags.EvaluateFeatureFlag(Flag(rollout: 34), User("alice")));
        Assert.False(FeatureFlags.EvaluateFeatureFlag(Flag(rollout: 0), User("dave")).Active);
        Assert.True(FeatureFlags.EvaluateFeatureFlag(Flag(rollout: 1), User("dave")).Active);
        for (var attempt = 0; attempt < 5; attempt++)
        {
            Assert.False(FeatureFlags.EvaluateFeatureFlag(Flag(rollout: 50), User("bob")).Active);
        }
    }

    [Test("keeps a user in the rollout when the percentage grows")]
    public static void KeepsUsersWhenGrowing()
    {
        var users = new[] { "alice", "bob", "carol", "dave", "erin", "judy" };
        var previous = new HashSet<string>();
        foreach (var percent in new[] { 0, 10, 25, 50, 75, 100 })
        {
            var current = users.Where(name => FeatureFlags.EvaluateFeatureFlag(Flag(rollout: percent), User(name)).Active).ToHashSet();
            Assert.True(previous.IsSubsetOf(current));
            previous = current;
        }
        Assert.Equal(users.Length, previous.Count);
    }
}
