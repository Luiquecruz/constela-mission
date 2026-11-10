using System;
using System.Linq;
using System.Text.RegularExpressions;

public record PromotionRequest(string ArtifactDigest, string TargetEnv, string PromotedBy);

public record DeploymentHistoryEntry(string ArtifactDigest, string Env, string Status);

public record PromotionDecision(bool Allowed, string Reason);

public static class PromotionValidator
{
    private static readonly Regex DigestRegex = new(@"^sha256:[a-f0-9]{64}$", RegexOptions.IgnoreCase);

    public static PromotionDecision ValidateEnvironmentPromotion(
        PromotionRequest request,
        DeploymentHistoryEntry[] history
    )
    {
        if (string.IsNullOrEmpty(request.ArtifactDigest) || !DigestRegex.IsMatch(request.ArtifactDigest))
        {
            throw new ArgumentException("Invalid artifact digest format");
        }

        var entries = history ?? Array.Empty<DeploymentHistoryEntry>();

        if (string.Equals(request.TargetEnv, "staging", StringComparison.OrdinalIgnoreCase))
        {
            bool failedStaging = entries.Any(h =>
                h.ArtifactDigest == request.ArtifactDigest &&
                string.Equals(h.Env, "staging", StringComparison.OrdinalIgnoreCase) &&
                string.Equals(h.Status, "FAILED", StringComparison.OrdinalIgnoreCase)
            );

            if (failedStaging)
            {
                return new PromotionDecision(false, "Artifact failed prior staging deployment");
            }

            return new PromotionDecision(true, "Promotion to staging approved");
        }

        if (string.Equals(request.TargetEnv, "production", StringComparison.OrdinalIgnoreCase))
        {
            bool verifiedStaging = entries.Any(h =>
                h.ArtifactDigest == request.ArtifactDigest &&
                string.Equals(h.Env, "staging", StringComparison.OrdinalIgnoreCase) &&
                string.Equals(h.Status, "VERIFIED", StringComparison.OrdinalIgnoreCase)
            );

            if (!verifiedStaging)
            {
                return new PromotionDecision(false, "Promotion to production requires verified staging deployment");
            }

            return new PromotionDecision(true, "Promotion to production approved");
        }

        return new PromotionDecision(false, "Unknown target environment");
    }
}
