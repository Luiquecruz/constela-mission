def manage_ephemeral_environment(action: dict, active_environments: list, max_active_pool: int) -> dict:
    active_list = [e for e in active_environments if e.get("status") == "ACTIVE"]
    action_type = action.get("type")
    pr_id = action.get("prId", "")
    now = action.get("now", 0)

    if action_type == "PROVISION":
        if len(active_list) >= max_active_pool:
            return {
                "success": False,
                "reason": "Active ephemeral environment pool limit reached",
                "environment": None
            }

        existing = next((e for e in active_list if e.get("prId") == pr_id), None)
        if existing:
            return {
                "success": False,
                "reason": "Environment already provisioned for this PR",
                "environment": None
            }

        new_env = {
            "prId": pr_id,
            "name": f"preview-pr-{pr_id}",
            "createdAt": now,
            "status": "ACTIVE"
        }

        return {
            "success": True,
            "reason": "Environment provisioned successfully",
            "environment": new_env
        }

    if action_type == "TEARDOWN":
        existing = next((e for e in active_list if e.get("prId") == pr_id), None)
        if not existing:
            return {
                "success": False,
                "reason": "Environment not found for teardown",
                "environment": None
            }

        term_env = dict(existing)
        term_env["status"] = "TERMINATED"

        return {
            "success": True,
            "reason": "Environment torn down successfully",
            "environment": term_env
        }

    return {
        "success": False,
        "reason": "Unknown action type",
        "environment": None
    }
