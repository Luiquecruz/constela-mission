Resolve build tasks organized in a Directed Acyclic Graph (DAG) into sequential execution batches.

### Requirements

Implement `resolve_build_order(tasks)`:
- `tasks`: List of dicts `{ "id": str, "dependencies": list, "command": str }`.

Rules:
- Validate that every dependency ID listed in `dependencies` exists in `tasks`. If a dependency is missing, raise ValueError(`"Missing dependency: <dep>"`).
- Group tasks that can run in parallel into batches.
- If a cyclic dependency prevents resolving all tasks, raise ValueError(`"Cyclic dependency detected"`).
- Return a list of execution batches `list[list[str]]`.
