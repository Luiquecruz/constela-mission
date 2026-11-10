def calculate_dora_metrics(deployments: list, incidents: list, window_days: float) -> dict:
    # TODO: raise ValueError when the window is not positive; return zeros when there are no deployments.
    # TODO: compute deployments per day, the failure rate, the mean lead time and the mean time to restore, rounded to two decimals.
    # TODO: only incidents that were resolved count towards the time to restore.
    return {"deploymentFrequencyPerDay": 0, "changeFailureRatePercent": 0, "meanLeadTimeMinutes": 0, "meanTimeToRestoreMinutes": 0}


def classify_performance(metrics: dict) -> str:
    # TODO: return the highest tier whose four limits all hold (see the challenge text).
    return "LOW"


def error_budget(slo_percent: float, total_requests: int, failed_requests: int) -> dict:
    # TODO: the budget is the failures the objective allows; releases are allowed while some budget remains.
    return {"allowedFailures": 0, "remainingFailures": 0, "releasesAllowed": False}
