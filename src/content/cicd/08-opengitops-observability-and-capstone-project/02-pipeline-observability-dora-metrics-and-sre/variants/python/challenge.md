Delivery metrics only help when they are computed the same way every time. Write the three calculations a platform team reports: the DORA delivery metrics for a period, the performance tier they put the team in, and the error budget that decides whether releases may continue.

### Requirements

Write `calculate_dora_metrics(deployments, incidents, window_days)`. Deployments and incidents are dicts, and the result is a dict with `deploymentFrequencyPerDay`, `changeFailureRatePercent`, `meanLeadTimeMinutes` and `meanTimeToRestoreMinutes`. The failure is a `ValueError`.

- `deployments` are `{ id, timestamp, status, leadTimeMinutes }` with status `SUCCESS` or `FAILURE`; `incidents` are `{ id, deploymentId, createdTimestamp, resolvedTimestamp }` with timestamps in milliseconds, where `resolvedTimestamp` is empty (`None`) while the incident is open.
- A `windowDays` that is zero or negative fails with `Window must be positive`.
- With no deployments, the deployment frequency, the failure rate and the lead time are 0; the mean time to restore still comes from the resolved incidents.
- `deploymentFrequencyPerDay` is the number of deployments divided by the window; `changeFailureRatePercent` is the share of `FAILURE` deployments, in percent; `meanLeadTimeMinutes` is the mean of the lead times; `meanTimeToRestoreMinutes` is the mean duration in minutes of the **resolved** incidents, and 0 when none is resolved.
- Every metric is rounded to two decimals, a half rounding up (1.125 becomes 1.13).

Write `classify_performance(metrics)`, which takes that dict and returns `"ELITE"`, `"HIGH"`, `"MEDIUM"` or `"LOW"`.

Return the highest tier whose four limits all hold, checking `ELITE`, then `HIGH`, then `MEDIUM`, and `LOW` when none does:

| Tier | Deployments per day at least | Failure rate at most | Lead time at most | Restore time at most |
| --- | --- | --- | --- | --- |
| ELITE | 1 | 5% | 60 min | 60 min |
| HIGH | 0.14 | 15% | 1,440 min | 1,440 min |
| MEDIUM | 0.03 | 30% | 10,080 min | 10,080 min |

The deployment frequency limits are the two-decimal values of about one deployment per week (0.14) and per month (0.03), so they compare correctly with the rounded metric. These limits belong to this challenge. A team's tier is decided by its weakest measure.

Write `error_budget(slo_percent, total_requests, failed_requests)`. It returns a dict with `allowedFailures`, `remainingFailures` and `releasesAllowed`.

- `allowedFailures` is `totalRequests * (100 - sloPercent) / 100`, rounded to two decimals.
- `remainingFailures` is the allowed failures minus the failed requests, rounded to two decimals; it can be negative.
- Releases are allowed only while `remainingFailures` is greater than 0.
