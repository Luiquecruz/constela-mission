import math


def decide_canary_step(steps: list, current_weight: int, metrics: dict, limits: dict) -> dict:
    total = metrics["totalRequests"]
    raw_rate = 0 if total == 0 else metrics["errorRequests"] / total * 100
    error_rate = math.floor(raw_rate * 100 + 0.5) / 100

    if total < limits["minRequests"]:
        return {"action": "HOLD", "nextWeight": current_weight, "reason": "Not enough traffic to decide", "errorRatePercent": error_rate}
    if raw_rate > limits["maxErrorRatePercent"]:
        return {"action": "ROLLBACK", "nextWeight": 0, "reason": "Error rate exceeds limit", "errorRatePercent": error_rate}
    if metrics["latencyP99Ms"] > limits["maxLatencyP99Ms"]:
        return {"action": "ROLLBACK", "nextWeight": 0, "reason": "Latency exceeds limit", "errorRatePercent": error_rate}

    upcoming = [step for step in steps if step > current_weight]
    if not upcoming:
        return {"action": "PROMOTE", "nextWeight": 100, "reason": "Canary healthy at the final step", "errorRatePercent": error_rate}
    return {"action": "ADVANCE", "nextWeight": upcoming[0], "reason": "Canary healthy, advancing", "errorRatePercent": error_rate}
