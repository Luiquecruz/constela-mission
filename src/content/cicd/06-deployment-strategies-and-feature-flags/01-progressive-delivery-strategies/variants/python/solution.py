def select_deployment_strategy(change: dict, cluster: dict) -> dict:
    if cluster["availableCapacityPercent"] < 20:
        return {"allowed": False, "strategy": "NONE", "reason": "Insufficient cluster capacity"}

    if change["riskScore"] >= 70 or change["databaseMigration"]:
        if cluster["maxCanaryTrafficPercent"] <= 0:
            return {"allowed": False, "strategy": "NONE", "reason": "Canary traffic is not allowed on this cluster"}
        return {"allowed": True, "strategy": "CANARY", "reason": "High risk change requires canary deployment"}

    return {"allowed": True, "strategy": "ROLLING", "reason": "Low risk change suitable for rolling deployment"}
