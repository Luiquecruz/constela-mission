POLICY = {"allowedBranchPrefixes": ["feature/", "fix/"], "allowedTargets": ["main"], "maxFilesChanged": 20, "minApprovers": 2}


def pr(**overrides):
    result = {"branchName": "feature/checkout-retry", "targetBranch": "main", "filesChangedCount": 6, "approversCount": 2}
    result.update(overrides)
    return result


@test("approves a feature branch into main that meets every rule")
def _():
    assert mod.validate_pull_request(pr(), POLICY) == {"approved": True, "violations": []}


@test("flags a pull request aimed at a branch outside the allowed targets")
def _():
    assert mod.validate_pull_request(pr(targetBranch="release/legacy"), POLICY) == {"approved": False, "violations": ["Target branch 'release/legacy' is not allowed"]}


@test("names the branch that has no allowed prefix")
def _():
    assert mod.validate_pull_request(pr(branchName="wip-login"), POLICY)["violations"] == ["Branch name 'wip-login' does not match allowed prefixes"]


@test("allows exactly the maximum number of changed files and flags one more")
def _():
    assert mod.validate_pull_request(pr(filesChangedCount=20), POLICY)["approved"] is True
    assert mod.validate_pull_request(pr(filesChangedCount=21), POLICY)["violations"] == ["Files changed (21) exceeds maximum allowed (20)"]


# beginner mistake: treating one approval as enough when the policy asks for two reviewers
@test("requires the minimum number of approvals")
def _():
    assert mod.validate_pull_request(pr(approversCount=1), POLICY)["violations"] == ["Approvers count (1) is below minimum required (2)"]


@test("lists every violation in rule order")
def _():
    result = mod.validate_pull_request(pr(targetBranch="develop", branchName="tmp", filesChangedCount=40, approversCount=0), POLICY)
    assert result == {
        "approved": False,
        "violations": [
            "Target branch 'develop' is not allowed",
            "Branch name 'tmp' does not match allowed prefixes",
            "Files changed (40) exceeds maximum allowed (20)",
            "Approvers count (0) is below minimum required (2)",
        ],
    }
