SEVERITY_RANK = {"low": 1, "medium": 2, "high": 3, "critical": 4}

def schedule_dag_tasks(tasks: list) -> list:
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
            if all(d in completed for d in task.get("dependencies", [])):
                batch.append(task["id"])

        if not batch:
            raise ValueError("Cyclic dependency detected")

        batches.append(batch)
        completed.update(batch)
        remaining = [t for t in remaining if t["id"] not in completed]

    return batches

def evaluate_scan_results(vulnerabilities: list, threshold: str) -> bool:
    threshold_rank = SEVERITY_RANK.get(threshold, 4)
    for vuln in vulnerabilities:
        sev = vuln.get("severity", "low")
        if SEVERITY_RANK.get(sev, 1) >= threshold_rank:
            return False
    return True
