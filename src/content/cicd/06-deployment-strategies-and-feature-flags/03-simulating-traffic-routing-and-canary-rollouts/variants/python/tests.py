STEPS = [10, 25, 50]
LIMITS = {"maxErrorRatePercent": 1, "maxLatencyP99Ms": 500, "minRequests": 100}


def metrics(total, errors, latency=200):
    return {"totalRequests": total, "errorRequests": errors, "latencyP99Ms": latency}


@test("advances to the first step when the canary starts healthy")
def _():
    assert mod.decide_canary_step(STEPS, 0, metrics(1000, 2), LIMITS) == {"action": "ADVANCE", "nextWeight": 10, "reason": "Canary healthy, advancing", "errorRatePercent": 0.2}


@test("moves to the first step above the current weight, even when the weight is between steps")
def _():
    assert mod.decide_canary_step(STEPS, 25, metrics(1000, 0), LIMITS)["nextWeight"] == 50
    assert mod.decide_canary_step(STEPS, 15, metrics(1000, 0), LIMITS)["nextWeight"] == 25


# beginner mistake: acting on a handful of requests, where one error looks like a 100% failure
@test("holds the current weight until there is enough traffic to judge")
def _():
    assert mod.decide_canary_step(STEPS, 10, metrics(1, 1), LIMITS) == {"action": "HOLD", "nextWeight": 10, "reason": "Not enough traffic to decide", "errorRatePercent": 100}
    assert mod.decide_canary_step(STEPS, 10, metrics(0, 0), LIMITS) == {"action": "HOLD", "nextWeight": 10, "reason": "Not enough traffic to decide", "errorRatePercent": 0}


@test("rolls back to zero when the error rate is above the limit and tolerates exactly the limit")
def _():
    assert mod.decide_canary_step(STEPS, 25, metrics(1000, 11), LIMITS) == {"action": "ROLLBACK", "nextWeight": 0, "reason": "Error rate exceeds limit", "errorRatePercent": 1.1}
    assert mod.decide_canary_step(STEPS, 25, metrics(1000, 10), LIMITS)["action"] == "ADVANCE"


@test("rolls back when the latency is above the limit and reports errors first when both fail")
def _():
    assert mod.decide_canary_step(STEPS, 25, metrics(1000, 0, 501), LIMITS) == {"action": "ROLLBACK", "nextWeight": 0, "reason": "Latency exceeds limit", "errorRatePercent": 0}
    assert mod.decide_canary_step(STEPS, 25, metrics(1000, 50, 900), LIMITS)["reason"] == "Error rate exceeds limit"


@test("promotes to full traffic when a healthy canary is at the final step")
def _():
    assert mod.decide_canary_step(STEPS, 50, metrics(1000, 1), LIMITS) == {"action": "PROMOTE", "nextWeight": 100, "reason": "Canary healthy at the final step", "errorRatePercent": 0.1}
