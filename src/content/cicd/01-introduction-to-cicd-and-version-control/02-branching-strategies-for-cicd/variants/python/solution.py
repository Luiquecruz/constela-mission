def evaluate_branch_policy(branch: dict, policy: dict, now: int) -> dict:
    created_at = branch.get("createdAt", 0)
    age_days = (now - created_at) / 86400000.0

    max_age_days = policy.get("maxAgeDays", 0)
    if age_days > max_age_days:
        return {
            "allowed": False,
            "reason": "Branch age exceeds maximum threshold"
        }

    branch_name = branch.get("name", "")
    allowed_prefixes = policy.get("allowedPrefixes", [])
    valid_prefix = any(branch_name.startswith(p) for p in allowed_prefixes)

    if not valid_prefix:
        return {
            "allowed": False,
            "reason": "Branch name violates prefix policy"
        }

    return {
        "allowed": True,
        "reason": "Branch complies with branching policy"
    }
