Resolve build tasks organized in a Directed Acyclic Graph (DAG) into sequential execution batches.

### Requirements

Implement `resolve_build_order(tasks)`:
- `tasks`: List of dicts `{ "id": str, "dependencies": list, "command": str }`.

Rules:
- Validate that every dependency ID listed in `dependencies` exists in `tasks`. If a dependency is missing, raise ValueError(`"Missing dependency: <dep>"`).
- Group tasks that can run in parallel into batches: the first batch holds all the tasks with no dependencies, and every later batch holds all the tasks whose dependencies are all in earlier batches: a task goes into the earliest batch in which it can run.
- Inside a batch, keep the order in which the tasks appear in the input.
- A missing dependency is reported before any cycle is looked for, and a task that depends on itself is a cycle.
- If a cyclic dependency prevents resolving all tasks, raise ValueError(`"Cyclic dependency detected"`).
- Return a list of execution batches `list[list[str]]`.
