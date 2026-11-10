public record ChangeMetadata(string Id, int RiskScore, bool DatabaseMigration);

public record ClusterStatus(int AvailableCapacityPercent, int MaxCanaryTrafficPercent);

public record DeploymentStrategyDecision(bool Allowed, string Strategy, string Reason);

public static class StrategySelector
{
    public static DeploymentStrategyDecision SelectDeploymentStrategy(ChangeMetadata change, ClusterStatus cluster)
    {
        // TODO: refuse the deployment when less than 20% of the cluster capacity is available.
        // TODO: a risk score of 70 or more, or a database migration, needs a canary, which needs canary traffic to be allowed on the cluster.
        // TODO: any other change can roll out gradually.
        return new DeploymentStrategyDecision(true, "ROLLING", "Low risk change suitable for rolling deployment");
    }
}
