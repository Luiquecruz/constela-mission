Schedule DAG tasks into execution batches and evaluate vulnerability scan results.

### Requirements

Implement `ScheduleDagTasks(tasks)`:
- `tasks`: Array of `BuildTask(string Id, string[] Dependencies, string Command)`.
- Returns execution batches `string[][]`.
- Throws InvalidOperationException(`"Cyclic dependency detected"`) on cycle.

Implement `EvaluateScanResults(vulnerabilities, threshold)`:
- `vulnerabilities`: Array of `VulnerabilityItem(string Id, string Package, string Severity)`.
- `threshold`: Severity string limit.
- Returns `bool`.
