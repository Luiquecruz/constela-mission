def select_deployment_strategy(change: dict, cluster: dict) -> dict:
    # TODO: refuse the deployment when less than 20% of the cluster capacity is available.
    # TODO: a risk score of 70 or more, or a database migration, needs a canary, which needs canary traffic to be allowed on the cluster.
    # TODO: any other change can roll out gradually.
    return {"allowed": True, "strategy": "ROLLING", "reason": "Low risk change suitable for rolling deployment"}
