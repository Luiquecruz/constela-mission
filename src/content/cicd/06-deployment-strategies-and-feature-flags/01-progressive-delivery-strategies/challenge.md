Choosing how to release is a risk decision. A gradual rolling update is enough for a small change, while a risky one deserves a canary that exposes only a slice of traffic first, and neither makes sense on a cluster that has no room to run old and new versions side by side.

### Requirements

Export `selectDeploymentStrategy(change, cluster)`. `change` is `{ id, riskScore, databaseMigration }` and `cluster` is `{ availableCapacityPercent, maxCanaryTrafficPercent }`. It returns `{ allowed, strategy, reason }`.

Decide in this order:

1. Less than 20% of the cluster capacity available: `{ allowed: false, strategy: 'NONE', reason: 'Insufficient cluster capacity' }`. Exactly 20% is enough.
2. A risk score of 70 or more, or a database migration, needs a canary:
   - if `maxCanaryTrafficPercent` is zero or less: `{ allowed: false, strategy: 'NONE', reason: 'Canary traffic is not allowed on this cluster' }`;
   - otherwise `{ allowed: true, strategy: 'CANARY', reason: 'High risk change requires canary deployment' }`.
3. Any other change: `{ allowed: true, strategy: 'ROLLING', reason: 'Low risk change suitable for rolling deployment' }`.

The risk score goes from 0 to 100.
