OPERATORS = {
    "gte": lambda fact, value: float(fact) >= float(value),
    "lte": lambda fact, value: float(fact) <= float(value),
    "eq": lambda fact, value: fact == value,
    "in": lambda fact, value: isinstance(value, list) and str(fact) in value,
}


def evaluate_policy(rules: list, facts: dict) -> dict:
    for rule in rules:
        if rule["operator"] not in OPERATORS:
            raise ValueError(f"Unsupported operator: {rule['operator']}")

    failures = []
    for rule in rules:
        if rule["field"] not in facts or not OPERATORS[rule["operator"]](facts[rule["field"]], rule["value"]):
            failures.append({"ruleId": rule["id"], "message": rule["message"]})
    return {"allowed": not failures, "failures": failures}
