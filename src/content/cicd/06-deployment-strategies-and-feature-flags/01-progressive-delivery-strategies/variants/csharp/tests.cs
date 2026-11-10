using Dojo;

public static class StrategySelectorTests
{
    private static ChangeMetadata Change(int risk, bool migration = false) => new("rel-1", risk, migration);

    private static ClusterStatus Cluster(int available = 60, int maxCanary = 25) => new(available, maxCanary);

    [Test("rolls out a low risk change gradually")]
    public static void RollsOutLowRisk()
    {
        Assert.Equal(new DeploymentStrategyDecision(true, "ROLLING", "Low risk change suitable for rolling deployment"), StrategySelector.SelectDeploymentStrategy(Change(10), Cluster()));
    }

    [Test("switches to a canary at a risk score of 70 and not before")]
    public static void CanaryAtSeventy()
    {
        Assert.Equal("ROLLING", StrategySelector.SelectDeploymentStrategy(Change(69), Cluster()).Strategy);
        Assert.Equal(new DeploymentStrategyDecision(true, "CANARY", "High risk change requires canary deployment"), StrategySelector.SelectDeploymentStrategy(Change(70), Cluster()));
    }

    // beginner mistake: judging only the risk score and forgetting that a database migration is risky on its own
    [Test("requires a canary for a database migration even when the risk score is zero")]
    public static void MigrationNeedsCanary()
    {
        Assert.Equal("CANARY", StrategySelector.SelectDeploymentStrategy(Change(0, true), Cluster()).Strategy);
    }

    [Test("allows exactly 20% available capacity and refuses less")]
    public static void CapacityBoundary()
    {
        Assert.True(StrategySelector.SelectDeploymentStrategy(Change(10), Cluster(20)).Allowed);
        Assert.Equal(new DeploymentStrategyDecision(false, "NONE", "Insufficient cluster capacity"), StrategySelector.SelectDeploymentStrategy(Change(10), Cluster(19)));
    }

    [Test("checks capacity before risk")]
    public static void CapacityFirst()
    {
        Assert.Equal("Insufficient cluster capacity", StrategySelector.SelectDeploymentStrategy(Change(95, true), Cluster(5)).Reason);
    }

    [Test("refuses a risky change on a cluster that allows no canary traffic but still rolls out a safe one")]
    public static void CanaryDisabled()
    {
        Assert.Equal(new DeploymentStrategyDecision(false, "NONE", "Canary traffic is not allowed on this cluster"), StrategySelector.SelectDeploymentStrategy(Change(90), Cluster(60, 0)));
        Assert.Equal("ROLLING", StrategySelector.SelectDeploymentStrategy(Change(10), Cluster(60, 0)).Strategy);
    }
}
