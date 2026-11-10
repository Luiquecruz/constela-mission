def evaluate_policy(rules: list, facts: dict) -> dict:
    # TODO: raise ValueError for any operator other than gte, lte, eq and in before evaluating anything.
    # TODO: a rule fails when its fact is missing or the comparison is false; collect the failures in rule order.
    return {"allowed": True, "failures": []}
