Delivery metrics only help when they are computed the same way every time. Write the three calculations a platform team reports: the DORA delivery metrics for a period, the performance tier they put the team in, and the error budget that decides whether releases may continue.

### Requirements

Export `calculateDoraMetrics(deployments, incidents, windowDays)`. It returns `{ deploymentFrequencyPerDay, changeFailureRatePercent, meanLeadTimeMinutes, meanTimeToRestoreMinutes }`.

- `deployments` are `{ id, timestamp, status, leadTimeMinutes }` with status `SUCCESS` or `FAILURE`; `incidents` are `{ id, deploymentId, createdTimestamp, resolvedTimestamp }` with timestamps in milliseconds, where `resolvedTimestamp` is empty (`null`) while the incident is open.
- A `windowDays` that is zero or negative fails with `Window must be positive`.
- With no deployments, every metric is 0.
- `deploymentFrequencyPerDay` is the number of deployments divided by the window; `changeFailureRatePercent` is the share of `FAILURE` deployments, in percent; `meanLeadTimeMinutes` is the mean of the lead times; `meanTimeToRestoreMinutes` is the mean duration in minutes of the **resolved** incidents, and 0 when none is resolved.
- Every metric is rounded to two decimals.

Export `classifyPerformance(metrics)`, which takes the object above and returns `'ELITE'`, `'HIGH'`, `'MEDIUM'` or `'LOW'`.

Return the highest tier whose four limits all hold, checking `ELITE`, then `HIGH`, then `MEDIUM`, and `LOW` when none does:

| Tier | Deployments per day at least | Failure rate at most | Lead time at most | Restore time at most |
| --- | --- | --- | --- | --- |
| ELITE | 1 | 5% | 60 min | 60 min |
| HIGH | 1 / 7 | 15% | 1,440 min | 1,440 min |
| MEDIUM | 1 / 30 | 30% | 10,080 min | 10,080 min |

These limits belong to this challenge. A team's tier is decided by its weakest measure.

Export `errorBudget(sloPercent, totalRequests, failedRequests)`. It returns `{ allowedFailures, remainingFailures, releasesAllowed }`.

- `allowedFailures` is `totalRequests * (100 - sloPercent) / 100`, rounded to two decimals.
- `remainingFailures` is the allowed failures minus the failed requests, rounded to two decimals; it can be negative.
- Releases are allowed only while `remainingFailures` is greater than 0.
