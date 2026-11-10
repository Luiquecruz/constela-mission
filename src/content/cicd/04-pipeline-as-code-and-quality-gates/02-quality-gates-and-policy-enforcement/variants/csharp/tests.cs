using Dojo;

public static class PolicyEngineTests
{
    private static readonly PolicyRule[] Rules =
    [
        new("coverage", "coverage", "gte", 80, "Coverage below 80"),
        new("criticals", "criticalVulnerabilities", "lte", 0, "Critical vulnerabilities present"),
        new("branch", "branch", "in", new[] { "main", "release" }, "Deploys come from main or release"),
        new("environment", "environment", "eq", "production", "Wrong environment"),
    ];

    private static Dictionary<string, object> Facts(object? coverage = null, int criticals = 0, string branch = "main", string environment = "production")
    {
        var facts = new Dictionary<string, object> { ["criticalVulnerabilities"] = criticals, ["branch"] = branch, ["environment"] = environment };
        if (coverage is not null)
        {
            facts["coverage"] = coverage;
        }
        return facts;
    }

    private static string Ids(PolicyOutcome outcome) => string.Join(",", outcome.Failures.Select(failure => failure.RuleId));

    [Test("allows a deployment when every rule passes")]
    public static void AllowsWhenAllPass()
    {
        var outcome = PolicyEngine.EvaluatePolicy(Rules, Facts(85));
        Assert.True(outcome.Allowed);
        Assert.Equal(0, outcome.Failures.Length);
    }

    [Test("treats the numeric limits as inclusive and reports failures in rule order")]
    public static void InclusiveLimits()
    {
        Assert.True(PolicyEngine.EvaluatePolicy(Rules, Facts(80)).Allowed);
        var outcome = PolicyEngine.EvaluatePolicy(Rules, Facts(79, criticals: 1));
        Assert.False(outcome.Allowed);
        Assert.Equal("coverage,criticals", Ids(outcome));
        Assert.Equal("Coverage below 80", outcome.Failures[0].Message);
        Assert.Equal("Critical vulnerabilities present", outcome.Failures[1].Message);
    }

    [Test("checks membership and equality rules")]
    public static void MembershipAndEquality()
    {
        var outcome = PolicyEngine.EvaluatePolicy(Rules, Facts(85, branch: "feature/x", environment: "staging"));
        Assert.Equal("branch,environment", Ids(outcome));
        Assert.True(PolicyEngine.EvaluatePolicy(Rules, Facts(85, branch: "release")).Allowed);
    }

    // beginner mistake: letting a rule pass because its fact is missing instead of failing closed
    [Test("fails a rule whose fact is missing")]
    public static void MissingFactFails()
    {
        var outcome = PolicyEngine.EvaluatePolicy(Rules, Facts());
        Assert.False(outcome.Allowed);
        Assert.Equal("coverage", Ids(outcome));
    }

    [Test("rejects an unsupported operator before evaluating any rule")]
    public static void RejectsOperator()
    {
        var withUnknown = Rules.Append(new PolicyRule("name", "branch", "matches", "ma.*", "Name does not match")).ToArray();
        var error = Assert.Throws<ArgumentException>(() => PolicyEngine.EvaluatePolicy(withUnknown, Facts(10)));
        Assert.Equal("Unsupported operator: matches", error.Message);
    }

    [Test("evaluates every rule independently and allows an empty rule set")]
    public static void IndependentRules()
    {
        var everythingWrong = new Dictionary<string, object> { ["coverage"] = 1, ["criticalVulnerabilities"] = 9, ["branch"] = "x", ["environment"] = "y" };
        Assert.Equal("coverage,criticals,branch,environment", Ids(PolicyEngine.EvaluatePolicy(Rules, everythingWrong)));
        Assert.True(PolicyEngine.EvaluatePolicy([], new Dictionary<string, object>()).Allowed);
    }
}
