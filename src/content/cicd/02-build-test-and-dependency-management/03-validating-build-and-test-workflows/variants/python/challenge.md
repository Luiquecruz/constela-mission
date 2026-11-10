Schedule DAG tasks into execution batches and evaluate vulnerability scan results.

### Requirements

Implement `schedule_dag_tasks(tasks)`:
- `tasks`: List of dicts `{ "id": str, "dependencies": list, "command": str }`.
- If a dependency is missing from `tasks`, raise `ValueError("Missing dependency: <dep>")`.
- Schedule the tasks into parallel batches: a task goes into the first batch in which all its dependencies were met by earlier batches. Inside a batch, keep the order in which the tasks appear in the input.
- If a cycle prevents scheduling all tasks, raise `ValueError("Cyclic dependency detected")`.
- Return the batches as `list[list[str]]` of task ids.

Implement `evaluate_scan_results(vulnerabilities, threshold)`:
- `vulnerabilities`: List of dicts `{ "id": str, "package": str, "severity": str }`.
- `threshold`: A severity string.
- Severity ranks: `low` (1), `medium` (2), `high` (3), `critical` (4).
- Return `True` (the gate passes) when no vulnerability has a rank greater than or equal to the rank of `threshold`, and `False` otherwise. A vulnerability that reaches the threshold exactly fails the gate, and an empty list passes.
