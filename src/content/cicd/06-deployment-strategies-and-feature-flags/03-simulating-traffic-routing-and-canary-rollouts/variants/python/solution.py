def decide_canary_step(steps: list, current_weight: int, metrics: dict, limits: dict) -> dict:
    total = metrics["totalRequests"]
    errors = metrics["errorRequests"]
    error_rate = 0 if total == 0 else (errors * 20000 + total) // (2 * total) / 100

    if total < limits["minRequests"]:
        return {"action": "HOLD", "nextWeight": current_weight, "reason": "Not enough traffic to decide", "errorRatePercent": error_rate}
    if errors * 100 > limits["maxErrorRatePercent"] * total:
        return {"action": "ROLLBACK", "nextWeight": 0, "reason": "Error rate exceeds limit", "errorRatePercent": error_rate}
    if metrics["latencyP99Ms"] > limits["maxLatencyP99Ms"]:
        return {"action": "ROLLBACK", "nextWeight": 0, "reason": "Latency exceeds limit", "errorRatePercent": error_rate}

    upcoming = [step for step in steps if step > current_weight]
    if not upcoming:
        return {"action": "PROMOTE", "nextWeight": 100, "reason": "Canary healthy at the final step", "errorRatePercent": error_rate}
    return {"action": "ADVANCE", "nextWeight": upcoming[0], "reason": "Canary healthy, advancing", "errorRatePercent": error_rate}
