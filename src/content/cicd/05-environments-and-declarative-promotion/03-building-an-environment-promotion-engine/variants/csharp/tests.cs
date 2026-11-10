using Dojo;

public static class PromotionPlannerTests
{
    private const string Digest = "sha256:b5bb9d8014a0f9b1d61e21e796d78dccdf1352f23cd32812f4850b878ae4944c";
    private const string Other = "sha256:7d865e959b2466918c9863afca942d0fb89d7c9ac0c99bafc3749504ded97730";
    private static readonly string[] Order = ["development", "staging", "production"];
    private static readonly GateResult Passed = new("PASSED");

    private static PromotionRequest Request(string targetEnv, string digest = Digest) => new(digest, targetEnv, "api-service");

    private static DeploymentHistoryEntry Entry(string env, string status = "VERIFIED", string digest = Digest) => new(digest, env, status);

    private static ManifestPatch PatchFor(string env) => new($"overlays/{env}/kustomization.yaml", $"images:\n  - name: api-service\n    digest: {Digest}\n");

    [Test("promotes into the first environment and pins the image to the digest in its overlay")]
    public static void PromotesFirst()
    {
        var plan = PromotionPlanner.PlanPromotion(Request("development"), Passed, [], Order);
        Assert.True(plan.Success);
        Assert.Equal("Artifact promoted successfully", plan.Reason);
        Assert.Equal(PatchFor("development"), plan.Patch);
    }

    [Test("promotes to the next environment once the previous one verified this digest")]
    public static void PromotesNext()
    {
        var plan = PromotionPlanner.PlanPromotion(Request("staging"), Passed, [Entry("development")], Order);
        Assert.True(plan.Success);
        Assert.Equal(PatchFor("staging"), plan.Patch);
    }

    // beginner mistake: accepting a verified run of another artifact as proof for this one
    [Test("requires the previous environment to have verified this exact digest")]
    public static void RequiresSameDigest()
    {
        var plan = PromotionPlanner.PlanPromotion(Request("production"), Passed, [Entry("staging", "VERIFIED", Other), Entry("development")], Order);
        Assert.False(plan.Success);
        Assert.Equal("Verification missing in staging", plan.Reason);
        Assert.Null(plan.Patch);
    }

    [Test("does not accept a failed run or a run two environments back as verification")]
    public static void RejectsWeakProof()
    {
        Assert.Equal("Verification missing in staging", PromotionPlanner.PlanPromotion(Request("production"), Passed, [Entry("staging", "FAILED")], Order).Reason);
        Assert.Equal("Verification missing in staging", PromotionPlanner.PlanPromotion(Request("production"), Passed, [Entry("development")], Order).Reason);
    }

    [Test("reports a blocked gate before the environment checks and an unknown environment after it")]
    public static void OrdersChecks()
    {
        var blocked = PromotionPlanner.PlanPromotion(Request("qa"), new GateResult("BLOCKED"), [], Order);
        Assert.False(blocked.Success);
        Assert.Equal("Quality gate check failed", blocked.Reason);
        Assert.Equal("Unknown target environment", PromotionPlanner.PlanPromotion(Request("qa"), Passed, [], Order).Reason);
    }

    [Test("rejects a malformed digest and writes the digest in lower case")]
    public static void ValidatesDigest()
    {
        var error = Assert.Throws<ArgumentException>(() => PromotionPlanner.PlanPromotion(Request("development", "latest"), Passed, [], Order));
        Assert.Contains("Invalid artifact digest format", error.Message);
        var upper = "sha256:" + "b5bb9d8014a0f9b1d61e21e796d78dccdf1352f23cd32812f4850b878ae4944c".ToUpperInvariant();
        Assert.Equal(PatchFor("development"), PromotionPlanner.PlanPromotion(Request("development", upper), Passed, [], Order).Patch);
    }
}
