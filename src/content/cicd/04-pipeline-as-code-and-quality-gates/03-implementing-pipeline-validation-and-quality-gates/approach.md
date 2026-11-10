1. Compare each metric with its limit and add the matching message when it fails.
2. Return `PASSED` with no violations, or `BLOCKED` with the list.
3. In the override, return early when the gate already passed.
4. Refuse the override when the policy forbids it or the justification is blank.
5. Otherwise build the audit log from the author, the justification, the given time and a copy of the violations.
