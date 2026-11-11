Evaluate Git branch metadata against organizational branching policies.

### Requirements

Implement `evaluate_branch_policy(branch, policy, now)`:
- `branch`: Dict containing `{ "name": str, "createdAt": int }`.
- `policy`: Dict containing `{ "allowedPrefixes": list, "maxAgeDays": float }`.
- `now`: Current timestamp in milliseconds.

Rules:
- Calculate branch age in days: `(now - branch["createdAt"]) / 86400000`.
- If branch age exceeds `policy["maxAgeDays"]` (an age equal to the maximum is allowed), return `{ "allowed": False, "reason": "Branch age exceeds maximum threshold" }`.
- If `branch["name"]` does not start with any string in `policy["allowedPrefixes"]` (compare the letters exactly, so `Feature/login` does not match `feature/`), return `{ "allowed": False, "reason": "Branch name violates prefix policy" }`.
- Otherwise return `{ "allowed": True, "reason": "Branch complies with branching policy" }`.
