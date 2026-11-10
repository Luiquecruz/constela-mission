def change(risk_score, database_migration=False):
    return {"id": "rel-1", "riskScore": risk_score, "databaseMigration": database_migration}


def cluster(available=60, max_canary=25):
    return {"availableCapacityPercent": available, "maxCanaryTrafficPercent": max_canary}


@test("rolls out a low risk change gradually")
def _():
    assert mod.select_deployment_strategy(change(10), cluster()) == {"allowed": True, "strategy": "ROLLING", "reason": "Low risk change suitable for rolling deployment"}


@test("switches to a canary at a risk score of 70 and not before")
def _():
    assert mod.select_deployment_strategy(change(69), cluster())["strategy"] == "ROLLING"
    assert mod.select_deployment_strategy(change(70), cluster()) == {"allowed": True, "strategy": "CANARY", "reason": "High risk change requires canary deployment"}


# beginner mistake: judging only the risk score and forgetting that a database migration is risky on its own
@test("requires a canary for a database migration even when the risk score is zero")
def _():
    assert mod.select_deployment_strategy(change(0, True), cluster())["strategy"] == "CANARY"


@test("allows exactly 20% available capacity and refuses less")
def _():
    assert mod.select_deployment_strategy(change(10), cluster(20))["allowed"] is True
    assert mod.select_deployment_strategy(change(10), cluster(19)) == {"allowed": False, "strategy": "NONE", "reason": "Insufficient cluster capacity"}


@test("checks capacity before risk")
def _():
    assert mod.select_deployment_strategy(change(95, True), cluster(5))["reason"] == "Insufficient cluster capacity"


@test("refuses a risky change on a cluster that allows no canary traffic but still rolls out a safe one")
def _():
    assert mod.select_deployment_strategy(change(90), cluster(60, 0)) == {"allowed": False, "strategy": "NONE", "reason": "Canary traffic is not allowed on this cluster"}
    assert mod.select_deployment_strategy(change(10), cluster(60, 0))["strategy"] == "ROLLING"
