A feature flag separates deploying code from releasing a feature. The flag decides, per user, whether the new behavior runs, which lets a team roll a feature out gradually, target a group, and switch it off in seconds when something breaks.

### Requirements

Write `bucket_for(key: str, user_id: str) -> int`, which assigns a user to one of 100 buckets for a flag.

- Hash the UTF-8 text `<key>:<user_id>` (the flag key, a colon and the user id) with 32-bit FNV-1a: start at `0x811C9DC5`; for each byte, XOR it into the hash and multiply by `0x01000193`, keeping 32 bits.
- The bucket is the hash modulo 100, so it is a number from 0 to 99.
- The same user always gets the same bucket for a flag, and different flags give different buckets.

Write `evaluate_feature_flag(flag, context)`. `flag` is a dict with `key`, `enabled`, `emergencyKillSwitch`, `targetSegments` and `rolloutPercent`; `context` has `userId` and `userSegment`. It returns a dict with `active` and `reason`.

Decide in this order:

1. The kill switch is on: inactive, `Emergency kill switch is active`.
2. The flag is not enabled: inactive, `Feature flag is disabled`.
3. The list of target segments is not empty and does not contain the user's segment: inactive, `User segment not targeted`. An empty list targets everyone.
4. The user's bucket is greater than or equal to `rolloutPercent`: inactive, `User outside rollout percentage`. A rollout of 0 reaches nobody and a rollout of 100 reaches everybody.
5. Otherwise: active, `Feature flag active for user`.
