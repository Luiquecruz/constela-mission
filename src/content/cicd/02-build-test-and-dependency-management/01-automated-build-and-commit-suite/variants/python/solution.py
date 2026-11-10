def resolve_build_order(tasks: list) -> list:
    task_map = {t["id"]: t for t in tasks}

    for task in tasks:
        for dep in task.get("dependencies", []):
            if dep not in task_map:
                raise ValueError(f"Missing dependency: {dep}")

    remaining = list(tasks)
    completed = set()
    batches = []

    while remaining:
        batch = []
        for task in remaining:
            deps = task.get("dependencies", [])
            if all(d in completed for d in deps):
                batch.append(task["id"])

        if not batch:
            raise ValueError("Cyclic dependency detected")

        batches.append(batch)
        completed.update(batch)
        remaining = [t for t in remaining if t["id"] not in completed]

    return batches
