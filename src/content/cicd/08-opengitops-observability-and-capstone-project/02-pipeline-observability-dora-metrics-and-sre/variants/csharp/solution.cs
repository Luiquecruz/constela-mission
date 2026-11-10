public record DeploymentRecord(string Id, long Timestamp, string Status, double LeadTimeMinutes);

public record IncidentRecord(string Id, string DeploymentId, long CreatedTimestamp, long? ResolvedTimestamp);

public record DoraMetrics(double DeploymentFrequencyPerDay, double ChangeFailureRatePercent, double MeanLeadTimeMinutes, double MeanTimeToRestoreMinutes);

public record ErrorBudget(double AllowedFailures, double RemainingFailures, bool ReleasesAllowed);

public static class DoraCalculator
{
    private static double Round2(double value) => Math.Round(value, 2, MidpointRounding.AwayFromZero);

    public static DoraMetrics CalculateDoraMetrics(DeploymentRecord[] deployments, IncidentRecord[] incidents, double windowDays)
    {
        if (windowDays <= 0)
        {
            throw new ArgumentException("Window must be positive");
        }
        if (deployments.Length == 0)
        {
            return new DoraMetrics(0, 0, 0, 0);
        }

        var failed = deployments.Count(deployment => deployment.Status == "FAILURE");
        var leadTotal = deployments.Sum(deployment => deployment.LeadTimeMinutes);
        var resolved = incidents.Where(incident => incident.ResolvedTimestamp.HasValue).ToArray();
        var restoreTotal = resolved.Sum(incident => (double)(incident.ResolvedTimestamp!.Value - incident.CreatedTimestamp));

        return new DoraMetrics(
            Round2(deployments.Length / windowDays),
            Round2((double)failed / deployments.Length * 100),
            Round2(leadTotal / deployments.Length),
            resolved.Length == 0 ? 0 : Round2(restoreTotal / resolved.Length / 60000));
    }

    public static string ClassifyPerformance(DoraMetrics metrics)
    {
        (string Tier, double Frequency, double FailureRate, double LeadTime, double RestoreTime)[] tiers =
        [
            ("ELITE", 1, 5, 60, 60),
            ("HIGH", 0.14, 15, 1440, 1440),
            ("MEDIUM", 0.03, 30, 10080, 10080),
        ];
        foreach (var tier in tiers)
        {
            if (metrics.DeploymentFrequencyPerDay >= tier.Frequency
                && metrics.ChangeFailureRatePercent <= tier.FailureRate
                && metrics.MeanLeadTimeMinutes <= tier.LeadTime
                && metrics.MeanTimeToRestoreMinutes <= tier.RestoreTime)
            {
                return tier.Tier;
            }
        }
        return "LOW";
    }

    public static ErrorBudget CalculateErrorBudget(double sloPercent, long totalRequests, long failedRequests)
    {
        var allowed = Round2(totalRequests * (100 - sloPercent) / 100);
        var remaining = Round2(allowed - failedRequests);
        return new ErrorBudget(allowed, remaining, remaining > 0);
    }
}
