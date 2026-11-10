A feature flag separates deploying code from releasing a feature. The flag decides, per user, whether the new behavior runs, which lets a team roll a feature out gradually, target a group, and switch it off in seconds when something breaks.

### Requirements

In the static class `FeatureFlags`, write `int BucketFor(string key, string userId)`, which assigns a user to one of 100 buckets for a flag. Use unsigned 32-bit arithmetic (`uint`) so the multiplication wraps around.

- Hash the UTF-8 text `<key>:<userId>` (the flag key, a colon and the user id) with 32-bit FNV-1a: start at `0x811C9DC5`; for each byte, XOR it into the hash and multiply by `0x01000193`, keeping 32 bits.
- The bucket is the hash modulo 100, so it is a number from 0 to 99.
- The same user always gets the same bucket for a flag, and different flags give different buckets.

Also write `FlagEvaluationResult EvaluateFeatureFlag(FeatureFlagConfig flag, UserContext context)`, using the records declared in the file: `FeatureFlagConfig(Key, Enabled, EmergencyKillSwitch, TargetSegments, RolloutPercent)`, `UserContext(UserId, UserSegment)` and `FlagEvaluationResult(Active, Reason)`.

Decide in this order:

1. The kill switch is on: inactive, `Emergency kill switch is active`.
2. The flag is not enabled: inactive, `Feature flag is disabled`.
3. The list of target segments is not empty and does not contain the user's segment: inactive, `User segment not targeted`. An empty list targets everyone.
4. The user's bucket is greater than or equal to `rolloutPercent`: inactive, `User outside rollout percentage`. A rollout of 0 reaches nobody and a rollout of 100 reaches everybody.
5. Otherwise: active, `Feature flag active for user`.
