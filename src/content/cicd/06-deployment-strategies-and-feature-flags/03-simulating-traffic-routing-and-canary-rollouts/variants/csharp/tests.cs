using Dojo;

public static class CanaryRouterTests
{
    private static readonly int[] Steps = [10, 25, 50];
    private static readonly CanaryLimits Limits = new(1, 500, 100);

    private static CanaryMetrics Metrics(long total, long errors, double latency = 200) => new(total, errors, latency);

    [Test("advances to the first step when the canary starts healthy")]
    public static void AdvancesFirst()
    {
        Assert.Equal(new CanaryDecision("ADVANCE", 10, "Canary healthy, advancing", 0.2), CanaryRouter.DecideCanaryStep(Steps, 0, Metrics(1000, 2), Limits));
    }

    [Test("moves to the first step above the current weight, even when the weight is between steps")]
    public static void FindsNextStep()
    {
        Assert.Equal(50, CanaryRouter.DecideCanaryStep(Steps, 25, Metrics(1000, 0), Limits).NextWeight);
        Assert.Equal(25, CanaryRouter.DecideCanaryStep(Steps, 15, Metrics(1000, 0), Limits).NextWeight);
    }

    // beginner mistake: acting on a handful of requests, where one error looks like a 100% failure
    [Test("holds the current weight until there is enough traffic to judge")]
    public static void HoldsOnLittleTraffic()
    {
        Assert.Equal(new CanaryDecision("HOLD", 10, "Not enough traffic to decide", 100), CanaryRouter.DecideCanaryStep(Steps, 10, Metrics(1, 1), Limits));
        Assert.Equal(new CanaryDecision("HOLD", 10, "Not enough traffic to decide", 0), CanaryRouter.DecideCanaryStep(Steps, 10, Metrics(0, 0), Limits));
    }

    [Test("rolls back to zero when the error rate is above the limit and tolerates exactly the limit")]
    public static void RollsBackOnErrors()
    {
        Assert.Equal(new CanaryDecision("ROLLBACK", 0, "Error rate exceeds limit", 1.1), CanaryRouter.DecideCanaryStep(Steps, 25, Metrics(1000, 11), Limits));
        Assert.Equal("ADVANCE", CanaryRouter.DecideCanaryStep(Steps, 25, Metrics(1000, 10), Limits).Action);
    }

    [Test("rolls back when the latency is above the limit and reports errors first when both fail")]
    public static void RollsBackOnLatency()
    {
        Assert.Equal(new CanaryDecision("ROLLBACK", 0, "Latency exceeds limit", 0), CanaryRouter.DecideCanaryStep(Steps, 25, Metrics(1000, 0, 501), Limits));
        Assert.Equal("Error rate exceeds limit", CanaryRouter.DecideCanaryStep(Steps, 25, Metrics(1000, 50, 900), Limits).Reason);
    }

    [Test("promotes to full traffic when a healthy canary is at the final step")]
    public static void PromotesAtFinalStep()
    {
        Assert.Equal(new CanaryDecision("PROMOTE", 100, "Canary healthy at the final step", 0.1), CanaryRouter.DecideCanaryStep(Steps, 50, Metrics(1000, 1), Limits));
    }
}
