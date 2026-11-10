using System;
using System.Collections.Generic;

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
        // TODO: Manage lifecycle of ephemeral environments
        return new EphemeralManagementResult(false, "Not implemented", null);
    }
}
