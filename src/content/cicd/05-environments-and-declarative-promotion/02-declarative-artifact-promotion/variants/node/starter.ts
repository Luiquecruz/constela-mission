export interface PromotionRequest {
  artifactDigest: string;
  targetEnv: string;
  promotedBy: string;
}

export interface DeploymentHistoryEntry {
  artifactDigest: string;
  env: string;
  status: "VERIFIED" | "FAILED";
}

export interface PromotionDecision {
  allowed: boolean;
  reason: string;
}

export function validateEnvironmentPromotion(
  request: PromotionRequest,
  history: DeploymentHistoryEntry[]
): PromotionDecision {
  // TODO: Validate sequential environment artifact promotion requests
  return { allowed: false, reason: "Not implemented" };
}
