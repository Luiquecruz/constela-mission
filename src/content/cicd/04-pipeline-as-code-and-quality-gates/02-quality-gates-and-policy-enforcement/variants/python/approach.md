1. Check that every rule uses a supported operator.
2. For each rule, look up the fact by field name.
3. Fail the rule when the fact is missing or the comparison does not hold.
4. Record the rule id and message of every failure, in rule order.
5. Return allowed when no rule failed.
