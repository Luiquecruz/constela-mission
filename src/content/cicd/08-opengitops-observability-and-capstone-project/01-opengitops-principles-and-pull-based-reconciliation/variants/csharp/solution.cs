public record Resource(string Id, Dictionary<string, string> Spec);

public record ReconcileOptions(bool AutoSync, bool Prune);

public record ReconcileResult(bool InSync, string[] ToCreate, string[] ToUpdate, string[] ToDelete, string[] Orphaned, bool Applied);

public static class GitOpsReconciler
{
    private static bool SameSpec(Dictionary<string, string> first, Dictionary<string, string> second) =>
        first.Count == second.Count && first.All(pair => second.TryGetValue(pair.Key, out var value) && value == pair.Value);

    public static ReconcileResult Reconcile(Resource[] desired, Resource[] live, ReconcileOptions options)
    {
        var liveById = live.ToDictionary(resource => resource.Id);
        var desiredIds = desired.Select(resource => resource.Id).ToHashSet();

        var toCreate = desired.Where(resource => !liveById.ContainsKey(resource.Id)).Select(resource => resource.Id).ToArray();
        var toUpdate = desired.Where(resource => liveById.TryGetValue(resource.Id, out var current) && !SameSpec(resource.Spec, current.Spec)).Select(resource => resource.Id).ToArray();
        var extra = live.Where(resource => !desiredIds.Contains(resource.Id)).Select(resource => resource.Id).ToArray();
        var toDelete = options.Prune ? extra : [];
        var orphaned = options.Prune ? [] : extra;

        var inSync = toCreate.Length + toUpdate.Length + extra.Length == 0;
        var applied = options.AutoSync && toCreate.Length + toUpdate.Length + toDelete.Length > 0;
        return new ReconcileResult(inSync, toCreate, toUpdate, toDelete, orphaned, applied);
    }
}
