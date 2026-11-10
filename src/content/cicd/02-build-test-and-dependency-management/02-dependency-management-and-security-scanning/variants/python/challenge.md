Evaluate test coverage and dependency security scan metrics against quality gate policies.

### Requirements

Implement `evaluate_test_and_security_summary(summary, policy)`:
- `summary`: Dict `{ "lineCoveragePercent": float, "vulnerabilities": list[dict] }`, where each vulnerability is a dict with `id`, `package` and `severity`.
- `policy`: Dict `{ "minLineCoveragePercent": float, "securityThreshold": str }`.

Severity ranks: `low` (1), `medium` (2), `high` (3), `critical` (4).

Rules:
- If `lineCoveragePercent` is below `minLineCoveragePercent`, add the violation `"Line coverage <coverage>% is below minimum required <min>%"`. A coverage equal to the minimum passes.
- For each vulnerability whose severity rank is greater than or equal to the rank of `securityThreshold`, add the violation `"Vulnerability <id> (<severity>) in package <package> exceeds allowed threshold <threshold>"`. The comparison is inclusive: a `high` vulnerability blocks a `high` threshold, and a `high` vulnerability does not block a `critical` threshold.
- List the coverage violation first and then the vulnerabilities in the order they appear in the input.
- Return `{ "approved": bool, "violations": list[str] }`. `approved` is `True` when `violations` is empty.
