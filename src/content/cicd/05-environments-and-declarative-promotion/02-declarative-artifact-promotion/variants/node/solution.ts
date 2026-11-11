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

const DIGEST_REGEX = /^sha256:[a-f0-9]{64}$/i;

export function validateEnvironmentPromotion(
  request: PromotionRequest,
  history: DeploymentHistoryEntry[]
): PromotionDecision {
  if (!DIGEST_REGEX.test(request.artifactDigest)) {
    throw new Error("Invalid artifact digest format");
  }

  if (request.targetEnv === "staging") {
    const failedStaging = history.some(
      (h) => h.artifactDigest.toLowerCase() === request.artifactDigest.toLowerCase() && h.env === "staging" && h.status === "FAILED"
    );
    if (failedStaging) {
      return {
        allowed: false,
        reason: "Artifact failed prior staging deployment",
      };
    }

    return {
      allowed: true,
      reason: "Promotion to staging approved",
    };
  }

  if (request.targetEnv === "production") {
    const verifiedStaging = history.some(
      (h) => h.artifactDigest.toLowerCase() === request.artifactDigest.toLowerCase() && h.env === "staging" && h.status === "VERIFIED"
    );

    if (!verifiedStaging) {
      return {
        allowed: false,
        reason: "Promotion to production requires verified staging deployment",
      };
    }

    return {
      allowed: true,
      reason: "Promotion to production approved",
    };
  }

  return {
    allowed: false,
    reason: "Unknown target environment",
  };
}
