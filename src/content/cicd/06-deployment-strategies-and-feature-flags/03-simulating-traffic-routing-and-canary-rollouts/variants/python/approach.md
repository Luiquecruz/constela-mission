1. Compute the error rate in percent, rounded to two decimals.
2. Hold when there are fewer requests than the minimum.
3. Roll back to zero when the error rate or the latency is above its limit, checking errors first.
4. Look for the first step above the current weight and advance to it.
5. Promote to 100 when there is no such step.
