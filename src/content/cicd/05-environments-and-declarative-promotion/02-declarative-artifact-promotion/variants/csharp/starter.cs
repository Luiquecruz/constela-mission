using System;

public record PromotionRequest(string ArtifactDigest, string TargetEnv, string PromotedBy);

public record DeploymentHistoryEntry(string ArtifactDigest, string Env, string Status);

public record PromotionDecision(bool Allowed, string Reason);

public static class PromotionValidator
{
    public static PromotionDecision ValidateEnvironmentPromotion(
        PromotionRequest request,
        DeploymentHistoryEntry[] history
    )
    {
        // TODO: Validate sequential environment artifact promotion requests
        return new PromotionDecision(false, "Not implemented");
    }
}
