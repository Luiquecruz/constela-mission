using Dojo;

public static class PromotionRulesTests
{
    private const string Digest = "sha256:b5bb9d8014a0f9b1d61e21e796d78dccdf1352f23cd32812f4850b878ae4944c";
    private const string Other = "sha256:7d865e959b2466918c9863afca942d0fb89d7c9ac0c99bafc3749504ded97730";

    private static PromotionRequest Request(string targetEnv, string digest = Digest) => new(digest, targetEnv, "ci-bot");

    private static DeploymentHistoryEntry Entry(string env, string status, string digest = Digest) => new(digest, env, status);

    private static void AssertDecision(bool allowed, string reason, PromotionDecision actual)
    {
        Assert.Equal(allowed, actual.Allowed);
        Assert.Equal(reason, actual.Reason);
    }

    [Test("approves a first deployment to staging")]
    public static void ApprovesStaging()
    {
        AssertDecision(true, "Promotion to staging approved", PromotionValidator.ValidateEnvironmentPromotion(Request("staging"), []));
    }

    [Test("blocks a staging promotion of an artifact that failed there before")]
    public static void BlocksFailedStaging()
    {
        AssertDecision(false, "Artifact failed prior staging deployment", PromotionValidator.ValidateEnvironmentPromotion(Request("staging"), [Entry("staging", "FAILED")]));
    }

    [Test("approves production after a verified staging deployment of the same artifact")]
    public static void ApprovesProduction()
    {
        AssertDecision(true, "Promotion to production approved", PromotionValidator.ValidateEnvironmentPromotion(Request("production"), [Entry("staging", "VERIFIED")]));
    }

    // beginner mistake: accepting a verified staging deployment of a different artifact as proof for this one
    [Test("does not accept another artifact, a failed run or another environment as proof for production")]
    public static void RequiresSameArtifact()
    {
        const string reason = "Promotion to production requires verified staging deployment";
        AssertDecision(false, reason, PromotionValidator.ValidateEnvironmentPromotion(Request("production"), [Entry("staging", "VERIFIED", Other)]));
        AssertDecision(false, reason, PromotionValidator.ValidateEnvironmentPromotion(Request("production"), [Entry("staging", "FAILED")]));
        AssertDecision(false, reason, PromotionValidator.ValidateEnvironmentPromotion(Request("production"), [Entry("development", "VERIFIED")]));
        AssertDecision(false, reason, PromotionValidator.ValidateEnvironmentPromotion(Request("production"), []));
    }

    [Test("rejects a target environment that is not part of the pipeline")]
    public static void RejectsUnknownEnvironment()
    {
        AssertDecision(false, "Unknown target environment", PromotionValidator.ValidateEnvironmentPromotion(Request("qa"), []));
    }

    [Test("rejects a malformed artifact digest before reading the history")]
    public static void RejectsMalformedDigest()
    {
        var latest = Assert.Throws<ArgumentException>(() => PromotionValidator.ValidateEnvironmentPromotion(Request("staging", "latest"), []));
        Assert.Contains("Invalid artifact digest format", latest.Message);
        var shortDigest = Assert.Throws<ArgumentException>(() => PromotionValidator.ValidateEnvironmentPromotion(Request("production", "sha256:abc"), [Entry("staging", "VERIFIED")]));
        Assert.Contains("Invalid artifact digest format", shortDigest.Message);
    }
}
