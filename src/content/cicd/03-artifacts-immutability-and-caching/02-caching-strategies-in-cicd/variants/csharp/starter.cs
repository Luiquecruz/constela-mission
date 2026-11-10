public record CacheEntry(string Key, long CreatedAt, long TtlMs, string Branch);

public record CacheRequest(string PrimaryKey, string[] RestoreKeys, string Branch, string DefaultBranch);

public record CacheResolution(bool Hit, string? MatchedKey, bool Exact, string Reason);

public static class CacheResolver
{
    public static string GenerateCacheKey(string prefix, string lockfileHash)
    {
        // TODO: join the prefix and the lockfile hash with a dash.
        return prefix;
    }

    public static CacheResolution ResolveCache(CacheEntry[] entries, CacheRequest request, long now)
    {
        // TODO: keep only entries that are not expired and were written by the current or the default branch.
        // TODO: prefer an exact match on the primary key, then try each restore key in order and take the newest entry.
        return new CacheResolution(false, null, false, "Cache miss");
    }
}
