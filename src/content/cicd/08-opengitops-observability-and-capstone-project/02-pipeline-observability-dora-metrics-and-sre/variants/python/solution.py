def calculate_dora_metrics(deployments: list, incidents: list, window_days: float) -> dict:
    if window_days <= 0:
        raise ValueError("Window must be positive")
    if not deployments:
        return {"deploymentFrequencyPerDay": 0, "changeFailureRatePercent": 0, "meanLeadTimeMinutes": 0, "meanTimeToRestoreMinutes": 0}

    failed = sum(1 for deployment in deployments if deployment["status"] == "FAILURE")
    lead_total = sum(deployment["leadTimeMinutes"] for deployment in deployments)
    resolved = [incident for incident in incidents if incident["resolvedTimestamp"] is not None]
    restore_total = sum(incident["resolvedTimestamp"] - incident["createdTimestamp"] for incident in resolved)

    return {
        "deploymentFrequencyPerDay": round(len(deployments) / window_days, 2),
        "changeFailureRatePercent": round(failed / len(deployments) * 100, 2),
        "meanLeadTimeMinutes": round(lead_total / len(deployments), 2),
        "meanTimeToRestoreMinutes": 0 if not resolved else round(restore_total / len(resolved) / 60000, 2),
    }


TIERS = [
    ("ELITE", 1, 5, 60, 60),
    ("HIGH", 1 / 7, 15, 1440, 1440),
    ("MEDIUM", 1 / 30, 30, 10080, 10080),
]


def classify_performance(metrics: dict) -> str:
    for tier, frequency, failure_rate, lead_time, restore_time in TIERS:
        if (
            metrics["deploymentFrequencyPerDay"] >= frequency
            and metrics["changeFailureRatePercent"] <= failure_rate
            and metrics["meanLeadTimeMinutes"] <= lead_time
            and metrics["meanTimeToRestoreMinutes"] <= restore_time
        ):
            return tier
    return "LOW"


def error_budget(slo_percent: float, total_requests: int, failed_requests: int) -> dict:
    allowed = round(total_requests * (100 - slo_percent) / 100, 2)
    remaining = round(allowed - failed_requests, 2)
    return {"allowedFailures": allowed, "remainingFailures": remaining, "releasesAllowed": remaining > 0}
