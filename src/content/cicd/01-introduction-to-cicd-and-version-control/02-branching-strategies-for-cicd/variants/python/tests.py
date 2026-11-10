DAY = 86400000
NOW = 1700000000000
POLICY = {"allowedPrefixes": ["feature/", "fix/"], "maxAgeDays": 2}


def branch(name, age_days):
    return {"name": name, "createdAt": NOW - round(age_days * DAY)}


@test("allows a young branch with an allowed prefix")
def _():
    assert mod.evaluate_branch_policy(branch("feature/checkout-retry", 0.5), POLICY, NOW) == {"allowed": True, "reason": "Branch complies with branching policy"}


@test("rejects a branch older than the maximum age")
def _():
    assert mod.evaluate_branch_policy(branch("fix/timeout", 2.5), POLICY, NOW) == {"allowed": False, "reason": "Branch age exceeds maximum threshold"}


@test("allows a branch whose age equals the maximum exactly")
def _():
    assert mod.evaluate_branch_policy(branch("fix/timeout", 2), POLICY, NOW)["allowed"] is True


@test("rejects a name without an allowed prefix, comparing letter case exactly")
def _():
    assert mod.evaluate_branch_policy(branch("hotfix/login", 1), POLICY, NOW) == {"allowed": False, "reason": "Branch name violates prefix policy"}
    assert mod.evaluate_branch_policy(branch("Feature/login", 1), POLICY, NOW)["allowed"] is False


# beginner mistake: searching for the prefix anywhere in the name instead of at the start
@test("requires the prefix at the start of the name")
def _():
    assert mod.evaluate_branch_policy(branch("experiment/feature/login", 1), POLICY, NOW) == {"allowed": False, "reason": "Branch name violates prefix policy"}


@test("reports the age first when a branch breaks both rules")
def _():
    assert mod.evaluate_branch_policy(branch("wip-login", 10), POLICY, NOW)["reason"] == "Branch age exceeds maximum threshold"
