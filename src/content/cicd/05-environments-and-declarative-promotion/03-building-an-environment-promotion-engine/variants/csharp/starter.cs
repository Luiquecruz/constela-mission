using System.Text.RegularExpressions;

public record PromotionRequest(string ArtifactDigest, string TargetEnv, string ServiceName);

public record GateResult(string Status);

public record DeploymentHistoryEntry(string ArtifactDigest, string Env, string Status);

public record ManifestPatch(string Path, string Content);

public record PromotionPlan(bool Success, string Reason, ManifestPatch? Patch);

public static class PromotionPlanner
{
    public static PromotionPlan PlanPromotion(PromotionRequest request, GateResult gate, DeploymentHistoryEntry[] history, string[] environments)
    {
        // TODO: throw ArgumentException for a malformed digest, then refuse a gate that did not pass, then a target outside the environment order.
        // TODO: every environment after the first needs a verified run of this digest in the environment before it.
        // TODO: build the Kustomize patch for overlays/<environment>/kustomization.yaml that pins the image to the digest.
        return new PromotionPlan(false, "Not implemented", null);
    }
}
