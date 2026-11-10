public record DeploymentRecord(string Id, long Timestamp, string Status, double LeadTimeMinutes);

public record IncidentRecord(string Id, string DeploymentId, long CreatedTimestamp, long? ResolvedTimestamp);

public record DoraMetrics(double DeploymentFrequencyPerDay, double ChangeFailureRatePercent, double MeanLeadTimeMinutes, double MeanTimeToRestoreMinutes);

public record ErrorBudget(double AllowedFailures, double RemainingFailures, bool ReleasesAllowed);

public static class DoraCalculator
{
    public static DoraMetrics CalculateDoraMetrics(DeploymentRecord[] deployments, IncidentRecord[] incidents, double windowDays)
    {
        // TODO: throw ArgumentException when the window is not positive; return zeros when there are no deployments.
        // TODO: compute deployments per day, the failure rate, the mean lead time and the mean time to restore, rounded to two decimals.
        // TODO: only incidents that were resolved count towards the time to restore.
        return new DoraMetrics(0, 0, 0, 0);
    }

    public static string ClassifyPerformance(DoraMetrics metrics)
    {
        // TODO: return the highest tier whose four limits all hold (see the challenge text).
        return "LOW";
    }

    public static ErrorBudget CalculateErrorBudget(double sloPercent, long totalRequests, long failedRequests)
    {
        // TODO: the budget is the failures the objective allows; releases are allowed while some budget remains.
        return new ErrorBudget(0, 0, false);
    }
}
