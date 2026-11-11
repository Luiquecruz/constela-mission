from decimal import Decimal


def _is_number(raw) -> bool:
    return isinstance(raw, (int, float, Decimal)) and not isinstance(raw, bool) and not (isinstance(raw, Decimal) and raw.is_nan()) and not (isinstance(raw, float) and raw != raw)


def _same_type_equal(fact, value) -> bool:
    if isinstance(fact, str):
        return isinstance(value, str) and fact == value
    return _is_number(fact) and _is_number(value) and fact == value


OPERATORS = {
    "gte": lambda fact, value: _is_number(fact) and _is_number(value) and fact >= value,
    "lte": lambda fact, value: _is_number(fact) and _is_number(value) and fact <= value,
    "eq": _same_type_equal,
    "in": lambda fact, value: isinstance(fact, str) and isinstance(value, list) and fact in value,
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
