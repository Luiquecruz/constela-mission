public record CanaryMetrics(long TotalRequests, long ErrorRequests, double LatencyP99Ms);

public record CanaryLimits(double MaxErrorRatePercent, double MaxLatencyP99Ms, long MinRequests);

public record CanaryDecision(string Action, int NextWeight, string Reason, double ErrorRatePercent);

public static class CanaryRouter
{
    public static CanaryDecision DecideCanaryStep(int[] steps, int currentWeight, CanaryMetrics metrics, CanaryLimits limits)
    {
        // TODO: compute the error rate in percent, rounded to two decimals (zero when there were no requests).
        // TODO: hold when there is too little traffic, roll back to weight 0 on too many errors or too much latency.
        // TODO: otherwise advance to the first step above the current weight, or promote to 100 when there is none.
        return new CanaryDecision("HOLD", currentWeight, "Not enough traffic to decide", 0);
    }
}
