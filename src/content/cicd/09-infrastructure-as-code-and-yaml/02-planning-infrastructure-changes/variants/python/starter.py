def plan_changes(desired: list, current: list) -> dict:
    # TODO: order the resources so that each one comes after the resources it depends on (ties by id); raise ValueError on an unknown dependency or a cycle.
    # TODO: walk the desired resources in that order: create the missing ones, update the ones that differ, replace them when an immutable property differs.
    # TODO: then delete the current resources that are no longer desired, in reverse dependency order.
    return {"changes": [], "summary": {"create": 0, "update": 0, "replace": 0, "delete": 0}}
