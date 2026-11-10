Write the bucket function first. It is plain arithmetic: start from the FNV offset, then for every byte XOR and multiply, keeping only 32 bits after each multiplication.
---
Evaluate the flag from the strongest switch to the weakest: kill switch, enabled, segments, rollout. An earlier rule must be able to stop a later one.
---
Never draw a random number for the rollout. A user who gets `true` now and `false` a second later sees the page flicker, and a percentage that grows would move users in and out. The bucket is what makes the decision repeatable.
---
The rollout test is `bucket >= rolloutPercent` for "outside": a rollout of 35 includes buckets 0 to 34, a rollout of 0 includes nobody.
