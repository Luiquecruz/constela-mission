export interface EphemeralAction {
  type: "PROVISION" | "TEARDOWN";
  prId: string;
  now: number;
}

export interface EphemeralEnvironment {
  prId: string;
  name: string;
  createdAt: number;
  status: "ACTIVE" | "TERMINATED";
}

export interface EphemeralManagementResult {
  success: boolean;
  reason: string;
  environment: EphemeralEnvironment | null;
}

export function manageEphemeralEnvironment(
  action: EphemeralAction,
  activeEnvironments: EphemeralEnvironment[],
  maxActivePool: number
): EphemeralManagementResult {
  const activeList = activeEnvironments.filter((e) => e.status === "ACTIVE");

  if (action.type === "PROVISION") {
    if (activeList.length >= maxActivePool) {
      return {
        success: false,
        reason: "Active ephemeral environment pool limit reached",
        environment: null,
      };
    }

    const existing = activeList.find((e) => e.prId === action.prId);
    if (existing) {
      return {
        success: false,
        reason: "Environment already provisioned for this PR",
        environment: null,
      };
    }

    const newEnv: EphemeralEnvironment = {
      prId: action.prId,
      name: `preview-pr-${action.prId}`,
      createdAt: action.now,
      status: "ACTIVE",
    };

    return {
      success: true,
      reason: "Environment provisioned successfully",
      environment: newEnv,
    };
  }

  if (action.type === "TEARDOWN") {
    const existing = activeList.find((e) => e.prId === action.prId);
    if (!existing) {
      return {
        success: false,
        reason: "Environment not found for teardown",
        environment: null,
      };
    }

    return {
      success: true,
      reason: "Environment torn down successfully",
      environment: {
        ...existing,
        status: "TERMINATED",
      },
    };
  }

  return {
    success: false,
    reason: "Unknown action type",
    environment: null,
  };
}
