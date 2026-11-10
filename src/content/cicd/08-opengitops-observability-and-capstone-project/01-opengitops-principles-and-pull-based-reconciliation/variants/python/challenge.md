A GitOps controller keeps a cluster equal to what Git says. On every loop it compares the desired resources with the live ones and decides what to create, update or delete. Whether it acts or only reports is a policy of the application: auto sync applies the changes, and prune allows deleting what Git no longer lists.

### Requirements

Write `reconcile(desired, live, options)`. Resources are dicts with `id` and `spec`, `options` is a dict with `autoSync` and `prune`, and the result is a dict with `inSync`, `toCreate`, `toUpdate`, `toDelete`, `orphaned` and `applied`.

A resource is `{ id, spec }`, where `spec` is a map of text keys to text values.

Compare by `id`:

- **To create**: in the desired list and not live.
- **To update**: in both lists with different specs. Specs are equal when they have the same keys with the same values, in any key order.
- **Extra**: live resources that the desired list does not contain. With `prune` on they are **to delete**; with `prune` off they are **orphaned** and only reported.

`toCreate` and `toUpdate` keep the order of the desired list; `toDelete` and `orphaned` keep the order of the live list.

The result also says:

- `inSync`: true only when there is nothing to create, update or delete and no orphan.
- `applied`: true only when `autoSync` is on and there is something to create, update or delete. Orphans alone are never applied.
