public record ChangeBody(string[] Actions, Dictionary<string, object?>? After);

public record PlanChange(string Address, string Type, ChangeBody Change);

public record ReviewPolicy(string[] ProtectedTypes, string[] RequiredTags);

public record Finding(string Address, string Rule, string Message);

public record PlanSummary(int Create, int Update, int Replace, int Delete);

public record PlanReview(string Decision, PlanSummary Summary, Finding[] Findings);

public static class PlanReviewer
{
    public static PlanReview ReviewPlan(PlanChange[] resourceChanges, ReviewPolicy policy)
    {
        // TODO: classify each change from its actions: create, update, delete, a delete and a create in either order is a replace; no-op and read are ignored; anything else throws ArgumentException.
        // TODO: count the changes, then add the findings described in the challenge, in resource order.
        // TODO: reject on a missing tag or a public resource, require approval for a protected destroy, otherwise approve.
        return new PlanReview("APPROVE", new PlanSummary(0, 0, 0, 0), []);
    }
}
