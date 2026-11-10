Compute the error rate once, up front, and guard the division: with no requests the rate is zero, not an error.
---
Do not judge a canary on a handful of requests. Below the minimum number of requests the right answer is to wait, whatever the few requests say.
---
The two health checks are separate and ordered: a canary that fails on both errors and latency reports the errors.
---
The next weight is the first step strictly above the current one, so a weight that sits between steps still moves forward. When no step is left, the canary is at its final step and is promoted.
