def review_plan(plan: dict, policy: dict) -> dict:
    # TODO: classify each change from its actions: create, update, delete, a delete and a create in either order is a replace; no-op and read are ignored; anything else raises ValueError.
    # TODO: count the changes, then add the findings described in the challenge, in resource order.
    # TODO: reject on a missing tag or a public resource, require approval for a protected destroy, otherwise approve.
    return {"decision": "APPROVE", "summary": {"create": 0, "update": 0, "replace": 0, "delete": 0}, "findings": []}
