def validate_pull_request(pr: dict, policy: dict) -> dict:
    violations = []

    if pr["targetBranch"] not in policy["allowedTargets"]:
        violations.append(f"Target branch '{pr['targetBranch']}' is not allowed")
    if not any(pr["branchName"].startswith(prefix) for prefix in policy["allowedBranchPrefixes"]):
        violations.append(f"Branch name '{pr['branchName']}' does not match allowed prefixes")
    if pr["filesChangedCount"] > policy["maxFilesChanged"]:
        violations.append(f"Files changed ({pr['filesChangedCount']}) exceeds maximum allowed ({policy['maxFilesChanged']})")
    if pr["approversCount"] < policy["minApprovers"]:
        violations.append(f"Approvers count ({pr['approversCount']}) is below minimum required ({policy['minApprovers']})")

    return {"approved": not violations, "violations": violations}
