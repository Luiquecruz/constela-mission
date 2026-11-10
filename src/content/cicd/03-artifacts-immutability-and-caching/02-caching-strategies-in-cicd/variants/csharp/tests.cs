using Dojo;

public static class CacheResolverTests
{
    private const long Now = 1700000000000;
    private const long Hour = 3600000;
    private const long Day = 86400000;

    private static CacheEntry Entry(string key, long ageMs, string branch = "main", long ttlMs = 7 * Day) => new(key, Now - ageMs, ttlMs, branch);

    private static CacheRequest Request(string primaryKey, string[]? restoreKeys = null, string branch = "main") => new(primaryKey, restoreKeys ?? [], branch, "main");

    [Test("composes the cache key from a prefix and a lockfile hash")]
    public static void ComposesKey()
    {
        Assert.Equal("npm-linux-9f2c41", CacheResolver.GenerateCacheKey("npm-linux", "9f2c41"));
    }

    [Test("restores the exact key before trying any fallback")]
    public static void ExactFirst()
    {
        var result = CacheResolver.ResolveCache([Entry("npm-v2", Hour), Entry("npm-v1", Hour / 6)], Request("npm-v2", ["npm-"]), Now);
        Assert.Equal(new CacheResolution(true, "npm-v2", true, "Exact cache hit"), result);
    }

    [Test("falls back to the newest entry of the first restore key that matches")]
    public static void FallsBackToNewest()
    {
        var entries = new[] { Entry("npm-a", 3 * Day), Entry("npm-b", Day), Entry("node-x", Hour) };
        Assert.Equal(new CacheResolution(true, "npm-b", false, "Restored from fallback key"), CacheResolver.ResolveCache(entries, Request("npm-zzz", ["npm-", "node-"]), Now));
        Assert.Equal("node-x", CacheResolver.ResolveCache(entries, Request("npm-zzz", ["node-", "npm-"]), Now).MatchedKey);
    }

    [Test("ignores expired entries and keeps one that is exactly at its time to live")]
    public static void HonorsTimeToLive()
    {
        Assert.True(CacheResolver.ResolveCache([Entry("k", Day, "main", Day)], Request("k"), Now).Hit);
        Assert.Equal(new CacheResolution(false, null, false, "Cache miss"), CacheResolver.ResolveCache([Entry("k", Day + 1, "main", Day)], Request("k"), Now));
    }

    // beginner mistake: restoring a cache written by another feature branch, which lets that branch poison this one
    [Test("shows caches from the current and default branches but never from other branches")]
    public static void ScopesByBranch()
    {
        Assert.False(CacheResolver.ResolveCache([Entry("npm-v1", Hour, "feature/other")], Request("npm-v1", [], "feature/mine"), Now).Hit);
        Assert.True(CacheResolver.ResolveCache([Entry("npm-v1", Hour, "main")], Request("npm-v1", [], "feature/mine"), Now).Hit);
        Assert.True(CacheResolver.ResolveCache([Entry("npm-v1", Hour, "feature/mine")], Request("npm-v1", [], "feature/mine"), Now).Hit);
    }

    [Test("reports a miss when no entry matches")]
    public static void ReportsMiss()
    {
        Assert.Equal(new CacheResolution(false, null, false, "Cache miss"), CacheResolver.ResolveCache([], Request("npm-v1", ["npm-"]), Now));
        Assert.False(CacheResolver.ResolveCache([Entry("pip-v1", Hour)], Request("npm-v1", ["npm-"]), Now).Hit);
    }
}
