from decimal import ROUND_HALF_UP, Decimal


def round2(value: float) -> float:
    return float(Decimal(value).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP))


def calculate_dora_metrics(deployments: list, incidents: list, window_days: float) -> dict:
    if window_days <= 0:
        raise ValueError("Window must be positive")
    failed = sum(1 for deployment in deployments if deployment["status"] == "FAILURE")
    lead_total = sum(deployment["leadTimeMinutes"] for deployment in deployments)
    resolved = [incident for incident in incidents if incident["resolvedTimestamp"] is not None]
    restore_total = sum(incident["resolvedTimestamp"] - incident["createdTimestamp"] for incident in resolved)

    return {
        "deploymentFrequencyPerDay": round2(len(deployments) / window_days),
        "changeFailureRatePercent": 0 if not deployments else round2(failed / len(deployments) * 100),
        "meanLeadTimeMinutes": 0 if not deployments else round2(lead_total / len(deployments)),
        "meanTimeToRestoreMinutes": 0 if not resolved else round2(restore_total / len(resolved) / 60000),
    }


TIERS = [
    ("ELITE", 1, 5, 60, 60),
    ("HIGH", 0.14, 15, 1440, 1440),
    ("MEDIUM", 0.03, 30, 10080, 10080),
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
    allowed = round2(total_requests * (100 - slo_percent) / 100)
    remaining = round2(allowed - failed_requests)
    return {"allowedFailures": allowed, "remainingFailures": remaining, "releasesAllowed": remaining > 0}
