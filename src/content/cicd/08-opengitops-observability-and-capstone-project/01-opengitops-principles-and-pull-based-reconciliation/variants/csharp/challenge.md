A GitOps controller keeps a cluster equal to what Git says. On every loop it compares the desired resources with the live ones and decides what to create, update or delete. Whether it acts or only reports is a policy of the application: auto sync applies the changes, and prune allows deleting what Git no longer lists.

### Requirements

In the static class `GitOpsReconciler`, write `ReconcileResult Reconcile(Resource[] desired, Resource[] live, ReconcileOptions options)`, using the records declared in the file: `Resource(Id, Spec)` with `Spec` a `Dictionary<string, string>`, `ReconcileOptions(AutoSync, Prune)` and `ReconcileResult(InSync, ToCreate, ToUpdate, ToDelete, Orphaned, Applied)`.

A resource is `{ id, spec }`, where `spec` is a map of text keys to text values.

Compare by `id`:

- **To create**: in the desired list and not live.
- **To update**: in both lists with different specs. Specs are equal when they have the same keys with the same values, in any key order.
- **Extra**: live resources that the desired list does not contain. With `prune` on they are **to delete**; with `prune` off they are **orphaned** and only reported.

`toCreate` and `toUpdate` keep the order of the desired list; `toDelete` and `orphaned` keep the order of the live list.

The result also says:

- `inSync`: true only when there is nothing to create, update or delete and no orphan.
- `applied`: true only when `autoSync` is on and there is something to create, update or delete. Orphans alone are never applied.
