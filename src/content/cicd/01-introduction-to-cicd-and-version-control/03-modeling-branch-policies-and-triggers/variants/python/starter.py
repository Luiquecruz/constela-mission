def validate_pull_request(pr: dict, policy: dict) -> dict:
    violations = []
    # TODO: check the target branch, the branch prefix, the number of changed files and the approvals, in that order.
    return {"approved": not violations, "violations": violations}
