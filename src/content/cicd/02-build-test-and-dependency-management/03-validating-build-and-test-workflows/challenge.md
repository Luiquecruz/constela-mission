Build a DAG task scheduler for parallel pipeline execution and a security scan result evaluator.

### Requirements

Implement `scheduleDagTasks(tasks)`:
- `tasks`: Array of `{ id: string, name: string, dependencies: string[] }`.
- If any dependency is missing from `tasks`, throw Error(`"Missing dependency: <dep>"`).
- Schedule tasks into parallel execution batches where tasks in a batch have all dependencies met by earlier batches. Inside a batch, keep the order in which the tasks appear in `tasks`.
- If a cycle prevents scheduling all tasks, throw Error(`"Cyclic dependency detected"`).
- Return array of batches (`string[][]`).

Implement `evaluateScanResults(vulnerabilities, threshold)`:
- `vulnerabilities`: Array of `{ id: string, severity: "low" | "medium" | "high" | "critical", package: string }`.
- `threshold`: Severity level threshold.
- Return `true` if no vulnerability has severity >= `threshold`, otherwise return `false`.
