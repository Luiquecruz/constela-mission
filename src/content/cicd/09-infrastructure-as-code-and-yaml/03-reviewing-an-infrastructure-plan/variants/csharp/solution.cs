public record ChangeBody(string[] Actions, Dictionary<string, object?>? After);

public record PlanChange(string Address, string Type, ChangeBody Change);

public record ReviewPolicy(string[] ProtectedTypes, string[] RequiredTags);

public record Finding(string Address, string Rule, string Message);

public record PlanSummary(int Create, int Update, int Replace, int Delete);

public record PlanReview(string Decision, PlanSummary Summary, Finding[] Findings);

public static class PlanReviewer
{
    private static string Classify(string[] actions)
    {
        var key = string.Join(",", actions);
        return key switch
        {
            "no-op" or "read" => "none",
            "create" or "update" or "delete" => key,
            "delete,create" or "create,delete" => "replace",
            _ => throw new ArgumentException($"Unsupported actions: {key}"),
        };
    }

    public static PlanReview ReviewPlan(PlanChange[] resourceChanges, ReviewPolicy policy)
    {
        int create = 0, update = 0, replace = 0, delete = 0;
        var findings = new List<Finding>();

        foreach (var resource in resourceChanges)
        {
            var kind = Classify(resource.Change.Actions);
            if (kind == "none")
            {
                continue;
            }
            switch (kind)
            {
                case "create": create++; break;
                case "update": update++; break;
                case "replace": replace++; break;
                default: delete++; break;
            }

            if ((kind == "delete" || kind == "replace") && policy.ProtectedTypes.Contains(resource.Type))
            {
                findings.Add(new Finding(resource.Address, "protected-destroy", $"Destroying {resource.Address} needs approval"));
            }

            var after = resource.Change.After;
            if (kind != "delete" && after is not null)
            {
                if (after.TryGetValue("tags", out var rawTags))
                {
                    var tags = rawTags as Dictionary<string, string> ?? new Dictionary<string, string>();
                    foreach (var tag in policy.RequiredTags)
                    {
                        if (!tags.ContainsKey(tag))
                        {
                            findings.Add(new Finding(resource.Address, "missing-tag", $"{resource.Address} is missing tag '{tag}'"));
                        }
                    }
                }
                if (after.TryGetValue("publicly_accessible", out var open) && open is true)
                {
                    findings.Add(new Finding(resource.Address, "public-access", $"{resource.Address} is publicly accessible"));
                }
            }
        }

        var blocking = findings.Any(finding => finding.Rule is "missing-tag" or "public-access");
        var decision = blocking ? "REJECT" : findings.Count > 0 ? "REQUIRES_APPROVAL" : "APPROVE";
        return new PlanReview(decision, new PlanSummary(create, update, replace, delete), findings.ToArray());
    }
}
