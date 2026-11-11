Delivery metrics only help when they are computed the same way every time. Write the three calculations a platform team reports: the DORA delivery metrics for a period, the performance tier they put the team in, and the error budget that decides whether releases may continue.

### Requirements

In the static class `DoraCalculator`, write `DoraMetrics CalculateDoraMetrics(DeploymentRecord[] deployments, IncidentRecord[] incidents, double windowDays)`, using the records declared in the file: `DeploymentRecord(Id, Timestamp, Status, LeadTimeMinutes)`, `IncidentRecord(Id, DeploymentId, CreatedTimestamp, ResolvedTimestamp)` with a nullable `ResolvedTimestamp`, and `DoraMetrics(DeploymentFrequencyPerDay, ChangeFailureRatePercent, MeanLeadTimeMinutes, MeanTimeToRestoreMinutes)`. The failure is an `ArgumentException`. Round with `Math.Round(value, 2, MidpointRounding.AwayFromZero)`.

- `deployments` are `{ id, timestamp, status, leadTimeMinutes }` with status `SUCCESS` or `FAILURE`; `incidents` are `{ id, deploymentId, createdTimestamp, resolvedTimestamp }` with timestamps in milliseconds, where `resolvedTimestamp` is empty (`null`) while the incident is open.
- A `windowDays` that is zero or negative fails with `Window must be positive`.
- With no deployments, the deployment frequency, the failure rate and the lead time are 0; the mean time to restore still comes from the resolved incidents.
- `deploymentFrequencyPerDay` is the number of deployments divided by the window; `changeFailureRatePercent` is the share of `FAILURE` deployments, in percent; `meanLeadTimeMinutes` is the mean of the lead times; `meanTimeToRestoreMinutes` is the mean duration in minutes of the **resolved** incidents, and 0 when none is resolved.
- Every metric is rounded to two decimals, a half rounding away from zero (1.125 becomes 1.13). The rounding is applied to the computed number; the tests only use values whose midpoint is exact in binary floating point.

Also write `string ClassifyPerformance(DoraMetrics metrics)`, which returns `"ELITE"`, `"HIGH"`, `"MEDIUM"` or `"LOW"`.

Return the highest tier whose four limits all hold, checking `ELITE`, then `HIGH`, then `MEDIUM`, and `LOW` when none does:

| Tier | Deployments per day at least | Failure rate at most | Lead time at most | Restore time at most |
| --- | --- | --- | --- | --- |
| ELITE | 1 | 5% | 60 min | 60 min |
| HIGH | 0.14 | 15% | 1,440 min | 1,440 min |
| MEDIUM | 0.03 | 30% | 10,080 min | 10,080 min |

The deployment frequency limits are the two-decimal values of about one deployment per week (0.14) and per month (0.03), so they compare correctly with the rounded metric. These limits belong to this challenge. A team's tier is decided by its weakest measure.

Also write `ErrorBudget CalculateErrorBudget(double sloPercent, long totalRequests, long failedRequests)`, returning `ErrorBudget(AllowedFailures, RemainingFailures, ReleasesAllowed)`.

- `allowedFailures` is `totalRequests * (100 - sloPercent) / 100`, rounded to two decimals.
- `remainingFailures` is the allowed failures minus the failed requests, rounded to two decimals; it can be negative.
- Releases are allowed only while `remainingFailures` is greater than 0.
