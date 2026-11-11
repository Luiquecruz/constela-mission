Resolve build tasks organized in a Directed Acyclic Graph (DAG) into sequential execution batches.

### Requirements

Implement `ResolveBuildOrder(tasks)`:
- `tasks`: Array of `BuildTask(string Id, string[] Dependencies, string Command)`.

Rules:
- Validate that every dependency ID exists in `tasks`. If missing, throw InvalidOperationException(`"Missing dependency: <dep>"`).
- Group tasks into execution batches `string[][]`: the first batch holds the tasks with no dependencies, and every later batch holds tasks whose dependencies are all in earlier batches.
- Inside a batch, keep the order in which the tasks appear in the input.
- A missing dependency is reported before any cycle is looked for, and a task that depends on itself is a cycle.
- If a cyclic dependency exists, throw InvalidOperationException(`"Cyclic dependency detected"`).
