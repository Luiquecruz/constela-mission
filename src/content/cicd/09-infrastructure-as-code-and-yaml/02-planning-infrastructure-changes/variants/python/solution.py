def _dependency_order(resources: list) -> list:
    ids = {resource["id"] for resource in resources}
    for resource in resources:
        for dependency in resource["dependsOn"]:
            if dependency not in ids:
                raise ValueError(f"Unknown dependency: {dependency}")

    remaining = sorted(resources, key=lambda resource: resource["id"])
    done = set()
    order = []
    while remaining:
        ready = next((resource for resource in remaining if all(dependency in done for dependency in resource["dependsOn"])), None)
        if ready is None:
            raise ValueError("Dependency cycle detected")
        remaining.remove(ready)
        order.append(ready["id"])
        done.add(ready["id"])
    return order


def _changed_keys(desired: dict, current: dict) -> list:
    return [key for key in set(desired) | set(current) if desired.get(key) != current.get(key)]


def plan_changes(desired: list, current: list) -> dict:
    desired_by_id = {resource["id"]: resource for resource in desired}
    current_by_id = {resource["id"]: resource for resource in current}
    changes = []

    for resource_id in _dependency_order(desired):
        wanted = desired_by_id[resource_id]
        existing = current_by_id.get(resource_id)
        if existing is None:
            changes.append({"action": "create", "id": resource_id})
            continue
        differences = _changed_keys(wanted["properties"], existing["properties"])
        if not differences:
            continue
        action = "replace" if any(key in wanted["immutable"] for key in differences) else "update"
        changes.append({"action": action, "id": resource_id})

    for resource_id in reversed(_dependency_order(current)):
        if resource_id not in desired_by_id:
            changes.append({"action": "delete", "id": resource_id})

    summary = {action: sum(1 for change in changes if change["action"] == action) for action in ("create", "update", "replace", "delete")}
    return {"changes": changes, "summary": summary}
