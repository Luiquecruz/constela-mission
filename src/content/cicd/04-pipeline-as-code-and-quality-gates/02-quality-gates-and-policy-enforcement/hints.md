Validate the operators first, over all rules, so a typo in the last rule cannot hide behind a failure in the first one.
---
Look each rule up in a table from operator name to comparison. Adding an operator then means adding one entry, not another `if`.
---
Decide what a missing fact means before you write the comparison: a gate that cannot measure something must not let the release through, so the rule fails.
---
Keep the failures in the order of the rules and build the final answer from them: allowed exactly when there are none.
