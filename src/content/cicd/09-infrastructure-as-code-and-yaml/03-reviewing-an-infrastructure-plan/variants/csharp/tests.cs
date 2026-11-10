using Dojo;

public static class PlanReviewerTests
{
    private static readonly ReviewPolicy Policy = new(["aws_db_instance", "aws_s3_bucket"], ["Owner"]);

    private static Dictionary<string, object?> Tagged(params (string Key, string Value)[] tags) =>
        new() { ["tags"] = tags.ToDictionary(pair => pair.Key, pair => pair.Value) };

    private static PlanChange Change(string address, string type, string[] actions, Dictionary<string, object?>? after = null, bool noAfter = false) =>
        new(address, type, new ChangeBody(actions, noAfter ? null : after ?? Tagged(("Owner", "platform"))));

    private static string Rules(PlanReview review) => string.Join(",", review.Findings.Select(finding => finding.Rule));

    [Test("approves a plan of tagged changes and ignores no-op and read entries in the summary")]
    public static void ApprovesTaggedPlan()
    {
        var review = PlanReviewer.ReviewPlan(
            [Change("aws_instance.web", "aws_instance", ["create"]), Change("aws_instance.api", "aws_instance", ["update"]), Change("aws_vpc.main", "aws_vpc", ["no-op"]), Change("data.aws_ami.base", "aws_ami", ["read"])],
            Policy);
        Assert.Equal("APPROVE", review.Decision);
        Assert.Equal(new PlanSummary(1, 1, 0, 0), review.Summary);
        Assert.Equal(0, review.Findings.Length);
    }

    [Test("counts a delete and a create in either order as one replacement")]
    public static void CountsReplacements()
    {
        var review = PlanReviewer.ReviewPlan([Change("aws_instance.a", "aws_instance", ["delete", "create"]), Change("aws_instance.b", "aws_instance", ["create", "delete"])], Policy);
        Assert.Equal(new PlanSummary(0, 0, 2, 0), review.Summary);
    }

    // beginner mistake: reading a replacement as a harmless update and missing that it destroys the old resource
    [Test("requires approval when a protected resource is replaced or deleted")]
    public static void RequiresApprovalForProtected()
    {
        var review = PlanReviewer.ReviewPlan([Change("aws_db_instance.main", "aws_db_instance", ["delete", "create"]), Change("aws_s3_bucket.logs", "aws_s3_bucket", ["delete"], noAfter: true)], Policy);
        Assert.Equal("REQUIRES_APPROVAL", review.Decision);
        Assert.Equal(new Finding("aws_db_instance.main", "protected-destroy", "Destroying aws_db_instance.main needs approval"), review.Findings[0]);
        Assert.Equal(new Finding("aws_s3_bucket.logs", "protected-destroy", "Destroying aws_s3_bucket.logs needs approval"), review.Findings[1]);
    }

    [Test("lets an unprotected resource be deleted without approval")]
    public static void UnprotectedDelete()
    {
        var review = PlanReviewer.ReviewPlan([Change("aws_instance.old", "aws_instance", ["delete"], noAfter: true)], Policy);
        Assert.Equal("APPROVE", review.Decision);
        Assert.Equal(new PlanSummary(0, 0, 0, 1), review.Summary);
        Assert.Equal(0, review.Findings.Length);
    }

    [Test("rejects resources that lack a required tag, including null tags, and skips resources without a tags attribute")]
    public static void RejectsMissingTags()
    {
        var review = PlanReviewer.ReviewPlan(
            [
                Change("aws_instance.a", "aws_instance", ["create"], Tagged(("Team", "x"))),
                Change("aws_instance.b", "aws_instance", ["create"], new Dictionary<string, object?> { ["tags"] = null }),
                Change("aws_iam_policy.c", "aws_iam_policy", ["create"], new Dictionary<string, object?> { ["name"] = "read" }),
            ],
            Policy);
        Assert.Equal("REJECT", review.Decision);
        Assert.Equal(2, review.Findings.Length);
        Assert.Equal(new Finding("aws_instance.a", "missing-tag", "aws_instance.a is missing tag 'Owner'"), review.Findings[0]);
        Assert.Equal(new Finding("aws_instance.b", "missing-tag", "aws_instance.b is missing tag 'Owner'"), review.Findings[1]);
    }

    [Test("rejects a publicly accessible resource and lets a rejection outweigh a required approval")]
    public static void RejectsPublicResources()
    {
        var after = Tagged(("Owner", "platform"));
        after["publicly_accessible"] = true;
        var review = PlanReviewer.ReviewPlan([Change("aws_db_instance.main", "aws_db_instance", ["delete", "create"], after)], Policy);
        Assert.Equal("REJECT", review.Decision);
        Assert.Equal("protected-destroy,public-access", Rules(review));
        var error = Assert.Throws<ArgumentException>(() => PlanReviewer.ReviewPlan([Change("x.y", "x", ["forget"])], Policy));
        Assert.Contains("Unsupported actions: forget", error.Message);
    }
}
