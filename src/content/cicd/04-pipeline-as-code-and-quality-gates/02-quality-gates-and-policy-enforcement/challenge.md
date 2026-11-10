Policy as code means the rules of a deployment gate live in data that can be reviewed, versioned and tested, instead of being buried in `if` statements. Write a small policy engine that evaluates declarative rules against facts about a release.

### Requirements

Export `evaluatePolicy(rules, facts)`, which returns `{ allowed, failures }`. Failures of the operator check are thrown as `Error`.

A rule is `{ id, field, operator, value, message }`. Facts are named numbers or strings.

Operators:

- `gte`: the fact is greater than or equal to the value.
- `lte`: the fact is less than or equal to the value.
- `eq`: the fact equals the value (same type).
- `in`: the value is a list of strings and the fact is one of them.

Evaluation:

1. Before evaluating anything, fail with `Unsupported operator: <operator>` if any rule uses another operator.
2. A rule fails when its field has no fact (the engine fails closed) or when its comparison is false.
3. Each failure is `{ ruleId, message }` with the rule's id and message, in the order of the rules.
4. The result is allowed only when no rule failed; an empty rule set is allowed.
