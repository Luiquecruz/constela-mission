A canary rollout shifts traffic to the new version in steps and watches the metrics at each step. At every check the controller has four choices: hold and keep watching, advance to the next weight, promote to everyone, or roll back to zero. Write the function that makes that choice.

### Requirements

Export `decideCanaryStep(steps, currentWeight, metrics, limits)`. It returns `{ action, nextWeight, reason, errorRatePercent }`.

- `steps` is the ascending list of canary weights in percent, such as `[10, 25, 50]`.
- `metrics` is `{ totalRequests, errorRequests, latencyP99Ms }` and `limits` is `{ maxErrorRatePercent, maxLatencyP99Ms, minRequests }`.
- The error rate is `errorRequests / totalRequests * 100`, and zero when there were no requests. Decisions compare the unrounded rate with the limit; only the value reported as `errorRatePercent` is rounded to two decimals, with a half rounding away from zero (0.375 becomes 0.38).

Decide in this order:

1. Fewer requests than `minRequests`: `HOLD`, keep `currentWeight`, reason `Not enough traffic to decide`.
2. Error rate greater than `maxErrorRatePercent`: `ROLLBACK`, weight 0, reason `Error rate exceeds limit`.
3. `latencyP99Ms` greater than `maxLatencyP99Ms`: `ROLLBACK`, weight 0, reason `Latency exceeds limit`.
4. The first step greater than `currentWeight` exists: `ADVANCE` to it, reason `Canary healthy, advancing`.
5. Otherwise: `PROMOTE`, weight 100, reason `Canary healthy at the final step`.

Values exactly at a limit are healthy.
