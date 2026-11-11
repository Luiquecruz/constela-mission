public record PolicyRule(string Id, string Field, string Operator, object Value, string Message);

public record PolicyFailure(string RuleId, string Message);

public record PolicyOutcome(bool Allowed, PolicyFailure[] Failures);

public static class PolicyEngine
{
    private static readonly string[] Operators = ["gte", "lte", "eq", "in"];

    private static bool TryNumber(object? raw, out double number)
    {
        switch (raw)
        {
            case int or long or short or float or double or decimal:
                number = Convert.ToDouble(raw);
                return true;
            default:
                number = 0;
                return false;
        }
    }

    private static bool Holds(string op, object? fact, object? value)
    {
        var numbers = TryNumber(fact, out var left) & TryNumber(value, out var right);
        return op switch
        {
            "gte" => numbers && left >= right,
            "lte" => numbers && left <= right,
            "eq" => fact is string text ? value is string other && text == other : numbers && left == right,
            "in" => fact is string member && value is string[] options && options.Contains(member),
            _ => false,
        };
    }

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
