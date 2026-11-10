public record Task(string Id, string[] Dependencies, string Command);

public record PolicyRule(string Id, string Field, string Operator, object Value, string Message);

public record OidcClaims(string Iss, string Aud, string Sub, long Exp);

public record OidcPolicy(string ExpectedIssuer, string ExpectedAudience, string[] AllowedSubjects);

public record OidcInput(OidcClaims Claims, OidcPolicy Policy);

public record ArtifactInput(string Digest, string BuilderId, string[] SubjectDigests, string[] TrustedBuilders);

public record HistoryEntry(string ArtifactDigest, string Env, string Status);

public record PromotionInput(string TargetEnv, string ServiceName, string[] Environments, HistoryEntry[] History);

public record ReleaseRequest(Task[] Tasks, Dictionary<string, object> Facts, PolicyRule[] Rules, OidcInput Oidc, ArtifactInput Artifact, PromotionInput Promotion);

public record ManifestPatch(string Path, string Content);

public record ReleaseReport(string Outcome, string Stage, string[] PassedStages, string[] Reasons, string[][] Batches, ManifestPatch? Patch);

public static class ReleaseBlocks
{
    public static string[][] ResolveBuildOrder(Task[] tasks)
    {
        var ids = tasks.Select(task => task.Id).ToHashSet();
        foreach (var task in tasks)
        {
            foreach (var dependency in task.Dependencies)
            {
                if (!ids.Contains(dependency))
                {
                    throw new InvalidOperationException($"Missing dependency: {dependency}");
                }
            }
        }
        var remaining = tasks.ToList();
        var done = new HashSet<string>();
        var batches = new List<string[]>();
        while (remaining.Count > 0)
        {
            var batch = remaining.Where(task => task.Dependencies.All(done.Contains)).Select(task => task.Id).ToArray();
            if (batch.Length == 0)
            {
                throw new InvalidOperationException("Cyclic dependency detected");
            }
            batches.Add(batch);
            done.UnionWith(batch);
            remaining = remaining.Where(task => !done.Contains(task.Id)).ToList();
        }
        return batches.ToArray();
    }

    public static string[] FailedRules(PolicyRule[] rules, Dictionary<string, object> facts)
    {
        bool Holds(PolicyRule rule)
        {
            if (!facts.TryGetValue(rule.Field, out var fact))
            {
                return false;
            }
            return rule.Operator switch
            {
                "gte" => Convert.ToDouble(fact) >= Convert.ToDouble(rule.Value),
                "lte" => Convert.ToDouble(fact) <= Convert.ToDouble(rule.Value),
                _ => Convert.ToString(fact) == Convert.ToString(rule.Value),
            };
        }
        return rules.Where(rule => !Holds(rule)).Select(rule => rule.Message).ToArray();
    }

    public static string? CheckIdentity(OidcInput input, long now)
    {
        if (input.Claims.Iss != input.Policy.ExpectedIssuer)
        {
            throw new InvalidOperationException("Invalid OIDC issuer");
        }
        if (input.Claims.Aud != input.Policy.ExpectedAudience)
        {
            throw new InvalidOperationException("Invalid OIDC audience");
        }
        if (input.Claims.Exp <= now)
        {
            throw new InvalidOperationException("OIDC token expired");
        }
        return input.Policy.AllowedSubjects.Contains(input.Claims.Sub) ? null : "Subject not allowed by OIDC policy";
    }

    public static string? CheckProvenance(ArtifactInput artifact)
    {
        if (!artifact.SubjectDigests.Any(subject => string.Equals(subject, artifact.Digest, StringComparison.OrdinalIgnoreCase)))
        {
            return "Artifact digest not found in provenance";
        }
        return artifact.TrustedBuilders.Contains(artifact.BuilderId) ? null : "Builder is not trusted";
    }

    public static (string? Reason, ManifestPatch? Patch) PlanPromotion(ArtifactInput artifact, PromotionInput promotion)
    {
        var position = Array.IndexOf(promotion.Environments, promotion.TargetEnv);
        if (position < 0)
        {
            return ("Unknown target environment", null);
        }
        var digest = artifact.Digest.ToLowerInvariant();
        if (position > 0)
        {
            var previous = promotion.Environments[position - 1];
            var verified = promotion.History.Any(entry => entry.Env == previous && entry.Status == "VERIFIED" && entry.ArtifactDigest.ToLowerInvariant() == digest);
            if (!verified)
            {
                return ($"Verification missing in {previous}", null);
            }
        }
        var content = string.Join("\n", ["images:", $"  - name: {promotion.ServiceName}", $"    digest: {digest}", ""]);
        return (null, new ManifestPatch($"overlays/{promotion.TargetEnv}/kustomization.yaml", content));
    }
}

public static class ReleaseRunner
{
    public static ReleaseReport RunRelease(ReleaseRequest request, long now)
    {
        // TODO: run the five stages in the order build, gate, identity, provenance, promotion and stop at the first one that fails.
        // TODO: build resolves the task batches; gate collects the failed rules; identity checks the token; provenance checks the artifact; promotion plans the patch.
        // TODO: a stage that throws InvalidOperationException is a failed stage whose reason is the error message.
        return new ReleaseReport("REJECTED", "build", [], ["Not implemented"], [], null);
    }
}
