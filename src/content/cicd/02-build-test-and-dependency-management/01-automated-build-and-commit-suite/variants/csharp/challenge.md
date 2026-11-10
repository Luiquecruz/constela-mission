Resolve build tasks organized in a Directed Acyclic Graph (DAG) into sequential execution batches.

### Requirements

Implement `ResolveBuildOrder(tasks)`:
- `tasks`: Array of `BuildTask(string Id, string[] Dependencies, string Command)`.

Rules:
- Validate that every dependency ID exists in `tasks`. If missing, throw InvalidOperationException(`"Missing dependency: <dep>"`).
- Group tasks into execution batches `string[][]`.
- If a cyclic dependency exists, throw InvalidOperationException(`"Cyclic dependency detected"`).
