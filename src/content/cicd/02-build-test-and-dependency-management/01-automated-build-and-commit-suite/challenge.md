Resolve build tasks organized in a Directed Acyclic Graph (DAG) into sequential execution batches.

### Requirements

Implement `resolveBuildOrder(tasks)`:
- `tasks`: Array of `{ id: string, dependencies: string[], command: string }`.

Rules:
- Validate that every dependency ID listed in `dependencies` exists in `tasks`. If a dependency is missing, throw Error(`"Missing dependency: <dep>"`).
- Group tasks that can run in parallel into batches: tasks in the first batch have zero dependencies. Tasks in subsequent batches only depend on tasks completed in previous batches, and a task goes into the earliest batch in which it can run, so a batch holds every task that is ready.
- Inside a batch, keep the order in which the tasks appear in the input.
- A missing dependency is reported before any cycle is looked for, and a task that depends on itself is a cycle.
- If a cyclic dependency prevents resolving all tasks, throw Error(`"Cyclic dependency detected"`).
- Return an array of execution batches `Array<string[]>`.
