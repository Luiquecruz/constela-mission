Infrastructure as code describes the infrastructure you want, and a tool works out how to get there from what exists. That calculation is the plan: which resources to create, change, replace or delete, and in what order. Write the planner.

### Requirements

In the static class `InfraPlanner`, write `InfraPlan PlanChanges(InfraResource[] desired, InfraResource[] current)`, using the records declared in the file: `InfraResource(Id, Type, Properties, DependsOn, Immutable)`, `PlannedChange(Action, Id)`, `InfraSummary(Create, Update, Replace, Delete)` and `InfraPlan(Changes, Summary)`. Failures throw `InvalidOperationException`.

A resource is `{ id, type, properties, dependsOn, immutable }`: `properties` is a map of text keys to text values, `dependsOn` lists the ids it needs first, and `immutable` lists the property names that cannot be changed in place.

**Order.** Order a list of resources so that every resource comes after the resources it depends on. Repeatedly take the resource with the smallest `id` among those whose dependencies are already placed. Fail with `Unknown dependency: <id>` when a dependency is not in the list, and with `Dependency cycle detected` when no resource can be placed.

**Plan.**

1. Walk the desired resources in that order. For each one:
   - not in the current state: `create`;
   - in both, with properties that differ (a key whose value changed, or that was added or removed): `replace` if any differing key is in the desired resource's `immutable` list, otherwise `update`;
   - in both and equal: no change.
2. Then, for the current resources that are not in the desired list, `delete`, in the **reverse** of the order of the current resources.

The result has the `changes` in that sequence, each `{ action, id }`, and a `summary` with the number of `create`, `update`, `replace` and `delete` changes. The order of the two input lists does not matter.
