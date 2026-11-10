using System.Text.RegularExpressions;

public record PromotionRequest(string ArtifactDigest, string TargetEnv, string ServiceName);

public record GateResult(string Status);

public record DeploymentHistoryEntry(string ArtifactDigest, string Env, string Status);

public record ManifestPatch(string Path, string Content);

public record PromotionPlan(bool Success, string Reason, ManifestPatch? Patch);

public static class PromotionPlanner
{
    private static readonly Regex DigestPattern = new("^sha256:[a-f0-9]{64}$", RegexOptions.IgnoreCase);

    public static PromotionPlan PlanPromotion(PromotionRequest request, GateResult gate, DeploymentHistoryEntry[] history, string[] environments)
    {
        if (!DigestPattern.IsMatch(request.ArtifactDigest))
        {
            throw new ArgumentException("Invalid artifact digest format");
        }
        var digest = request.ArtifactDigest.ToLowerInvariant();

        if (gate.Status != "PASSED")
        {
            return new PromotionPlan(false, "Quality gate check failed", null);
        }

        var position = Array.IndexOf(environments, request.TargetEnv);
        if (position < 0)
        {
            return new PromotionPlan(false, "Unknown target environment", null);
        }

        if (position > 0)
        {
            var previous = environments[position - 1];
            var verified = history.Any(entry => entry.Env == previous && entry.Status == "VERIFIED" && entry.ArtifactDigest.ToLowerInvariant() == digest);
            if (!verified)
            {
                return new PromotionPlan(false, $"Verification missing in {previous}", null);
            }
        }

        var content = string.Join("\n", ["images:", $"  - name: {request.ServiceName}", $"    digest: {digest}", ""]);
        return new PromotionPlan(true, "Artifact promoted successfully", new ManifestPatch($"overlays/{request.TargetEnv}/kustomization.yaml", content));
    }
}
