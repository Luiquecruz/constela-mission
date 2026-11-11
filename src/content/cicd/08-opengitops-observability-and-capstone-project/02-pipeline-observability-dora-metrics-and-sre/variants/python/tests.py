MIN = 60_000
START = 1_700_000_000_000


def deployment(deployment_id, status, lead_time):
    return {"id": deployment_id, "timestamp": START, "status": status, "leadTimeMinutes": lead_time}


def incident(incident_id, minutes):
    return {"id": incident_id, "deploymentId": "d", "createdTimestamp": START, "resolvedTimestamp": None if minutes is None else START + minutes * MIN}


def metrics(**overrides):
    result = {"deploymentFrequencyPerDay": 2, "changeFailureRatePercent": 3, "meanLeadTimeMinutes": 30, "meanTimeToRestoreMinutes": 20}
    result.update(overrides)
    return result


@test("computes frequency, failure rate and lead time over the window")
def _():
    deployments = [deployment("a", "SUCCESS", 60), deployment("b", "FAILURE", 120), deployment("c", "SUCCESS", 30), deployment("d", "SUCCESS", 90)]
    assert mod.calculate_dora_metrics(deployments, [], 2) == {"deploymentFrequencyPerDay": 2, "changeFailureRatePercent": 25, "meanLeadTimeMinutes": 75, "meanTimeToRestoreMinutes": 0}


# beginner mistake: counting an incident that is still open as if it had been restored instantly
@test("averages the restore time of resolved incidents only")
def _():
    deployments = [deployment("a", "SUCCESS", 10)]
    incidents = [incident("i1", 30), incident("i2", 90), incident("i3", None)]
    assert mod.calculate_dora_metrics(deployments, incidents, 1)["meanTimeToRestoreMinutes"] == 60
    assert mod.calculate_dora_metrics(deployments, [incident("i3", None)], 1)["meanTimeToRestoreMinutes"] == 0
    assert mod.calculate_dora_metrics([], [incident("i1", 60)], 1)["meanTimeToRestoreMinutes"] == 60
    eight = [deployment(str(index), "SUCCESS", 2 if index == 7 else 1) for index in range(8)]
    assert mod.calculate_dora_metrics(eight, [], 1)["meanLeadTimeMinutes"] == 1.13


@test("rounds to two decimals, returns zeros without deployments and rejects a window that is not positive")
async def _():
    deployments = [deployment("a", "FAILURE", 10), deployment("b", "SUCCESS", 10), deployment("c", "SUCCESS", 11)]
    result = mod.calculate_dora_metrics(deployments, [], 7)
    assert result["deploymentFrequencyPerDay"] == 0.43
    assert result["changeFailureRatePercent"] == 33.33
    assert result["meanLeadTimeMinutes"] == 10.33
    assert mod.calculate_dora_metrics([], [], 7) == {"deploymentFrequencyPerDay": 0, "changeFailureRatePercent": 0, "meanLeadTimeMinutes": 0, "meanTimeToRestoreMinutes": 0}
    error = await capture_error(lambda: mod.calculate_dora_metrics(deployments, [], 0))
    assert "Window must be positive" in str(error)


@test("classifies a team at the elite limits as elite and just outside them as high")
def _():
    assert mod.classify_performance(metrics(deploymentFrequencyPerDay=1, changeFailureRatePercent=5, meanLeadTimeMinutes=60, meanTimeToRestoreMinutes=60)) == "ELITE"
    assert mod.classify_performance(metrics(meanLeadTimeMinutes=61)) == "HIGH"
    assert mod.classify_performance(metrics(deploymentFrequencyPerDay=0.5)) == "HIGH"


@test("lets the weakest of the four measures decide the tier")
def _():
    assert mod.classify_performance(metrics(changeFailureRatePercent=40)) == "LOW"
    assert mod.classify_performance(metrics(meanTimeToRestoreMinutes=5000)) == "MEDIUM"
    assert mod.classify_performance(metrics(deploymentFrequencyPerDay=0.01)) == "LOW"
    assert mod.classify_performance(metrics(deploymentFrequencyPerDay=0.14)) == "HIGH"
    assert mod.classify_performance(metrics(deploymentFrequencyPerDay=0.03)) == "MEDIUM"
    assert mod.classify_performance(metrics(deploymentFrequencyPerDay=0.02)) == "LOW"


@test("turns a service level objective into an error budget that gates releases")
def _():
    assert mod.error_budget(99.9, 100000, 40) == {"allowedFailures": 100, "remainingFailures": 60, "releasesAllowed": True}
    assert mod.error_budget(99.9, 100000, 100) == {"allowedFailures": 100, "remainingFailures": 0, "releasesAllowed": False}
    assert mod.error_budget(99.9, 100000, 150) == {"allowedFailures": 100, "remainingFailures": -50, "releasesAllowed": False}
