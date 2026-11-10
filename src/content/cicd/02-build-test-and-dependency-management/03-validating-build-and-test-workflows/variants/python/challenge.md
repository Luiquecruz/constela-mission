Schedule DAG tasks into execution batches and evaluate vulnerability scan results.

### Requirements

Implement `schedule_dag_tasks(tasks)`:
- `tasks`: List of dicts `{ "id": str, "dependencies": list, "command": str }`.
- Schedule tasks into parallel execution batches `list[list[str]]`.
- Raise ValueError(`"Cyclic dependency detected"`) if a cycle exists.

Implement `evaluate_scan_results(vulnerabilities, threshold)`:
- `vulnerabilities`: List of dicts `{ "id": str, "package": str, "severity": str }`.
- `threshold`: String severity limit (`"low"`, `"medium"`, `"high"`, `"critical"`).
- Return `True` if zero vulnerabilities meet or exceed `threshold` rank, `False` otherwise.
