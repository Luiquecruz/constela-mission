public record CacheEntry(string Key, long CreatedAt, long TtlMs, string Branch);

public record CacheRequest(string PrimaryKey, string[] RestoreKeys, string Branch, string DefaultBranch);

public record CacheResolution(bool Hit, string? MatchedKey, bool Exact, string Reason);

public static class CacheResolver
{
    public static string GenerateCacheKey(string prefix, string lockfileHash) => $"{prefix}-{lockfileHash}";

    private static CacheEntry? Newest(IEnumerable<CacheEntry> entries) =>
        entries.Aggregate((CacheEntry?)null, (best, entry) => best is null || entry.CreatedAt > best.CreatedAt ? entry : best);

    public static CacheResolution ResolveCache(CacheEntry[] entries, CacheRequest request, long now)
    {
        var visible = entries
            .Where(entry => now - entry.CreatedAt <= entry.TtlMs && (entry.Branch == request.Branch || entry.Branch == request.DefaultBranch))
            .ToArray();

        var exact = Newest(visible.Where(entry => entry.Key == request.PrimaryKey));
        if (exact is not null)
        {
            return new CacheResolution(true, exact.Key, true, "Exact cache hit");
        }

        foreach (var restoreKey in request.RestoreKeys)
        {
            var partial = Newest(visible.Where(entry => entry.Key.StartsWith(restoreKey, StringComparison.Ordinal)));
            if (partial is not null)
            {
                return new CacheResolution(true, partial.Key, false, "Restored from fallback key");
            }
        }

        return new CacheResolution(false, null, false, "Cache miss");
    }
}
