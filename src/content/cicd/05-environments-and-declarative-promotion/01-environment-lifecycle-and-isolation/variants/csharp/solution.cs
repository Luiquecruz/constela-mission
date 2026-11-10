using System;
using System.Collections.Generic;
using System.Linq;

public record EphemeralAction(string Type, string PrId, long Now);

public record EphemeralEnvironment(string PrId, string Name, long CreatedAt, string Status);

public record EphemeralManagementResult(bool Success, string Reason, EphemeralEnvironment Environment);

public static class EphemeralEnvironmentManager
{
    public static EphemeralManagementResult ManageEphemeralEnvironment(
        EphemeralAction action,
        EphemeralEnvironment[] activeEnvironments,
        int maxActivePool
    )
    {
        var activeList = (activeEnvironments ?? Array.Empty<EphemeralEnvironment>())
            .Where(e => string.Equals(e.Status, "ACTIVE", StringComparison.OrdinalIgnoreCase))
            .ToList();

        if (string.Equals(action.Type, "PROVISION", StringComparison.OrdinalIgnoreCase))
        {
            if (activeList.Count >= maxActivePool)
            {
                return new EphemeralManagementResult(false, "Active ephemeral environment pool limit reached", null);
            }

            var existing = activeList.FirstOrDefault(e => e.PrId == action.PrId);
            if (existing != null)
            {
                return new EphemeralManagementResult(false, "Environment already provisioned for this PR", null);
            }

            var newEnv = new EphemeralEnvironment(action.PrId, $"preview-pr-{action.PrId}", action.Now, "ACTIVE");
            return new EphemeralManagementResult(true, "Environment provisioned successfully", newEnv);
        }

        if (string.Equals(action.Type, "TEARDOWN", StringComparison.OrdinalIgnoreCase))
        {
            var existing = activeList.FirstOrDefault(e => e.PrId == action.PrId);
            if (existing == null)
            {
                return new EphemeralManagementResult(false, "Environment not found for teardown", null);
            }

            var termEnv = new EphemeralEnvironment(existing.PrId, existing.Name, existing.CreatedAt, "TERMINATED");
            return new EphemeralManagementResult(true, "Environment torn down successfully", termEnv);
        }

        return new EphemeralManagementResult(false, "Unknown action type", null);
    }
}
