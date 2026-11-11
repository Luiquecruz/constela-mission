public record CanaryMetrics(long TotalRequests, long ErrorRequests, double LatencyP99Ms);

public record CanaryLimits(double MaxErrorRatePercent, double MaxLatencyP99Ms, long MinRequests);

public record CanaryDecision(string Action, int NextWeight, string Reason, double ErrorRatePercent);

public static class CanaryRouter
{
    public static CanaryDecision DecideCanaryStep(int[] steps, int currentWeight, CanaryMetrics metrics, CanaryLimits limits)
    {
        var errorRate = metrics.TotalRequests == 0 ? 0 : (metrics.ErrorRequests * 20000 + metrics.TotalRequests) / (2 * metrics.TotalRequests) / 100.0;

        if (metrics.TotalRequests < limits.MinRequests)
        {
            return new CanaryDecision("HOLD", currentWeight, "Not enough traffic to decide", errorRate);
        }
        if (metrics.ErrorRequests * 100m > (decimal)limits.MaxErrorRatePercent * metrics.TotalRequests)
        {
            return new CanaryDecision("ROLLBACK", 0, "Error rate exceeds limit", errorRate);
        }
        if (metrics.LatencyP99Ms > limits.MaxLatencyP99Ms)
        {
            return new CanaryDecision("ROLLBACK", 0, "Latency exceeds limit", errorRate);
        }

        var upcoming = steps.Where(step => step > currentWeight).ToArray();
        if (upcoming.Length == 0)
        {
            return new CanaryDecision("PROMOTE", 100, "Canary healthy at the final step", errorRate);
        }
        return new CanaryDecision("ADVANCE", upcoming[0], "Canary healthy, advancing", errorRate);
    }
}
