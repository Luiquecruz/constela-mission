Before a pipeline applies infrastructure changes, it should read the plan the way a careful reviewer would: count what changes, find what destroys data and refuse what breaks the team's rules. Terraform can write its plan as JSON, and the part that matters here is `resource_changes`, a list of resources with the `actions` the tool will take and the values the resource will have `after` the change.

### Requirements

Write `review_plan(plan, policy)`, where `plan` is a dict with `resource_changes` and `policy` a dict with `protectedTypes` and `requiredTags`. It returns a dict with `decision`, `summary` and `findings`. The unsupported actions failure is a `ValueError`.

Each resource change is `{ address, type, change: { actions, after } }`. The `after` value is an object, or empty when the resource disappears. The policy is `{ protectedTypes, requiredTags }`.

**Classify** every change from its `actions`:

| Actions | Kind |
| --- | --- |
| `no-op` or `read` | ignored completely |
| `create` | create |
| `update` | update |
| `delete` | delete |
| `delete` and `create`, in either order | replace |

Any other combination fails with `Unsupported actions: <actions joined by commas>`.

**Summary.** Count the changes by kind: `create`, `update`, `replace` and `delete`.

**Findings.** For each change that is not ignored, in the order of the plan, add findings in this order:

1. `protected-destroy` when the kind is delete or replace and the type is in `protectedTypes`. Message `Destroying <address> needs approval`.
2. `missing-tag` for each required tag, in the order of `requiredTags`, when the kind is not delete and `after` has a `tags` attribute that lacks the tag. A `tags` value that is empty counts as having no tags. A resource without a `tags` attribute does not take tags and is skipped. Message `<address> is missing tag '<tag>'`.
3. `public-access` when the kind is not delete and `after` has `publicly_accessible` set to true. Message `<address> is publicly accessible`.

Each finding is `{ address, rule, message }`.

**Decision.** `REJECT` when any finding is a `missing-tag` or a `public-access`; otherwise `REQUIRES_APPROVAL` when there is any finding (a `protected-destroy`); otherwise `APPROVE`.
