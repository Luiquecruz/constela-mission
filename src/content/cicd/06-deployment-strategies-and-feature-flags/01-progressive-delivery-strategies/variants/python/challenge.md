Choosing how to release is a risk decision. A gradual rolling update is enough for a small change, while a risky one deserves a canary that exposes only a slice of traffic first, and neither makes sense on a cluster that has no room to run old and new versions side by side.

### Requirements

Write `select_deployment_strategy(change, cluster)`. `change` is a dict with `id`, `riskScore` and `databaseMigration`; `cluster` has `availableCapacityPercent` and `maxCanaryTrafficPercent`. It returns a dict with `allowed`, `strategy` and `reason`.

Decide in this order:

1. Less than 20% of the cluster capacity available: `{"allowed": False, "strategy": "NONE", "reason": "Insufficient cluster capacity"}`. Exactly 20% is enough.
2. A risk score of 70 or more, or a database migration, needs a canary:
   - if `maxCanaryTrafficPercent` is zero or less: `{"allowed": False, "strategy": "NONE", "reason": "Canary traffic is not allowed on this cluster"}`;
   - otherwise `{"allowed": True, "strategy": "CANARY", "reason": "High risk change requires canary deployment"}`.
3. Any other change: `{"allowed": True, "strategy": "ROLLING", "reason": "Low risk change suitable for rolling deployment"}`.

The risk score goes from 0 to 100.
