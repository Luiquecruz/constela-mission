public record PolicyRule(string Id, string Field, string Operator, object Value, string Message);

public record PolicyFailure(string RuleId, string Message);

public record PolicyOutcome(bool Allowed, PolicyFailure[] Failures);

public static class PolicyEngine
{
    private static readonly string[] Operators = ["gte", "lte", "eq", "in"];

    private static bool Holds(string op, object fact, object value) => op switch
    {
        "gte" => Convert.ToDouble(fact) >= Convert.ToDouble(value),
        "lte" => Convert.ToDouble(fact) <= Convert.ToDouble(value),
        "eq" => fact is string || value is string
            ? Convert.ToString(fact) == Convert.ToString(value)
            : Convert.ToDouble(fact) == Convert.ToDouble(value),
        "in" => value is string[] options && options.Contains(Convert.ToString(fact)),
        _ => false,
    };

    public static PolicyOutcome EvaluatePolicy(PolicyRule[] rules, Dictionary<string, object> facts)
    {
        foreach (var rule in rules)
        {
            if (!Operators.Contains(rule.Operator))
            {
                throw new ArgumentException($"Unsupported operator: {rule.Operator}");
            }
        }

        var failures = new List<PolicyFailure>();
        foreach (var rule in rules)
        {
            if (!facts.TryGetValue(rule.Field, out var fact) || !Holds(rule.Operator, fact, rule.Value))
            {
                failures.Add(new PolicyFailure(rule.Id, rule.Message));
            }
        }
        return new PolicyOutcome(failures.Count == 0, failures.ToArray());
    }
}
