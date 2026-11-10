public record PolicyRule(string Id, string Field, string Operator, object Value, string Message);

public record PolicyFailure(string RuleId, string Message);

public record PolicyOutcome(bool Allowed, PolicyFailure[] Failures);

public static class PolicyEngine
{
    public static PolicyOutcome EvaluatePolicy(PolicyRule[] rules, Dictionary<string, object> facts)
    {
        // TODO: throw ArgumentException for any operator other than gte, lte, eq and in before evaluating anything.
        // TODO: a rule fails when its fact is missing or the comparison is false; collect the failures in rule order.
        return new PolicyOutcome(true, []);
    }
}
