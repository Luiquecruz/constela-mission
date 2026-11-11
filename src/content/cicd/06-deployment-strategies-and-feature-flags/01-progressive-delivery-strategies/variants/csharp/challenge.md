Choosing how to release is a risk decision. A gradual rolling update is enough for a small change, while a risky one deserves a canary that exposes only a slice of traffic first, and neither makes sense on a cluster that has no room to run old and new versions side by side.

### Requirements

In the static class `StrategySelector`, write `DeploymentStrategyDecision SelectDeploymentStrategy(ChangeMetadata change, ClusterStatus cluster)`, using the records declared in the file: `ChangeMetadata(Id, RiskScore, DatabaseMigration)`, `ClusterStatus(AvailableCapacityPercent, MaxCanaryTrafficPercent)` and `DeploymentStrategyDecision(Allowed, Strategy, Reason)`.

Decide in this order:

1. Less than 20% of the cluster capacity available: `DeploymentStrategyDecision(false, "NONE", "Insufficient cluster capacity")`. Exactly 20% is enough.
2. A risk score of 70 or more, or a database migration, needs a canary:
   - if `MaxCanaryTrafficPercent` is zero or less: `DeploymentStrategyDecision(false, "NONE", "Canary traffic is not allowed on this cluster")`;
   - otherwise `DeploymentStrategyDecision(true, "CANARY", "High risk change requires canary deployment")`.
3. Any other change: `DeploymentStrategyDecision(true, "ROLLING", "Low risk change suitable for rolling deployment")`.

The risk score goes from 0 to 100.
