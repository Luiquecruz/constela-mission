RULES = [
    {"id": "coverage", "field": "coverage", "operator": "gte", "value": 80, "message": "Coverage below 80"},
    {"id": "criticals", "field": "criticalVulnerabilities", "operator": "lte", "value": 0, "message": "Critical vulnerabilities present"},
    {"id": "branch", "field": "branch", "operator": "in", "value": ["main", "release"], "message": "Deploys come from main or release"},
    {"id": "environment", "field": "environment", "operator": "eq", "value": "production", "message": "Wrong environment"},
]
GOOD = {"coverage": 85, "criticalVulnerabilities": 0, "branch": "main", "environment": "production"}


@test("allows a deployment when every rule passes")
def _():
    assert mod.evaluate_policy(RULES, GOOD) == {"allowed": True, "failures": []}


@test("treats the numeric limits as inclusive and reports failures in rule order")
def _():
    assert mod.evaluate_policy(RULES, {**GOOD, "coverage": 80})["allowed"] is True
    result = mod.evaluate_policy(RULES, {**GOOD, "coverage": 79, "criticalVulnerabilities": 1})
    assert result == {
        "allowed": False,
        "failures": [
            {"ruleId": "coverage", "message": "Coverage below 80"},
            {"ruleId": "criticals", "message": "Critical vulnerabilities present"},
        ],
    }


@test("checks membership and equality rules")
def _():
    result = mod.evaluate_policy(RULES, {**GOOD, "branch": "feature/x", "environment": "staging"})
    assert result["failures"] == [
        {"ruleId": "branch", "message": "Deploys come from main or release"},
        {"ruleId": "environment", "message": "Wrong environment"},
    ]
    assert mod.evaluate_policy(RULES, {**GOOD, "branch": "release"})["allowed"] is True


# beginner mistake: letting a rule pass because its fact is missing instead of failing closed
@test("fails a rule whose fact is missing")
def _():
    without_coverage = {key: value for key, value in GOOD.items() if key != "coverage"}
    assert mod.evaluate_policy(RULES, without_coverage) == {"allowed": False, "failures": [{"ruleId": "coverage", "message": "Coverage below 80"}]}


@test("rejects an unsupported operator before evaluating any rule")
async def _():
    with_unknown = [*RULES, {"id": "name", "field": "branch", "operator": "matches", "value": "ma.*", "message": "Name does not match"}]
    error = await capture_error(lambda: mod.evaluate_policy(with_unknown, {**GOOD, "coverage": 10}))
    assert "Unsupported operator: matches" in str(error)


@test("evaluates every rule independently and allows an empty rule set")
def _():
    everything_wrong = {"coverage": 1, "criticalVulnerabilities": 9, "branch": "x", "environment": "y"}
    assert [failure["ruleId"] for failure in mod.evaluate_policy(RULES, everything_wrong)["failures"]] == ["coverage", "criticals", "branch", "environment"]
    assert mod.evaluate_policy([], {}) == {"allowed": True, "failures": []}
