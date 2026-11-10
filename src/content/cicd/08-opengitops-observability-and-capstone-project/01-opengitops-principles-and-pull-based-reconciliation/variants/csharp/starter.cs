public record Resource(string Id, Dictionary<string, string> Spec);

public record ReconcileOptions(bool AutoSync, bool Prune);

public record ReconcileResult(bool InSync, string[] ToCreate, string[] ToUpdate, string[] ToDelete, string[] Orphaned, bool Applied);

public static class GitOpsReconciler
{
    public static ReconcileResult Reconcile(Resource[] desired, Resource[] live, ReconcileOptions options)
    {
        // TODO: compare the desired and live resources by id: missing ones are created, ones with a different spec are updated.
        // TODO: live resources that Git does not list are deleted when prune is on and reported as orphaned when it is off.
        // TODO: the state is in sync only when there is nothing to create, update, delete or report; changes are applied only with AutoSync.
        return new ReconcileResult(true, [], [], [], [], false);
    }
}
