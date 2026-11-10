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
  // TODO: Manage lifecycle of ephemeral environments
  return { success: false, reason: "Not implemented", environment: null };
}
