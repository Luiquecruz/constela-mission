Schedule DAG tasks into execution batches and evaluate vulnerability scan results.

### Requirements

Implement `ScheduleDagTasks(tasks)`:
- `tasks`: Array of `BuildTask(string Id, string[] Dependencies, string Command)`.
- If a dependency is missing from `tasks`, throw `InvalidOperationException("Missing dependency: <dep>")`.
- Schedule the tasks into parallel batches: a task goes into the first batch in which all its dependencies were met by earlier batches. Inside a batch, keep the order in which the tasks appear in the input.
- If a cycle prevents scheduling all tasks, throw `InvalidOperationException("Cyclic dependency detected")`.
- Return the batches as `string[][]` of task ids.

Implement `EvaluateScanResults(vulnerabilities, threshold)`:
- `vulnerabilities`: Array of `VulnerabilityItem(string Id, string Package, string Severity)`.
- `threshold`: A severity string.
- Severity ranks: `low` (1), `medium` (2), `high` (3), `critical` (4).
- Return `true` (the gate passes) when no vulnerability has a rank greater than or equal to the rank of `threshold`, and `false` otherwise. A vulnerability that reaches the threshold exactly fails the gate, and an empty list passes.
