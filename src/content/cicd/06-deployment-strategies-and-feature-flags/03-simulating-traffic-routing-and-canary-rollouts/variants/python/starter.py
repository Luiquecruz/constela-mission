def decide_canary_step(steps: list, current_weight: int, metrics: dict, limits: dict) -> dict:
    # TODO: compute the error rate in percent, rounded to two decimals (zero when there were no requests).
    # TODO: hold when there is too little traffic, roll back to weight 0 on too many errors or too much latency.
    # TODO: otherwise advance to the first step above the current weight, or promote to 100 when there is none.
    return {"action": "HOLD", "nextWeight": current_weight, "reason": "Not enough traffic to decide", "errorRatePercent": 0}
