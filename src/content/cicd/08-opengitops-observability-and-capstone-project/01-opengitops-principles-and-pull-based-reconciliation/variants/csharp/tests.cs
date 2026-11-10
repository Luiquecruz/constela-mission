using Dojo;

public static class GitOpsReconcilerTests
{
    private static readonly ReconcileOptions Auto = new(true, false);

    private static Resource Item(string id, params (string Key, string Value)[] spec) =>
        new(id, (spec.Length == 0 ? [("image", "api:1"), ("replicas", "2")] : spec).ToDictionary(pair => pair.Key, pair => pair.Value));

    private static string Describe(ReconcileResult result) =>
        $"{result.InSync}|{string.Join(",", result.ToCreate)}|{string.Join(",", result.ToUpdate)}|{string.Join(",", result.ToDelete)}|{string.Join(",", result.Orphaned)}|{result.Applied}";

    [Test("reports a cluster that matches Git as in sync with nothing to do")]
    public static void InSync()
    {
        var state = new[] { Item("deployment/api"), Item("service/api", ("port", "80")) };
        Assert.Equal("True|||||False", Describe(GitOpsReconciler.Reconcile(state, state, Auto)));
    }

    [Test("creates what is missing and updates what differs, in the order Git lists them")]
    public static void CreatesAndUpdates()
    {
        var desired = new[] { Item("service/api", ("port", "80")), Item("deployment/api", ("image", "api:2"), ("replicas", "2")), Item("config/api", ("mode", "prod")) };
        var live = new[] { Item("deployment/api"), Item("service/api", ("port", "80")) };
        Assert.Equal("False|config/api|deployment/api|||True", Describe(GitOpsReconciler.Reconcile(desired, live, Auto)));
    }

    // beginner mistake: ignoring resources that exist in the cluster but not in Git
    [Test("treats a resource that only the cluster has as drift: deleted with prune, reported without it")]
    public static void OnlyInCluster()
    {
        var desired = new[] { Item("deployment/api") };
        var live = new[] { Item("deployment/api"), Item("deployment/debug") };
        Assert.Equal("False|||deployment/debug||True", Describe(GitOpsReconciler.Reconcile(desired, live, new ReconcileOptions(true, true))));
        Assert.Equal("False||||deployment/debug|False", Describe(GitOpsReconciler.Reconcile(desired, live, new ReconcileOptions(true, false))));
    }

    [Test("reports drift without changing anything when auto sync is off")]
    public static void AutoSyncOff()
    {
        var result = GitOpsReconciler.Reconcile([Item("deployment/api", ("image", "api:2"), ("replicas", "2"))], [Item("deployment/api")], new ReconcileOptions(false, true));
        Assert.False(result.InSync);
        Assert.SequenceEqual(["deployment/api"], result.ToUpdate);
        Assert.False(result.Applied);
    }

    [Test("compares specs by content, not by key order, and sees an added or removed key as a difference")]
    public static void ComparesByContent()
    {
        var live = new[] { Item("deployment/api", ("image", "api:1"), ("replicas", "2")) };
        Assert.True(GitOpsReconciler.Reconcile([Item("deployment/api", ("replicas", "2"), ("image", "api:1"))], live, Auto).InSync);
        Assert.SequenceEqual(["deployment/api"], GitOpsReconciler.Reconcile([Item("deployment/api", ("image", "api:1"), ("replicas", "2"), ("env", "prod"))], live, Auto).ToUpdate);
        Assert.SequenceEqual(["deployment/api"], GitOpsReconciler.Reconcile([Item("deployment/api", ("image", "api:1"))], live, Auto).ToUpdate);
    }

    [Test("applies nothing when the only drift is an orphan that pruning is not allowed to remove")]
    public static void OrphanOnly()
    {
        Assert.Equal("False||||job/leftover|False", Describe(GitOpsReconciler.Reconcile([Item("deployment/api")], [Item("deployment/api"), Item("job/leftover")], Auto)));
    }
}
