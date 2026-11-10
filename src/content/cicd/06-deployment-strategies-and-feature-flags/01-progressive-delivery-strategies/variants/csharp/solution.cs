public record ChangeMetadata(string Id, int RiskScore, bool DatabaseMigration);

public record ClusterStatus(int AvailableCapacityPercent, int MaxCanaryTrafficPercent);

public record DeploymentStrategyDecision(bool Allowed, string Strategy, string Reason);

public static class StrategySelector
{
    public static DeploymentStrategyDecision SelectDeploymentStrategy(ChangeMetadata change, ClusterStatus cluster)
    {
        if (cluster.AvailableCapacityPercent < 20)
        {
            return new DeploymentStrategyDecision(false, "NONE", "Insufficient cluster capacity");
        }

        if (change.RiskScore >= 70 || change.DatabaseMigration)
        {
            if (cluster.MaxCanaryTrafficPercent <= 0)
            {
                return new DeploymentStrategyDecision(false, "NONE", "Canary traffic is not allowed on this cluster");
            }
            return new DeploymentStrategyDecision(true, "CANARY", "High risk change requires canary deployment");
        }

        return new DeploymentStrategyDecision(true, "ROLLING", "Low risk change suitable for rolling deployment");
    }
}
